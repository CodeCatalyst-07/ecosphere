-- S4 repair: a repeat submission is an UPDATE of the employee's existing
-- challenge row, while a first submission is an INSERT. Keep both paths
-- explicit and scoped to the authenticated employee.
drop policy if exists "Submit own challenge participation" on public.challenge_participations;
drop policy if exists "Update own unapproved participation" on public.challenge_participations;

create policy "Employees insert own challenge participation"
  on public.challenge_participations for insert to authenticated
  with check (
    organization_id = (select private.current_organization_id())
    and user_id = (select auth.uid())
    and status in ('draft', 'submitted')
    and approved_at is null
    and approved_by is null
    and exists (
      select 1 from public.challenges c
      where c.id = challenge_id
        and c.organization_id = (select private.current_organization_id())
    )
  );

create policy "Employees update own unapproved participation"
  on public.challenge_participations for update to authenticated
  using (
    organization_id = (select private.current_organization_id())
    and user_id = (select auth.uid())
    and status in ('draft', 'submitted')
  )
  with check (
    organization_id = (select private.current_organization_id())
    and user_id = (select auth.uid())
    and status in ('draft', 'submitted')
    and approved_at is null
    and approved_by is null
    and exists (
      select 1 from public.challenges c
      where c.id = challenge_id
        and c.organization_id = (select private.current_organization_id())
    )
  );
