-- 008_talent_skills_interests_rls.sql
-- Owner-scoped policies untuk talent_skills & talent_interests
-- (melengkapi TBD di 003; dipakai Matching untuk baca + memperbaiki CRUD Profile).

-- talent_skills
create policy "talent_skills_select_own"
  on public.talent_skills for select to authenticated
  using (auth.uid() = profile_id);

create policy "talent_skills_insert_own"
  on public.talent_skills for insert to authenticated
  with check (auth.uid() = profile_id);

create policy "talent_skills_update_own"
  on public.talent_skills for update to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "talent_skills_delete_own"
  on public.talent_skills for delete to authenticated
  using (auth.uid() = profile_id);

-- talent_interests
create policy "talent_interests_select_own"
  on public.talent_interests for select to authenticated
  using (auth.uid() = profile_id);

create policy "talent_interests_insert_own"
  on public.talent_interests for insert to authenticated
  with check (auth.uid() = profile_id);

create policy "talent_interests_update_own"
  on public.talent_interests for update to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "talent_interests_delete_own"
  on public.talent_interests for delete to authenticated
  using (auth.uid() = profile_id);
