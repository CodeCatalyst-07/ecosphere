-- Correct the S4 approval function in projects where migration 00006 was
-- already applied. `points` is both the output parameter and a ledger column.
create or replace function public.approve_challenge_participation(p_actor_id uuid, p_participation_id uuid)
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
  select coalesce(sum(ledger.points), 0)::integer into v_total_points
    from public.points_ledger as ledger where ledger.user_id = v_participation.user_id;
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
