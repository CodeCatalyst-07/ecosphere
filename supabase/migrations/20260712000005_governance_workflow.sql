-- EcoSphere S3: policy acknowledgement and accountable compliance workflow.
create type public.compliance_severity as enum ('low', 'medium', 'high');
create type public.compliance_status as enum ('open', 'in-progress', 'resolved');

-- Needed for organization-consistent ownership foreign keys.
alter table public.profiles add constraint profiles_id_organization_key unique (id, organization_id);

create table public.policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'acknowledged' check (status = 'acknowledged'),
  acknowledged_at timestamptz not null default now(),
  unique (policy_id, user_id)
);

create table public.compliance_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid not null,
  owner_id uuid not null,
  title text not null check (char_length(trim(title)) > 0),
  severity public.compliance_severity not null default 'medium',
  status public.compliance_status not null default 'open',
  due_date date not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint issue_department_matches_organization foreign key (department_id, organization_id)
    references public.departments (id, organization_id),
  constraint issue_owner_matches_organization foreign key (owner_id, organization_id)
    references public.profiles (id, organization_id)
);

create index policy_acknowledgements_policy_id_idx on public.policy_acknowledgements (policy_id);
create index compliance_issues_organization_due_date_idx on public.compliance_issues (organization_id, due_date);

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public;

-- Overdue is intentionally derived at read time: it cannot become stale when a
-- calendar day changes and a resolved record is never overdue.
create view public.compliance_issue_status with (security_invoker = true) as
  select compliance_issues.*, (status <> 'resolved' and due_date < current_date) as is_overdue
  from public.compliance_issues;

grant select on public.policy_acknowledgements, public.compliance_issues, public.compliance_issue_status to authenticated;
grant insert, update on public.policy_acknowledgements to authenticated;
grant insert, update, delete on public.compliance_issues to authenticated;

alter table public.policy_acknowledgements enable row level security;
alter table public.compliance_issues enable row level security;

create policy "Read organization policy acknowledgements" on public.policy_acknowledgements for select to authenticated
  using (exists (select 1 from public.policies p where p.id = policy_id and p.organization_id = (select private.current_organization_id())));
create policy "Read organization profiles for governance" on public.profiles for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Acknowledge own policy" on public.policy_acknowledgements for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'acknowledged' and exists (select 1 from public.policies p where p.id = policy_id and p.organization_id = (select private.current_organization_id())));
create policy "Update own acknowledgement" on public.policy_acknowledgements for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and status = 'acknowledged');

create policy "Read organization compliance issues" on public.compliance_issues for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Managers create compliance issues" on public.compliance_issues for insert to authenticated
  with check (organization_id = (select private.current_organization_id()) and created_by = (select auth.uid()) and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'manager')));
create policy "Managers update compliance issues" on public.compliance_issues for update to authenticated
  using (organization_id = (select private.current_organization_id()) and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'manager')))
  with check (organization_id = (select private.current_organization_id()) and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'manager')));
create policy "Managers delete compliance issues" on public.compliance_issues for delete to authenticated
  using (organization_id = (select private.current_organization_id()) and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'manager')));

create trigger compliance_issues_set_updated_at before update on public.compliance_issues
  for each row execute function private.set_updated_at();

insert into public.policy_acknowledgements (policy_id, user_id, acknowledged_at) values
  ((select id from public.policies where organization_id = '00000000-0000-0000-0000-000000000001' and title = 'Responsible Operations Code' and version = '3.2'), '92d71628-a8f8-4e35-9a42-7e4e65dddc65', '2026-06-16T00:00:00Z'),
  ((select id from public.policies where organization_id = '00000000-0000-0000-0000-000000000001' and title = 'Responsible Operations Code' and version = '3.2'), '84cf2591-6171-4068-9b3e-7fc527dde253', '2026-06-16T00:00:00Z');
insert into public.compliance_issues (organization_id, department_id, owner_id, title, severity, status, due_date, created_by) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'e8b08ca2-d653-4419-aee8-0da22ab60428', 'Fleet emissions evidence overdue', 'high', 'open', '2026-07-08', '92d71628-a8f8-4e35-9a42-7e4e65dddc65');
