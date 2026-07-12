-- EcoSphere S1: Auth-backed, single-organization MVP.
-- Apply this migration to the intended Supabase project before enabling the
-- Supabase UI flow. Auth accounts are intentionally created separately.

create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum ('admin', 'manager', 'employee');
create type public.factor_category as enum ('fleet', 'electricity', 'waste');
create type public.goal_status as enum ('on-track', 'at-risk', 'off-track');
create type public.policy_role as enum ('admin', 'manager', 'employee', 'all');
create type public.challenge_status as enum ('active', 'upcoming', 'complete');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text not null,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  carbon_target_tonnes numeric(12,3) not null check (carbon_target_tonnes >= 0),
  unique (organization_id, name),
  unique (id, organization_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  department_id uuid not null references public.departments(id),
  full_name text not null,
  initials text not null check (char_length(initials) between 1 and 4),
  title text not null,
  role public.app_role not null default 'employee',
  created_at timestamptz not null default now(),
  constraint profile_department_matches_organization foreign key (department_id, organization_id)
    references public.departments (id, organization_id)
);

create table public.emission_factors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  activity_unit text not null,
  co2e_per_unit numeric(14,6) not null check (co2e_per_unit >= 0),
  source text not null,
  category public.factor_category not null,
  created_at timestamptz not null default now()
);

create table public.sustainability_goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid not null,
  title text not null,
  target_tonnes numeric(12,3) not null check (target_tonnes >= 0),
  target_date date not null,
  status public.goal_status not null default 'on-track',
  constraint goal_department_matches_organization foreign key (department_id, organization_id)
    references public.departments (id, organization_id)
);

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  version text not null,
  published_on date not null,
  required_role public.policy_role not null default 'all',
  unique (organization_id, title, version)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  point_reward integer not null check (point_reward > 0),
  status public.challenge_status not null default 'upcoming',
  check (ends_on >= starts_on)
);

create index departments_organization_id_idx on public.departments (organization_id);
create index profiles_organization_id_idx on public.profiles (organization_id);
create index emission_factors_organization_id_idx on public.emission_factors (organization_id);
create index sustainability_goals_organization_department_idx on public.sustainability_goals (organization_id, department_id);
create index policies_organization_id_idx on public.policies (organization_id);
create index challenges_organization_id_idx on public.challenges (organization_id);

-- This non-exposed helper avoids repeating a profiles lookup in every policy.
create function private.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.profiles where id = (select auth.uid())
$$;
revoke all on function private.current_organization_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_organization_id() to authenticated;

grant select on public.organizations, public.departments, public.profiles,
  public.emission_factors, public.sustainability_goals, public.policies, public.challenges
  to authenticated;

alter table public.organizations enable row level security;
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.emission_factors enable row level security;
alter table public.sustainability_goals enable row level security;
alter table public.policies enable row level security;
alter table public.challenges enable row level security;

create policy "Read own organization" on public.organizations for select to authenticated
  using (id = (select private.current_organization_id()));
create policy "Read organization departments" on public.departments for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Read organization emission factors" on public.emission_factors for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Read organization goals" on public.sustainability_goals for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Read organization policies" on public.policies for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Read organization challenges" on public.challenges for select to authenticated
  using (organization_id = (select private.current_organization_id()));

-- Static Atlas narrative. Insert profiles only after creating the three Auth users.
insert into public.organizations (id, name, sector, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'Atlas Industries', 'Advanced manufacturing', '2026-01-08T00:00:00Z');
insert into public.departments (id, organization_id, name, carbon_target_tonnes) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Operations', 42),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Product', 16),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'People', 8);
insert into public.emission_factors (organization_id, name, activity_unit, co2e_per_unit, source, category) values
  ('00000000-0000-0000-0000-000000000001', 'Diesel fleet fuel', 'litre', 2.68, 'DEFRA 2025', 'fleet'),
  ('00000000-0000-0000-0000-000000000001', 'Grid electricity', 'kWh', 0.42, 'IEA India 2025', 'electricity'),
  ('00000000-0000-0000-0000-000000000001', 'Landfill waste', 'kg', 0.58, 'EPA 2025', 'waste');
insert into public.sustainability_goals (organization_id, department_id, title, target_tonnes, target_date, status) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Keep fleet emissions below 42 tCO2e', 42, '2026-07-31', 'off-track');
insert into public.policies (organization_id, title, version, published_on, required_role) values
  ('00000000-0000-0000-0000-000000000001', 'Responsible Operations Code', '3.2', '2026-06-15', 'all');
insert into public.challenges (organization_id, title, starts_on, ends_on, point_reward, status) values
  ('00000000-0000-0000-0000-000000000001', 'Low-carbon commute week', '2026-07-06', '2026-07-31', 300, 'active');
