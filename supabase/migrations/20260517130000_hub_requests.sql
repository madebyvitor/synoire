create table public.hub_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint hub_requests_name_length check (
    char_length(trim(requested_name)) between 2 and 120
  )
);

create index hub_requests_status_created_idx
  on public.hub_requests (status, created_at desc);

alter table public.hub_requests enable row level security;

create policy "Users can insert own hub requests"
  on public.hub_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own hub requests"
  on public.hub_requests
  for select
  to authenticated
  using (auth.uid() = user_id);
