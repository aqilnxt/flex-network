-- 013_work_rls.sql — granular policies untuk works
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- INSERT (seed saat contract ACTIVE) sudah ada di 012_contract_rls.sql.
-- Perbedaan peran (talent transisi vs hirer confirm) di-enforce service.

-- SELECT: talent/hirer pihak contract, admin
create policy "works_select_involved"
  on public.works for select to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
    or is_admin()
  );

-- UPDATE: talent transisi status / hirer confirm (state machine di-enforce service)
create policy "works_update_involved"
  on public.works for update to authenticated
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
