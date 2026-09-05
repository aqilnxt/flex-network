-- 024_talent_profile_insert_own.sql
-- Upsert talent_profiles (row baru saat talent pertama kali isi portfolio/sekolah)
-- butuh INSERT policy; update own sudah ada (003).

drop policy if exists "talent_profiles_insert_own" on public.talent_profiles;
create policy "talent_profiles_insert_own"
  on public.talent_profiles for insert to authenticated
  with check (auth.uid() = profile_id);
