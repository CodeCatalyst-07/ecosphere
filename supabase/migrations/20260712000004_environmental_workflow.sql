-- EcoSphere S2: the official carbon ledger is server-calculated only.
create table public.operational_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid not null,
  factor_id uuid not null references public.emission_factors(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  occurred_on date not null,
  created_by uuid not null references public.profiles(id),
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint record_department_matches_organization foreign key (department_id, organization_id)
    references public.departments (id, organization_id)
);

create table public.carbon_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operational_record_id uuid not null unique references public.operational_records(id) on delete cascade,
  department_id uuid not null,
  tonnes_co2e numeric(14,3) not null check (tonnes_co2e >= 0),
  calculated_at timestamptz not null default now(),
  constraint transaction_department_matches_organization foreign key (department_id, organization_id)
    references public.departments (id, organization_id)
);

create index operational_records_organization_occurred_idx on public.operational_records (organization_id, occurred_on desc);
create index carbon_transactions_organization_department_idx on public.carbon_transactions (organization_id, department_id);

grant select on public.operational_records, public.carbon_transactions to authenticated;
alter table public.operational_records enable row level security;
alter table public.carbon_transactions enable row level security;
create policy "Read organization operational records" on public.operational_records for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Read organization carbon transactions" on public.carbon_transactions for select to authenticated
  using (organization_id = (select private.current_organization_id()));

-- Seed the existing demo narrative once. The service function owns all future writes.
insert into public.operational_records (id, organization_id, department_id, factor_id, quantity, unit, occurred_on, created_by, note) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011',
   (select id from public.emission_factors where organization_id = '00000000-0000-0000-0000-000000000001' and name = 'Diesel fleet fuel'),
   19850, 'litre', '2026-07-05', 'e8b08ca2-d653-4419-aee8-0da22ab60428', 'Regional fleet fuel, July to date');
insert into public.carbon_transactions (organization_id, operational_record_id, department_id, tonnes_co2e, calculated_at) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 53.200, '2026-07-05T00:00:00Z');

-- This is deliberately callable only by the Edge Function's service-role
-- client. It makes the record and its official carbon result one transaction.
create function public.record_carbon_activity(
  p_actor_id uuid, p_department_id uuid, p_factor_id uuid, p_quantity numeric,
  p_occurred_on date, p_note text default ''
) returns table (operational_record_id uuid, tonnes_co2e numeric)
language plpgsql security definer set search_path = '' as $$
declare
  v_organization_id uuid;
  v_role public.app_role;
  v_factor public.emission_factors%rowtype;
begin
  select organization_id, role into v_organization_id, v_role from public.profiles where id = p_actor_id;
  if v_organization_id is null or v_role not in ('admin', 'manager') then
    raise exception 'Only managers and admins can record operational activity';
  end if;
  if not exists (select 1 from public.departments where id = p_department_id and organization_id = v_organization_id) then
    raise exception 'Department is not in the user organization';
  end if;
  select * into v_factor from public.emission_factors where id = p_factor_id and organization_id = v_organization_id;
  if v_factor.id is null then raise exception 'Emission factor is not in the user organization'; end if;
  if p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  insert into public.operational_records (organization_id, department_id, factor_id, quantity, unit, occurred_on, created_by, note)
  values (v_organization_id, p_department_id, p_factor_id, p_quantity, v_factor.activity_unit, p_occurred_on, p_actor_id, coalesce(nullif(trim(p_note), ''), 'Operational activity'))
  returning id into operational_record_id;
  tonnes_co2e := round((p_quantity * v_factor.co2e_per_unit) / 1000, 3);
  insert into public.carbon_transactions (organization_id, operational_record_id, department_id, tonnes_co2e)
  values (v_organization_id, operational_record_id, p_department_id, tonnes_co2e);
  return next;
end;
$$;
revoke all on function public.record_carbon_activity(uuid, uuid, uuid, numeric, date, text) from public;
grant execute on function public.record_carbon_activity(uuid, uuid, uuid, numeric, date, text) to service_role;
