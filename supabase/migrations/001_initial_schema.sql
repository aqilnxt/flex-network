-- 001_initial_schema.sql
-- Flex Network initial schema: tables, primary keys, foreign keys,
-- unique constraints, check constraints, and the set_updated_at() helper.

-- ---------------------------------------------------------------------------
-- Helper: auto-update updated_at on row update.
-- Consumed by triggers in 004_updated_at_triggers.sql.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Master data: skills & interests
-- ---------------------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profile Module
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'TALENT'
    check (role in ('TALENT', 'HIRER', 'ADMIN')),
  full_name text,
  bio text,
  location text,
  avatar_url text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.talent_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  school_name text,
  grade_level text,
  cv_url text,
  portfolio_url text,
  birth_date date,
  is_minor boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hirer_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  company_name text,
  industry text,
  company_description text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.talent_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create table public.talent_interests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

-- ---------------------------------------------------------------------------
-- Opportunity Module
-- ---------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  hirer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  opportunity_type text,
  location text,
  work_mode text,
  start_date date,
  end_date date,
  working_hours text,
  duration text,
  compensation integer,
  compensation_type text,
  requirements text,
  responsibilities text,
  max_talent integer,
  application_deadline timestamptz,
  requires_consent boolean not null default false,
  cv_requirement boolean not null default false,
  portfolio_requirement boolean not null default false,
  interview_requirement boolean not null default false,
  meeting_method text,
  other_terms text,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'CLOSED')),
  submitted_for_review_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  moderation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opportunity_skills (
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (opportunity_id, skill_id)
);

create table public.opportunity_interests (
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (opportunity_id, interest_id)
);

-- ---------------------------------------------------------------------------
-- Application Module
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  message text,
  status text not null default 'APPLIED'
    check (status in ('APPLIED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED')),
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz,
  selected_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (talent_id, opportunity_id)
);

-- ---------------------------------------------------------------------------
-- Meeting Module
-- ---------------------------------------------------------------------------
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  meeting_date date,
  meeting_time time,
  meeting_link text,
  meeting_method text,
  notes text,
  status text not null default 'SCHEDULED'
    check (status in ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Parental Consent Module
-- ---------------------------------------------------------------------------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  consent_required boolean not null default false,
  required_reason text,
  status text not null default 'NOT_REQUIRED'
    check (status in ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED')),
  requested_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contract Module
-- ---------------------------------------------------------------------------
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  hirer_id uuid not null references public.profiles (id) on delete cascade,
  contract_number text,
  role_title text,
  description text,
  responsibilities text,
  duration text,
  location text,
  compensation integer,
  terms_conditions text,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'PENDING_AGREEMENT', 'ACTIVE', 'COMPLETED', 'TERMINATED')),
  proposed_at timestamptz,
  proposed_by uuid references public.profiles (id) on delete set null,
  talent_agreed boolean not null default false,
  hirer_agreed boolean not null default false,
  talent_agreed_at timestamptz,
  hirer_agreed_at timestamptz,
  activated_at timestamptz,
  completed_at timestamptz,
  terminated_at timestamptz,
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payment Module
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts (id) on delete cascade,
  amount integer,
  currency text not null default 'IDR',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'SIMULATED_PAID', 'RELEASED')),
  held_at timestamptz,
  released_at timestamptz,
  held_by uuid references public.profiles (id) on delete set null,
  released_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Work Module
-- ---------------------------------------------------------------------------
create table public.works (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts (id) on delete cascade,
  status text not null default 'NOT_STARTED'
    check (status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  started_at timestamptz,
  completed_at timestamptz,
  hirer_confirmed boolean not null default false,
  hirer_confirmed_at timestamptz,
  confirmed_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rating Module
-- ---------------------------------------------------------------------------
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  ratee_id uuid not null references public.profiles (id) on delete cascade,
  rating_type text not null
    check (rating_type in ('TALENT_RATES_HIRER', 'HIRER_RATES_TALENT')),
  score integer not null check (score between 1 and 5),
  review_text text,
  created_at timestamptz not null default now(),
  unique (work_id, rater_id, rating_type)
);

-- ---------------------------------------------------------------------------
-- Work History Module
-- ---------------------------------------------------------------------------
create table public.work_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts (id) on delete cascade,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  title text,
  description text,
  duration text,
  compensation integer,
  verification_status text not null default 'PENDING'
    check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notification Module
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text,
  title text,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Report Module
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete cascade,
  target_opportunity_id uuid references public.opportunities (id) on delete cascade,
  target_application_id uuid references public.applications (id) on delete cascade,
  reason text,
  status text not null default 'SUBMITTED'
    check (status in ('SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (target_user_id is not null)::int
    + (target_opportunity_id is not null)::int
    + (target_application_id is not null)::int
    >= 1
  )
);

-- ---------------------------------------------------------------------------
-- Admin / Audit Module
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_type text not null check (actor_type in ('USER', 'ADMIN', 'SYSTEM')),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
