-- 016_work_history_rls.sql — granular policies untuk work_history
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- Gate bisnis (kedua rating dua arah lengkap) di-enforce service modul Rating;
-- RLS defense-in-depth (INSERT/UPDATE hanya pihak kontrak).

-- SELECT: talent owner, hirer pihak contract, admin
create policy "work_history_select_involved"
  on public.work_history for select to authenticated
  using (
    talent_id = auth.uid()
    or exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.hirer_id = auth.uid()
    )
    or is_admin()
  );

-- INSERT: pihak kontrak (seed PENDING dari side effect rating)
create policy "work_history_insert_involved"
  on public.work_history for insert to authenticated
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );

-- UPDATE: pihak kontrak (flip VERIFIED dari side effect rating)
create policy "work_history_update_involved"
  on public.work_history for update to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );
