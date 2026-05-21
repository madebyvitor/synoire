-- Weekly focus goal (onboarding) and stop auto daily goal defaults

alter table public.user_stats
  add column if not exists weekly_goal_minutes integer not null default 0;

alter table public.user_stats
  alter column daily_goal_minutes set default 0;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
      split_part(new.email, '@', 1),
      'estudante'
    )
  )
  on conflict (id) do nothing;

  insert into public.user_stats (
    user_id,
    current_streak,
    total_hours,
    daily_goal_minutes,
    weekly_goal_minutes
  )
  values (new.id, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
