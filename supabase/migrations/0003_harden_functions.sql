-- Security hardening: move internal-only functions (the admin-role
-- check used by RLS policies, and the new-user trigger) into a
-- non-exposed schema so they cannot be called directly as a public REST
-- RPC endpoint (PostgREST only exposes the `public` schema by default).
-- Also pin search_path on every function to close the "mutable
-- search_path" lint. Written after running `supabase get_advisors` (type
-- "security") against the live project and finding these two issues.

create schema if not exists private;

-- is_admin(): drop and recreate in `private`, then repoint every policy
-- that used it at the new location.
drop policy "read own profile" on public.profiles;
drop policy "admin writes verticals" on public.verticals;
drop policy "admin writes srs_config" on public.srs_config;
drop policy "admin writes exclusive_groups" on public.exclusive_groups;
drop policy "admin writes connection_group_caps" on public.connection_group_caps;
drop policy "admin writes agents" on public.agents;
drop policy "admin writes completions" on public.agent_category_completions;
drop policy "admin writes history" on public.agent_score_history;
drop policy "admin writes snapshot" on public.agent_monthly_snapshot;

drop function public.is_admin();

create function private.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public, private;

create policy "read own profile" on public.profiles for select to authenticated
  using (user_id = auth.uid() or private.is_admin());
create policy "admin writes verticals" on public.verticals for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin writes srs_config" on public.srs_config for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin writes exclusive_groups" on public.exclusive_groups for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin writes connection_group_caps" on public.connection_group_caps for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin writes agents" on public.agents for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin writes completions" on public.agent_category_completions for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin writes history" on public.agent_score_history for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin writes snapshot" on public.agent_monthly_snapshot for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- handle_new_user(): drop and recreate in `private`, then repoint the
-- auth.users trigger at the new location.
drop trigger on_auth_user_created on auth.users;
drop function public.handle_new_user();

create function private.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, role, full_name)
  values (new.id, 'viewer', new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public, private;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

-- set_updated_at() stays in public (only ever invoked from triggers on
-- public tables, never callable with useful effect as a bare RPC), but
-- pin its search_path to close the mutable-search-path lint.
alter function public.set_updated_at() set search_path = public;
