alter table public.user_stats
  add column if not exists has_seen_welcome boolean not null default false;

-- Existing users should not see the welcome modal again
update public.user_stats
  set has_seen_welcome = true
  where has_seen_welcome = false;
