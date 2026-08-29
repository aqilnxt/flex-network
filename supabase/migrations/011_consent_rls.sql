-- 011_consent_rls.sql — granular policies untuk consents
-- Baseline 003: RLS enabled, default-deny, tanpa policy.

-- SELECT: talent pemilik consent, hirer owner opportunity, admin
create policy "consents_select_involved"
  on public.consents for select to authenticated
  using (
    talent_id = auth.uid()
    or exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
    or is_admin()
  );

-- INSERT: talent owner; application SELECTED + meeting COMPLETED (defense-in-depth; service cek dulu)
create policy "consents_insert_talent"
  on public.consents for insert to authenticated
  with check (
    talent_id = auth.uid()
    and exists (
      select 1 from public.applications a
      join public.meetings m on m.application_id = a.id
      where a.id = application_id
        and a.status = 'SELECTED'
        and m.status = 'COMPLETED'
    )
  );

-- UPDATE: talent owner saja (transisi approve/reject); hirer tidak pernah update
create policy "consents_update_talent"
  on public.consents for update to authenticated
  using (talent_id = auth.uid())
  with check (talent_id = auth.uid());
