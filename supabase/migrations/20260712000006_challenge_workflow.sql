-- EcoSphere S4: employee challenge submissions, recognition, and safe approval.
create type public.participation_status as enum ('draft', 'submitted', 'approved');

create table public.challenge_participations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  progress integer not null check (progress between 1 and 100),
  evidence text not null check (char_length(trim(evidence)) > 0),
  status public.participation_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  unique (challenge_id, user_id),
  check ((status = 'approved') = (approved_at is not null and approved_by is not null))
);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  participation_id uuid unique references public.challenge_participations(id) on delete cascade,
  points integer not null check (points > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.employee_badges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  awarded_at timestamptz not null default now(),
  unique (user_id, name)
);

create index challenge_participations_organization_challenge_idx on public.challenge_participations (organization_id, challenge_id);
create index points_ledger_organization_user_idx on public.points_ledger (organization_id, user_id);
create index employee_badges_organization_user_idx on public.employee_badges (organization_id, user_id);

grant select on public.challenge_participations, public.points_ledger, public.employee_badges to authenticated;
grant insert, update on public.challenge_participations to authenticated;
alter table public.challenge_participations enable row level security;
alter table public.points_ledger enable row level security;
alter table public.employee_badges enable row level security;

create policy "Read organization challenge participations" on public.challenge_participations for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Submit own challenge participation" on public.challenge_participations for insert to authenticated
  with check (
    organization_id = (select private.current_organization_id())
    and user_id = (select auth.uid())
    and status in ('draft', 'submitted')
    and exists (select 1 from public.challenges c where c.id = challenge_id and c.organization_id = (select private.current_organization_id()))
  );
create policy "Update own unapproved participation" on public.challenge_participations for update to authenticated
  using (user_id = (select auth.uid()) and status in ('draft', 'submitted'))
  with check (
    organization_id = (select private.current_organization_id())
    and user_id = (select auth.uid())
    and status in ('draft', 'submitted')
    and approved_at is null and approved_by is null
  );
create policy "Read organization points" on public.points_ledger for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Read organization badges" on public.employee_badges for select to authenticated
  using (organization_id = (select private.current_organization_id()));

-- Seed the existing engagement narrative. Future awards are written only here.
insert into public.challenge_participations (id, organization_id, challenge_id, user_id, progress, evidence, status, submitted_at) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001',
   (select id from public.challenges where organization_id = '00000000-0000-0000-0000-000000000001' and title = 'Low-carbon commute week'),
   '84cf2591-6171-4068-9b3e-7fc527dde253', 80, 'Five verified low-carbon commutes', 'submitted', '2026-07-10T00:00:00Z');
insert into public.points_ledger (organization_id, user_id, points, reason, created_at) values
  ('00000000-0000-0000-0000-000000000001', '84cf2591-6171-4068-9b3e-7fc527dde253',
   180, 'Commute challenge progress', '2026-07-10T00:00:00Z');
insert into public.employee_badges (organization_id, user_id, name, awarded_at) values
  ('00000000-0000-0000-0000-000000000001', '84cf2591-6171-4068-9b3e-7fc527dde253', 'Momentum Maker', '2026-07-09T00:00:00Z');

create function public.approve_challenge_participation(p_actor_id uuid, p_participation_id uuid)
returns table (points integer, awarded_badge text)
language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles%rowtype;
  v_participation public.challenge_participations%rowtype;
  v_challenge public.challenges%rowtype;
  v_total_points integer;
begin
  select * into v_actor from public.profiles where id = p_actor_id;
  if v_actor.id is null or v_actor.role not in ('admin', 'manager') then
    raise exception 'Only managers and admins can approve participation';
  end if;
  select * into v_participation from public.challenge_participations where id = p_participation_id for update;
  if v_participation.id is null or v_participation.organization_id <> v_actor.organization_id then
    raise exception 'Participation is not in the user organization';
  end if;
  if v_participation.status <> 'submitted' then
    raise exception 'Only submitted participation can be approved';
  end if;
  select * into v_challenge from public.challenges where id = v_participation.challenge_id and organization_id = v_actor.organization_id;
  if v_challenge.id is null then raise exception 'Challenge is not in the user organization'; end if;
  update public.challenge_participations set status = 'approved', approved_at = now(), approved_by = p_actor_id where id = p_participation_id;
  insert into public.points_ledger (organization_id, user_id, participation_id, points, reason)
    values (v_actor.organization_id, v_participation.user_id, p_participation_id, v_challenge.point_reward, 'Approved: ' || v_challenge.title);
  select coalesce(sum(ledger.points), 0)::integer into v_total_points from public.points_ledger as ledger where ledger.user_id = v_participation.user_id;
  points := v_challenge.point_reward;
  awarded_badge := null;
  if v_total_points >= 400 then
    insert into public.employee_badges (organization_id, user_id, name)
      values (v_actor.organization_id, v_participation.user_id, 'Climate Champion')
      on conflict (user_id, name) do nothing
      returning name into awarded_badge;
  end if;
  return next;
end;
$$;
revoke all on function public.approve_challenge_participation(uuid, uuid) from public;
grant execute on function public.approve_challenge_participation(uuid, uuid) to service_role;
