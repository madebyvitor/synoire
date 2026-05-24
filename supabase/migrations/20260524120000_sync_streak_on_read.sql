-- Streak: recompute from sessions on write; restrict compute RPC to own user

create or replace function public.compute_streak_from_sessions(p_user_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/Sao_Paulo', now()))::date;
  v_cursor date;
  v_streak integer := 0;
  v_i integer := 0;
begin
  if auth.uid() is not null and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  if not exists (
    select 1
    from public.study_sessions s
    where s.user_id = p_user_id
  ) then
    return 0;
  end if;

  if exists (
    select 1
    from public.study_sessions s
    where s.user_id = p_user_id
      and (timezone('America/Sao_Paulo', s.created_at))::date = v_today
  ) then
    v_cursor := v_today;
  else
    v_cursor := v_today - 1;
  end if;

  loop
    exit when v_i >= 400;

    if not exists (
      select 1
      from public.study_sessions s
      where s.user_id = p_user_id
        and (timezone('America/Sao_Paulo', s.created_at))::date = v_cursor
    ) then
      exit;
    end if;

    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
    v_i := v_i + 1;
  end loop;

  return v_streak;
end;
$$;

create or replace function public.record_study_time(
  p_room_id uuid,
  p_duration_minutes integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_duration_minutes < 1 then
    raise exception 'duration must be at least 1 minute';
  end if;

  if not exists (select 1 from public.rooms where id = p_room_id) then
    raise exception 'room not found';
  end if;

  insert into public.user_stats (user_id, current_streak, total_hours, daily_goal_minutes)
  values (v_user_id, 0, 0, 240)
  on conflict (user_id) do nothing;

  perform 1
  from public.user_stats
  where user_id = v_user_id
  for update;

  insert into public.study_sessions (user_id, room_id, duration_minutes)
  values (v_user_id, p_room_id, p_duration_minutes)
  returning id into v_session_id;

  update public.user_stats
  set
    total_hours = total_hours + (p_duration_minutes::numeric / 60.0),
    current_streak = public.compute_streak_from_sessions(v_user_id),
    updated_at = now()
  where user_id = v_user_id;

  return v_session_id;
end;
$$;

revoke all on function public.record_study_time(uuid, integer) from public;
grant execute on function public.record_study_time(uuid, integer) to authenticated;

revoke all on function public.compute_streak_from_sessions(uuid) from public;
grant execute on function public.compute_streak_from_sessions(uuid) to authenticated;
