-- 012_contract_rls.sql — granular policies untuk contracts + seed payments/works
-- Baseline 003: RLS enabled, default-deny, tanpa policy.

-- SELECT: talent, hirer, admin
create policy "contracts_select_involved"
  on public.contracts for select to authenticated
  using (
    talent_id = auth.uid()
    or hirer_id = auth.uid()
    or is_admin()
  );

-- INSERT: hirer owner; application SELECTED + meeting COMPLETED (defense-in-depth; service cek gate lengkap dulu)
create policy "contracts_insert_hirer"
  on public.contracts for insert to authenticated
  with check (
    hirer_id = auth.uid()
    and exists (
      select 1 from public.applications a
      join public.meetings m on m.application_id = a.id
      where a.id = application_id
        and a.status = 'SELECTED'
        and m.status = 'COMPLETED'
    )
  );

-- UPDATE: talent/hirer involved (transisi propose/agree/decline; edit DRAFT di-enforce service)
create policy "contracts_update_involved"
  on public.contracts for update to authenticated
  using (talent_id = auth.uid() or hirer_id = auth.uid())
  with check (talent_id = auth.uid() or hirer_id = auth.uid());

-- Seed insert: payment dibuat oleh pihak kontrak saat contract ACTIVE (side effects agree)
create policy "payments_insert_seed"
  on public.payments for insert to authenticated
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.status = 'ACTIVE'
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );

-- Seed insert: works row saat contract ACTIVE
create policy "works_insert_seed"
  on public.works for insert to authenticated
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.status = 'ACTIVE'
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );
