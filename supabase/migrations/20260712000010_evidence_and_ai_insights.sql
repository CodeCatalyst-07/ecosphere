-- EcoSphere S6: one private evidence file per participation and auditable AI output.
create table public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  participation_id uuid not null unique references public.challenge_participations(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  created_at timestamptz not null default now()
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  recommendation jsonb not null,
  source_metrics jsonb not null,
  created_at timestamptz not null default now()
);

create index evidence_files_organization_participation_idx on public.evidence_files (organization_id, participation_id);
create index ai_insights_organization_created_idx on public.ai_insights (organization_id, created_at desc);

grant select, insert, update on public.evidence_files to authenticated;
grant select on public.ai_insights to authenticated;
alter table public.evidence_files enable row level security;
alter table public.ai_insights enable row level security;

create policy "Read organization evidence metadata" on public.evidence_files for select to authenticated
  using (organization_id = (select private.current_organization_id()));
create policy "Attach own participation evidence" on public.evidence_files for insert to authenticated
  with check (
    organization_id = (select private.current_organization_id())
    and uploaded_by = (select auth.uid())
    and exists (
      select 1 from public.challenge_participations cp
      where cp.id = participation_id and cp.organization_id = (select private.current_organization_id())
        and cp.user_id = (select auth.uid()) and cp.status in ('draft', 'submitted')
    )
  );
create policy "Replace own unapproved evidence metadata" on public.evidence_files for update to authenticated
  using (uploaded_by = (select auth.uid()))
  with check (
    organization_id = (select private.current_organization_id()) and uploaded_by = (select auth.uid())
    and exists (select 1 from public.challenge_participations cp where cp.id = participation_id and cp.user_id = (select auth.uid()) and cp.status in ('draft', 'submitted'))
  );
create policy "Read organization AI insights" on public.ai_insights for select to authenticated
  using (organization_id = (select private.current_organization_id()));

-- Private bucket. Objects use {organization_id}/{user_id}/{participation_id}/evidence.ext.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Upload evidence to own organization path" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = (select private.current_organization_id())::text
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "Update own evidence object" on storage.objects for update to authenticated
  using (bucket_id = 'evidence' and owner_id = (select auth.uid()::text))
  with check (bucket_id = 'evidence' and owner_id = (select auth.uid()::text));
create policy "Read organization evidence objects" on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = (select private.current_organization_id())::text
  );
