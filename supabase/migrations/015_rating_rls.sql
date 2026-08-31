-- 015_rating_rls.sql — granular policies untuk ratings
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- Rating immutable: tidak ada policy UPDATE/DELETE (DELETE hanya cascade dari contracts).
-- Gate bisnis (work COMPLETED) di-enforce service; RLS menolak rater spoofing + rating_type mismatch.

-- SELECT: talent/hirer pihak contract, admin
create policy "ratings_select_involved"
  on public.ratings for select to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
    or is_admin()
  );

-- INSERT: rater = dirinya, pihak kontrak, rating_type konsisten posisi
create policy "ratings_insert_involved"
  on public.ratings for insert to authenticated
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (
          (c.talent_id = auth.uid() and rating_type = 'TALENT_RATES_HIRER')
          or (c.hirer_id = auth.uid() and rating_type = 'HIRER_RATES_TALENT')
        )
    )
  );
