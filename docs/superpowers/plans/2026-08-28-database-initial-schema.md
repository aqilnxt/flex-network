# Database Initial Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Membangun seluruh skema database Flex Network (22 tabel + constraint + index + RLS dasar + trigger) lewat migration SQL yang version-controlled.

**Architecture:** Migration dibagi 4 file berurutan (schema → indexes → rls → triggers), mengikuti TDD 23.23 dan keputusan desain yang disetujui. Status direpresentasikan `text` + `CHECK`, `id uuid default gen_random_uuid()` (kecuali `profiles.id` = `auth.users.id`), dan `talent_id`/`hirer_id`/`rater_id`/`ratee_id`/`user_id` reference ke `profiles.id`.

**Tech Stack:** Supabase PostgreSQL, raw SQL migration.

**Spec:** APPENDIX.md A.4–A.50, TTD.md 23.17–23.24.

## Global Constraints

- Status = `text` + `CHECK (status IN (...))`, BUKAN native ENUM.
- `amount integer`, `currency text default 'IDR'`.
- Timestamp = `timestamptz not null default now()`.
- Semua tabel referral ke `profiles.id` sebagai kanonik user id.
- DB constraint ≠ business logic; state machine tetap application-layer.
- Sensitive data (`profile_private`) tidak public-read; RLS default-deny.

## File Structure

Semua di bawah `supabase/migrations/`:

| File | Tanggung jawab |
|------|----------------|
| `001_initial_schema.sql` | Tabel + PK + FK + UNIQUE + CHECK + helper `set_updated_at()` |
| `002_indexes.sql` | Index pada kolom ownership & FK yang sering di-query |
| `003_rls_policies.sql` | `enable row level security` + policy dasar per tabel |
| `004_updated_at_triggers.sql` | Trigger `before update` yang memanggil `set_updated_at()` |

---

## Task 1: `001_initial_schema.sql` — Tabel, Constraint, & Helper

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Interfaces:**
- Produces: 22 tabel + fungsi `set_updated_at()` (dipakai Task 4).

**Isi (urutan parent→child):**
1. `skills(id uuid pk, name text not null unique, created_at)`
2. `interests(id uuid pk, name text not null unique, created_at)`
3. `profiles(id uuid pk, role text check in (TALENT,HIRER,ADMIN), full_name, bio, location, avatar_url, status text check(default ACTIVE), created_at, updated_at)` — FK `id → auth.users(id)`
4. `profile_private(profile_id pk fk→profiles, email, phone, created_at, updated_at)`
5. `talent_profiles(profile_id pk fk→profiles, school_name, grade_level, cv_url, portfolio_url, birth_date date, is_minor boolean default false, ...)`
6. `hirer_profiles(profile_id pk fk→profiles, company_name, industry, company_description, website_url, ...)`
7. `talent_skills(profile_id fk, skill_id fk, UNIQUE(profile_id, skill_id))`
8. `talent_interests(profile_id fk, interest_id fk, UNIQUE(...))`
9. `opportunities(... semua field A.8 + moderation metadata, hirer_id fk→profiles, status check)`
10. `opportunity_skills(opportunity_id fk, skill_id fk, UNIQUE)`
11. `opportunity_interests(opportunity_id fk, interest_id fk, UNIQUE)`
12. `applications(talent_id fk, opportunity_id fk, message, status check, timestamps aplikasi, UNIQUE(talent_id, opportunity_id))`
13. `meetings(application_id fk, meeting_date/time/link/method, notes, status check, UNIQUE(application_id))`
14. `consents(application_id fk, talent_id fk, opportunity_id fk, consent_required boolean, required_reason, status check, ...)`
15. `contracts(application_id fk, opportunity_id fk, talent_id fk, hirer_id fk, contract_number, role_title, description, responsibilities, duration, location, compensation, terms_conditions, status check, agreement fields, UNIQUE(application_id))`
16. `payments(contract_id pk/fk, amount integer, currency text default 'IDR', status check, held_at, released_at, held_by, released_by, UNIQUE(contract_id))`
17. `works(contract_id pk/fk, status check, started_at, completed_at, hirer_confirmed boolean, hirer_confirmed_at, confirmed_by, notes, UNIQUE(contract_id))`
18. `ratings(id pk, work_id fk, contract_id fk, rater_id fk, ratee_id fk, rating_type check, score int check 1..5, review_text, UNIQUE(work_id, rater_id, rating_type))`
19. `work_history(contract_id fk, talent_id fk, opportunity_id fk, title, description, duration, compensation, verification_status check, verified_at, verified_by, verification_notes, UNIQUE(contract_id))`
20. `notifications(id pk, user_id fk, type, title, message, link, is_read boolean, created_at)`
21. `reports(id pk, reporter_id fk, target_user_id fk nullable, target_opportunity_id fk nullable, target_application_id fk nullable, reason, status check, CHECK(minimal satu target non-null))`
22. `audit_logs(id pk, actor_id uuid, actor_type check(USER/ADMIN/SYSTEM), action, resource_type, resource_id uuid, metadata jsonb, created_at)` — tanpa FK ketat.

- Helper: `CREATE FUNCTION set_updated_at()` (set `updated_at = now()`).

**Steps:**
- [ ] **Step 1:** Buat folder `supabase/migrations/`.
- [ ] **Step 2:** Tulis `001_initial_schema.sql` (tabel 1–22 + helper function).
- [ ] **Step 3:** Review urutan FK (tidak ada FK ke tabel yang belum dibuat).
- [ ] **Step 4:** Commit `feat(db): add initial schema tables and constraints`.

---

## Task 2: `002_indexes.sql` — Index Ownership & FK

**Files:**
- Create: `supabase/migrations/002_indexes.sql`

**Interfaces:**
- Consumes: nama tabel + kolom FK dari Task 1.

**Isi (index `btree` default, `create index if not exists`):**
- `opportunities(hirer_id)`, `opportunities(status)`
- `applications(talent_id)`, `applications(opportunity_id)`, `applications(status)`
- `meetings(application_id)`
- `consents(application_id)`, `consents(talent_id)`
- `contracts(talent_id)`, `contracts(hirer_id)`, `contracts(application_id)`
- `payments(contract_id)`, `works(contract_id)`
- `ratings(work_id)`, `ratings(ratee_id)`
- `work_history(talent_id)`, `work_history(contract_id)`
- `notifications(user_id, is_read)`
- `reports(status)`, `reports(reporter_id)`
- `audit_logs(actor_id)`, `audit_logs(resource_type, resource_id)`
- `talent_skills(skill_id)`, `talent_interests(interest_id)`, `opportunity_skills(skill_id)`, `opportunity_interests(interest_id)`

**Steps:**
- [ ] **Step 1:** Tulis `002_indexes.sql`.
- [ ] **Step 2:** Pastikan tiap index ngerujuk kolom yang ada (Task 1).
- [ ] **Step 3:** Commit `feat(db): add query indexes`.

---

## Task 3: `003_rls_policies.sql` — RLS Dasar

**Files:**
- Create: `supabase/migrations/003_rls_policies.sql`

**Interfaces:**
- Consumes: nama tabel + kolom (`status`, `hirer_id`, `user_id`, dst.) dari Task 1.

**Isi (default-deny → enable RLS, lalu `create policy` per tabel):**
- `enable row level security` untuk semua 22 tabel aplikasi.
- Policy dasar:
  - `skills`, `interests`: `select` untuk `authenticated`.
  - `profiles`: `select` jika `status = 'ACTIVE'`; `update` owner (`auth.uid() = id`).
  - `profile_private`: `select`/`update` owner only.
  - `talent_profiles`, `hirer_profiles`: `select` public dasar; `update` owner.
  - `opportunities`: `select` jika `status = 'PUBLISHED'` OR `hirer_id = auth.uid()`; `insert/update/delete` owner.
  - `applications`: `select` owner atau hirer; `insert` talent.
  - `notifications`: `select`/`update` owner (`user_id = auth.uid()`).
- Tabel sisanya: enable RLS (default-deny), policy granular disusun bersama application-service berikutnya. Tiap policy ditandai komentar `-- granular policies: TBD in application module`.

**Steps:**
- [ ] **Step 1:** Tulis `003_rls_policies.sql`.
- [ ] **Step 2:** Verifikasi tidak ada tabel aplikasi yang tertinggal `enable row level security`.
- [ ] **Step 3:** Commit `feat(db): enable rls with baseline policies`.

---

## Task 4: `004_updated_at_triggers.sql` — Auto-update Trigger

**Files:**
- Create: `supabase/migrations/004_updated_at_triggers.sql`

**Interfaces:**
- Consumes: fungsi `set_updated_at()` (Task 1) + semua tabel yang punya `updated_at`.

**Isi:** `create trigger <table>_updated_at before update on <table> for each row execute function set_updated_at();` untuk setiap tabel yang memiliki kolom `updated_at` (profiles, profile_private, talent_profiles, hirer_profiles, opportunities, applications, meetings, consents, contracts, payments, works, work_history, reports).

**Steps:**
- [ ] **Step 1:** Tulis `004_updated_at_triggers.sql`.
- [ ] **Step 2:** Pastikan hanya tabel ber-`updated_at` yang diberi trigger.
- [ ] **Step 3:** Commit `feat(db): add updated_at triggers`.

---

## Testing & Verifikasi

Belum ada local Supabase yang ter-`link` (`supabase/config.toml` belum ada). Verifikasi migration saat ini bersifat review (urutkan FK, cek kolom, cek `CHECK`). Setelah environment siap: `supabase db lint` dan/atau `supabase db reset`.

Setup Supabase CLI + config.toml dikerjakan terpisah setelah migration selesai.
