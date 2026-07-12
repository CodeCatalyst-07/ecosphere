-- Prevent the dashboard-created automatic-RLS trigger helper from being exposed
-- as a public RPC, while leaving it available to its database trigger.
revoke execute on function public.rls_auto_enable() from anon, authenticated;

-- Cover both the simple department FK and the organization-consistency FK.
create index profiles_department_organization_idx
  on public.profiles (department_id, organization_id);
create index sustainability_goals_department_organization_idx
  on public.sustainability_goals (department_id, organization_id);
