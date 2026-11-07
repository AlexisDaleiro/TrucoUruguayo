-- Initial empty schema. All player-owned data is private by default.
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check (char_length(nickname) between 2 and 24),
 xp integer not null default 0 check (xp >= 0),
 mmr integer not null default 1000,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create table public.economy_config (id text primary key, config jsonb not null);
alter table public.economy_config enable row level security;
revoke all on public.economy_config from anon, authenticated;
grant select on public.economy_config to authenticated;
create policy read_config on public.economy_config for select to authenticated using (true);
