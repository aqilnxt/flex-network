-- 014_payment_rls.sql — granular policies untuk payments
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- INSERT (seed saat contract ACTIVE) sudah ada di 012_contract_rls.sql.
-- Kedua transisi (SIMULATED_PAID, RELEASED) aktornya HIRER — state machine di-enforce service.

-- SELECT: talent/hirer pihak contract, admin
create policy "payments_select_involved"
  on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
    or is_admin()
  );

-- UPDATE: hanya hirer pihak contract (aktor SIMULATED_PAID & RELEASED; talent read-only)
create policy "payments_update_hirer"
  on public.payments for update to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.hirer_id = auth.uid()
    )
  );
