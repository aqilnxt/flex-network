-- 025_guardian_consent.sql
-- Guardian consent via magic link: email wali + tabel token (hashed, one-time, expire 48h).

alter table public.consents add column guardian_email text;

create table public.consent_tokens (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null unique references public.consents (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.consent_tokens enable row level security;
-- default-deny: tanpa policy — semua akses via service layer (admin client).
