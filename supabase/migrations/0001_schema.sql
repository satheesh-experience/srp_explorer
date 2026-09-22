-- SRS Calculation Explorer — production schema
-- Mirrors the data model embedded in the original prototype:
-- verticals -> srs_config (category/sub-category/points rules),
-- exclusive scoring groups (Google connection, load time, review source),
-- capped connection groups (per-vertical "any N of M" rules),
-- agents + their completions, score history, and monthly snapshots.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Config tables (admin-editable, everyone can read)
-- ---------------------------------------------------------------------

create table public.verticals (
  vertical_id   integer primary key,
  vertical_name text not null,
  header_id     integer,
  header_name   text,
  header_score  numeric,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.srs_config (
  id                integer generated always as identity primary key,
  vertical_id       integer not null references public.verticals(vertical_id) on delete cascade,
  category_id       integer not null,
  category_name     text not null,
  sub_category_id   integer not null,
  sub_category_name text not null,
  component_limit   numeric not null default 0,
  points            numeric not null default 0,
  no_of_days        numeric not null default 0,
  total_score       numeric not null default 0,
  is_per_item       boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (vertical_id, category_id, sub_category_id)
);
create index srs_config_vertical_idx on public.srs_config (vertical_id);
create index srs_config_category_idx on public.srs_config (category_name);

-- Static, hand-authored exclusive/priority scoring rules (mirrors the
-- EXCLUSIVE_GROUPS constant in the prototype). Rare to change, so this is
-- a small admin-editable table rather than derived data.
create table public.exclusive_groups (
  group_key      text primary key,
  group_label    text not null,
  category_key   text not null,
  group_type     text not null check (group_type in ('top_n', 'path_priority')),
  cap            integer,
  selection_kind text not null default 'exclusive' check (selection_kind in ('exclusive', 'capped')),
  explainer      text,
  full_marks_hint text,
  paths          jsonb, -- for path_priority: [{path_key,path_label,members:[...]}]
  members        jsonb, -- for top_n: ["member_a","member_b",...]
  created_at     timestamptz not null default now()
);

-- Per-vertical "any N of these M connections count" rules.
create table public.connection_group_caps (
  id                  integer generated always as identity primary key,
  vertical_id         integer not null references public.verticals(vertical_id) on delete cascade,
  connections_list    text[] not null,
  srs_max_connections integer not null,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Operational / agent data (read for all authenticated users)
-- ---------------------------------------------------------------------

create table public.agents (
  agent_id    integer primary key,
  vertical_id integer not null references public.verticals(vertical_id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index agents_vertical_idx on public.agents (vertical_id);

create table public.agent_category_completions (
  id            integer generated always as identity primary key,
  agent_id      integer not null references public.agents(agent_id) on delete cascade,
  vertical_id   integer not null references public.verticals(vertical_id) on delete cascade,
  category_name text not null,
  completed     jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  unique (agent_id, category_name)
);
create index completions_agent_idx on public.agent_category_completions (agent_id);

create table public.agent_score_history (
  id                integer generated always as identity primary key,
  agent_id          integer not null references public.agents(agent_id) on delete cascade,
  category_name     text not null,
  sub_category_name text not null,
  peak_score        numeric not null,
  peak_period       text,
  created_at        timestamptz not null default now()
);
create index history_agent_idx on public.agent_score_history (agent_id);

create table public.agent_monthly_snapshot (
  agent_id             integer primary key references public.agents(agent_id) on delete cascade,
  previous_month_score numeric not null,
  month_label          text,
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Auth / roles
-- ---------------------------------------------------------------------

create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('viewer', 'admin')),
  full_name  text,
  created_at timestamptz not null default now()
);

-- New signups default to 'viewer'; promote to 'admin' by hand in the
-- Supabase table editor (or a service-role script) once you trust them.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, role, full_name)
  values (new.id, 'viewer', new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- updated_at bookkeeping
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger verticals_set_updated_at before update on public.verticals
  for each row execute procedure public.set_updated_at();
create trigger srs_config_set_updated_at before update on public.srs_config
  for each row execute procedure public.set_updated_at();
create trigger completions_set_updated_at before update on public.agent_category_completions
  for each row execute procedure public.set_updated_at();
