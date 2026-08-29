-- 010_meeting_rls.sql — granular policies untuk meetings
-- Baseline 003: RLS enabled, default-deny, tanpa policy.

-- SELECT: hirer owner opportunity, talent pemilik application, admin
create policy "meetings_select_involved"
  on public.meetings for select to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id
        and (o.hirer_id = auth.uid() or a.talent_id = auth.uid())
    )
    or is_admin()
  );

-- INSERT: hirer owner; application harus SELECTED (defense-in-depth)
create policy "meetings_insert_hirer"
  on public.meetings for insert to authenticated
  with check (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id
        and o.hirer_id = auth.uid()
        and a.status = 'SELECTED'
    )
  );

-- UPDATE: hirer owner (transisi complete/cancel)
create policy "meetings_update_hirer"
  on public.meetings for update to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
  );
