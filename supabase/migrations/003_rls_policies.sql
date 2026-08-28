-- 003_rls_policies.sql
-- Flex Network baseline RLS: enable row level security on all application
-- tables (default-deny) and add baseline policies. Granular policies for
-- remaining tables are marked TBD and added alongside their application
-- services.

-- ---------------------------------------------------------------------------
-- Master data
-- ---------------------------------------------------------------------------
alter table public.skills enable row level security;
alter table public.interests enable row level security;

create policy "skills_select_authenticated"
  on public.skills for select to authenticated using (true);

create policy "interests_select_authenticated"
  on public.interests for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Profile Module
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.talent_profiles enable row level security;
alter table public.hirer_profiles enable row level security;
alter table public.talent_skills enable row level security;
alter table public.talent_interests enable row level security;

create policy "profiles_select_active"
  on public.profiles for select to authenticated
  using (status = 'ACTIVE');

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "profile_private_select_own"
  on public.profile_private for select to authenticated
  using (auth.uid() = profile_id);

create policy "profile_private_update_own"
  on public.profile_private for update to authenticated
  using (auth.uid() = profile_id);

create policy "talent_profiles_select_public"
  on public.talent_profiles for select to authenticated using (true);

create policy "talent_profiles_update_own"
  on public.talent_profiles for update to authenticated
  using (auth.uid() = profile_id);

create policy "hirer_profiles_select_public"
  on public.hirer_profiles for select to authenticated using (true);

create policy "hirer_profiles_update_own"
  on public.hirer_profiles for update to authenticated
  using (auth.uid() = profile_id);

-- granular policies: TBD in application module
-- talent_skills, talent_interests: owner-scoped write/read

-- ---------------------------------------------------------------------------
-- Opportunity Module
-- ---------------------------------------------------------------------------
alter table public.opportunities enable row level security;
alter table public.opportunity_skills enable row level security;
alter table public.opportunity_interests enable row level security;

create policy "opportunities_select_published_or_owner"
  on public.opportunities for select to authenticated
  using (status = 'PUBLISHED' or hirer_id = auth.uid());

create policy "opportunities_insert_owner"
  on public.opportunities for insert to authenticated
  with check (hirer_id = auth.uid());

create policy "opportunities_update_owner"
  on public.opportunities for update to authenticated
  using (hirer_id = auth.uid())
  with check (hirer_id = auth.uid());

create policy "opportunities_delete_owner"
  on public.opportunities for delete to authenticated
  using (hirer_id = auth.uid());

-- granular policies: TBD in application module
-- opportunity_skills, opportunity_interests

-- ---------------------------------------------------------------------------
-- Application Module
-- ---------------------------------------------------------------------------
alter table public.applications enable row level security;

create policy "applications_select_owner_or_hirer"
  on public.applications for select to authenticated
  using (
    talent_id = auth.uid()
    or exists (
      select 1 from public.opportunities o
      where o.id = applications.opportunity_id
        and o.hirer_id = auth.uid()
    )
  );

create policy "applications_insert_talent"
  on public.applications for insert to authenticated
  with check (talent_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Notification Module
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Remaining tables: enable RLS (default-deny). Granular policies deferred.
-- ---------------------------------------------------------------------------
alter table public.meetings enable row level security;      -- granular policies: TBD in application module
alter table public.consents enable row level security;      -- granular policies: TBD in application module
alter table public.contracts enable row level security;     -- granular policies: TBD in application module
alter table public.payments enable row level security;      -- granular policies: TBD in application module
alter table public.works enable row level security;         -- granular policies: TBD in application module
alter table public.ratings enable row level security;       -- granular policies: TBD in application module
alter table public.work_history enable row level security;  -- granular policies: TBD in application module
alter table public.reports enable row level security;       -- granular policies: TBD in application module
alter table public.audit_logs enable row level security;    -- granular policies: TBD in application module
