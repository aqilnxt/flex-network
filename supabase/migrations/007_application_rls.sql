-- 007_application_rls.sql
-- Additive RLS untuk Application Module: hirer dapat update application pada
-- opportunity miliknya.

create policy "applications_update_hirer"
  on public.applications for update to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  );
