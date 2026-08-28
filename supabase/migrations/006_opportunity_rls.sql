-- 006_opportunity_rls.sql
-- Additive RLS untuk Opportunity Module: admin moderation + junction tables.

-- Helper: true bila pemanggil adalah ADMIN.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- Admin policies (additive / permissive OR) pada opportunities.
-- ---------------------------------------------------------------------------
create policy "opportunities_select_admin"
  on public.opportunities for select to authenticated
  using (public.is_admin());

create policy "opportunities_update_admin"
  on public.opportunities for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "opportunities_delete_admin"
  on public.opportunities for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- opportunity_skills (default-deny): visibility & ownership mengikuti parent.
-- ---------------------------------------------------------------------------
create policy "opportunity_skills_select_visible"
  on public.opportunity_skills for select to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.status = 'PUBLISHED' or o.hirer_id = auth.uid() or public.is_admin())
    )
  );

create policy "opportunity_skills_insert_owner"
  on public.opportunity_skills for insert to authenticated
  with check (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  );

create policy "opportunity_skills_delete_owner_or_admin"
  on public.opportunity_skills for delete to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.hirer_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- opportunity_interests: identik dengan opportunity_skills.
-- ---------------------------------------------------------------------------
create policy "opportunity_interests_select_visible"
  on public.opportunity_interests for select to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.status = 'PUBLISHED' or o.hirer_id = auth.uid() or public.is_admin())
    )
  );

create policy "opportunity_interests_insert_owner"
  on public.opportunity_interests for insert to authenticated
  with check (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  );

create policy "opportunity_interests_delete_owner_or_admin"
  on public.opportunity_interests for delete to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.hirer_id = auth.uid() or public.is_admin())
    )
  );
