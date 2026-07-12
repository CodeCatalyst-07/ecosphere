-- EcoSphere S5: one organization-scoped, server-calculated read model for
-- the Command Center and executive report. The UI must not calculate scores.
create function public.get_dashboard()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with current_profile as (
    select organization_id
    from public.profiles
    where id = (select auth.uid())
  ),
  department_metrics as (
    select d.id, d.name, d.carbon_target_tonnes,
      coalesce(sum(ct.tonnes_co2e), 0)::numeric as actual_tonnes
    from public.departments d
    join current_profile cp on cp.organization_id = d.organization_id
    left join public.carbon_transactions ct
      on ct.department_id = d.id and ct.organization_id = d.organization_id
    group by d.id, d.name, d.carbon_target_tonnes
  ),
  environmental as (
    select greatest(20, round(100 - avg(actual_tonnes / nullif(carbon_target_tonnes, 0)) * 36))::integer as score
    from department_metrics
  ),
  governance_metrics as (
    select count(*) filter (where ci.status <> 'resolved')::integer as active_risks,
      count(*) filter (where ci.status <> 'resolved' and ci.due_date < current_date)::integer as overdue_risks
    from public.compliance_issues ci
    join current_profile cp on cp.organization_id = ci.organization_id
  ),
  governance as (
    select greatest(15, 87 - active_risks * 9 - overdue_risks * 12)::integer as score
    from governance_metrics
  ),
  participation_metrics as (
    select count(cp.id)::integer as participation_count,
      coalesce(round(avg(cp.progress)), 0)::integer as average_progress,
      count(cp.id) filter (where cp.status = 'submitted')::integer as awaiting_review,
      count(cp.id) filter (where cp.status = 'approved')::integer as approved_count,
      coalesce(sum(c.point_reward) filter (where cp.status = 'submitted'), 0)::integer as points_awaiting_approval
    from public.challenge_participations cp
    join public.challenges c on c.id = cp.challenge_id and c.status = 'active'
    join current_profile profile on profile.organization_id = cp.organization_id
  ),
  social as (
    select case when participation_count = 0 then 50
      else least(100, round(45 + average_progress * .35 + approved_count * 20))::integer end as score
    from participation_metrics
  ),
  scores as (
    select environmental.score as environmental, social.score as social, governance.score as governance,
      round(environmental.score * .4 + social.score * .3 + governance.score * .3)::integer as esg
    from environmental cross join social cross join governance
  ),
  acknowledgement_metrics as (
    select count(pa.id) filter (where pa.status = 'acknowledged')::integer as acknowledged,
      count(p.id)::integer as total_users
    from public.profiles p
    join current_profile cp on cp.organization_id = p.organization_id
    left join public.policy_acknowledgements pa on pa.user_id = p.id
  )
  select jsonb_build_object(
    'organization_name', (select o.name from public.organizations o join current_profile cp on cp.organization_id = o.id),
    'as_of_date', current_date,
    'scores', (select jsonb_build_object('esg', esg, 'environmental', environmental, 'social', social, 'governance', governance) from scores),
    'carbon_footprint_tonnes', (select coalesce(sum(actual_tonnes), 0) from department_metrics),
    'department_ranking', (select coalesce(jsonb_agg(jsonb_build_object(
      'department_id', id, 'name', name, 'actual_tonnes', actual_tonnes,
      'target_tonnes', carbon_target_tonnes,
      'percentage_used', case when carbon_target_tonnes = 0 then 0 else round(actual_tonnes / carbon_target_tonnes * 100) end
    ) order by actual_tonnes / nullif(carbon_target_tonnes, 0) desc nulls last), '[]'::jsonb) from department_metrics),
    'carbon_goals', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', g.id, 'title', g.title, 'target_tonnes', g.target_tonnes, 'target_date', g.target_date,
      'status', g.status, 'actual_tonnes', coalesce(dm.actual_tonnes, 0),
      'variance_tonnes', greatest(coalesce(dm.actual_tonnes, 0) - g.target_tonnes, 0),
      'percentage_used', case when g.target_tonnes = 0 then 0 else round(coalesce(dm.actual_tonnes, 0) / g.target_tonnes * 100) end
    ) order by g.target_date), '[]'::jsonb)
      from public.sustainability_goals g join current_profile cp on cp.organization_id = g.organization_id
      left join department_metrics dm on dm.id = g.department_id),
    'governance_alerts', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', ci.id, 'title', ci.title, 'severity', ci.severity, 'due_date', ci.due_date,
      'is_overdue', ci.due_date < current_date, 'owner_name', p.full_name
    ) order by (ci.due_date < current_date) desc, ci.severity desc, ci.due_date), '[]'::jsonb)
      from public.compliance_issues ci join current_profile cp on cp.organization_id = ci.organization_id
      join public.profiles p on p.id = ci.owner_id where ci.status <> 'resolved'),
    'governance', (select jsonb_build_object('active_risks', active_risks, 'overdue_risks', overdue_risks,
      'acknowledgement_rate', case when total_users = 0 then 0 else round(acknowledged::numeric / total_users * 100) end)
      from governance_metrics cross join acknowledgement_metrics),
    'participation', (select jsonb_build_object('average_progress', average_progress, 'participation_count', participation_count,
      'awaiting_review', awaiting_review, 'approved_count', approved_count, 'points_awaiting_approval', points_awaiting_approval)
      from participation_metrics)
  );
$$;

revoke all on function public.get_dashboard() from public;
grant execute on function public.get_dashboard() to authenticated;
