-- Row Level Security: viewers can read everything; only admins can write
-- to config tables (verticals, srs_config, exclusive_groups,
-- connection_group_caps). Agent operational data is read-only from the
-- app for everyone and is expected to be loaded by a trusted pipeline
-- (service role key), same as admins for config.

alter table public.verticals enable row level security;
alter table public.srs_config enable row level security;
alter table public.exclusive_groups enable row level security;
alter table public.connection_group_caps enable row level security;
alter table public.agents enable row level security;
alter table public.agent_category_completions enable row level security;
alter table public.agent_score_history enable row level security;
alter table public.agent_monthly_snapshot enable row level security;
alter table public.profiles enable row level security;

-- Read access: any authenticated user
create policy "read verticals" on public.verticals for select to authenticated using (true);
create policy "read srs_config" on public.srs_config for select to authenticated using (true);
create policy "read exclusive_groups" on public.exclusive_groups for select to authenticated using (true);
create policy "read connection_group_caps" on public.connection_group_caps for select to authenticated using (true);
create policy "read agents" on public.agents for select to authenticated using (true);
create policy "read completions" on public.agent_category_completions for select to authenticated using (true);
create policy "read history" on public.agent_score_history for select to authenticated using (true);
create policy "read snapshot" on public.agent_monthly_snapshot for select to authenticated using (true);

-- Profiles: everyone can read their own row; admins can read all
create policy "read own profile" on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "update own profile name" on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admin-only writes on config tables
create policy "admin writes verticals" on public.verticals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin writes srs_config" on public.srs_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin writes exclusive_groups" on public.exclusive_groups for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin writes connection_group_caps" on public.connection_group_caps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Agent operational data: admins can write from the app too (e.g. a
-- manual correction); regular data loads should use the service role key
-- from your ETL/pipeline, which bypasses RLS entirely.
create policy "admin writes agents" on public.agents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin writes completions" on public.agent_category_completions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin writes history" on public.agent_score_history for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin writes snapshot" on public.agent_monthly_snapshot for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
