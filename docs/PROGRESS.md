# PROGRESS.md — Flex Network Roadmap

## Current Milestone: Core Modules — Opportunity, Application, & Matching

### Sudah Selesai

#### Project Setup & Infrastructure

- [x] Inisialisasi Git repository & struktur folder awal
- [x] Setup Next.js + TypeScript + Tailwind CSS (App Router, strict mode)
- [x] Salin semua dokumen final ke `/docs` (BRD, SRS, TDD, API-SPEC, APPENDIX)
- [x] Setup environment variables (`.env.local`, `.env.example`)

#### AI & Tooling

- [x] Membuat & mengisi `AGENTS.md` (konteks AI, arsitektur, status enum, dll)
- [x] Membuat & mengisi `PROMPTS.md` (template prompt untuk AI agent)
- [x] Membuat `PRODUCT.md` & `DESIGN.md` (complementary files untuk skill UI)
- [x] Membuat folder `docs/superpowers/specs/` dan `docs/superpowers/plans/`
- [x] Install 11 skill ke OpenCode:
  - brainstorming, writing-plans, grilling (Planning Suite)
  - codebase-design, improve-architecture (Architecture Suite)
  - impeccable, ui-ux-pro-max, vercel-composition, vercel-react-best-practices (UI/React Suite)
  - agent-browser (E2E Testing)
  - deploy-to-vercel (Deployment)

#### Database (Supabase)

- [x] Setup Supabase Client:
  - `lib/supabase/browser.ts` — client-side singleton
  - `lib/supabase/server.ts` — server-side authenticated (Next.js 16 + `await cookies()`)
  - `lib/supabase/admin.ts` — server-only, service role (bypass RLS)
- [x] Install dependencies (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Migration SQL (5 files):
  - `001_initial_schema.sql` — 22 tabel + helper `set_updated_at()`
  - `002_indexes.sql` — index ownership & FK
  - `003_rls_policies.sql` — enable RLS + policy dasar
  - `004_updated_at_triggers.sql` — 13 trigger auto-update
  - `005_auth_triggers.sql` — trigger `handle_new_user()` (profiles + talent/hirer profile)
- [x] Push migration ke Supabase via CLI (`supabase db push`)
- [x] Verified database: 22 tables, RLS enabled, triggers active

#### Module Auth & Profile (Foundation)

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-auth-profile-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-auth-profile.md`
- [x] Task 1 — Migration `005_auth_triggers.sql` (trigger auto-create profile)
- [x] Task 2 — Shared types `lib/result.ts` (`ActionResult<T>`)
- [x] Task 3 — Install `zod`
- [x] Task 4 — Auth helpers `modules/lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireRole`)
- [x] Task 5 — Auth schemas `modules/auth/schemas.ts` (`registerSchema`, `loginSchema`)
- [x] Task 6 — Auth service + actions (`register`, `login`, `logout`)
- [x] Task 7 — Profile schema `modules/profile/schemas.ts`
- [x] Task 8 — Profile service + actions (update, skill/interest CRUD)
- [x] Task 9 — Middleware protected routes
- [x] Task 10 — Pages (login & register)
- [x] Task 11 — Dashboard pages (role router, talent, hirer)
- [x] Task 12 — Profile page & form
- [x] Task 13 — Build & typecheck verification

#### Module Opportunity

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-opportunity-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-opportunity-module.md`
- [x] Task 1 — Migration `006_opportunity_rls.sql` (`is_admin()`, policy admin, policy junction)
- [x] Task 2 — Schemas `modules/opportunity/schemas.ts` (create/update/moderate)
- [x] Task 3 — Queries `modules/opportunity/queries.ts` (`listPublished`, `getOpportunityById`)
- [x] Task 4 — Service `modules/opportunity/service.ts` (create/update/submit/close/moderate/delete)
- [x] Task 5 — Server Actions `modules/opportunity/actions.ts`
- [x] Task 6 — Browse page `app/opportunities/page.tsx`
- [x] Task 7 — Detail page `app/opportunities/[id]/page.tsx`
- [x] Task 8 — Hirer list `app/hirer/opportunities/page.tsx`
- [x] Task 9 — Hirer create form
- [x] Task 10 — Hirer edit form
- [x] Task 11 — Admin moderation `app/admin/opportunities/page.tsx`
- [x] Task 12 — Build & typecheck verification

#### Module Application

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-application-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-application-module.md`
- [x] Task 1 — Migration `007_application_rls.sql` (policy update hirer)
- [x] Task 2 — Schema `modules/application/schemas.ts`
- [x] Task 3 — Queries `modules/application/queries.ts` (listForTalent, listForOpportunity, getApplicationStatus)
- [x] Task 4 — Service `modules/application/service.ts` (apply/review/select/reject)
- [x] Task 5 — Server Actions `modules/application/actions.ts`
- [x] Task 6 — My Applications page `app/applications/page.tsx`
- [x] Task 7 — Apply form di detail opportunity
- [x] Task 8 — Applicant list page (HIRER)
- [x] Task 9 — Link "Lihat Applicant" di hirer list
- [x] Task 10 — Build & typecheck verification

#### Module Matching

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-matching-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-matching-module.md`
- [x] Task 1 — Migration `008_talent_skills_interests_rls.sql` (owner-scoped policy)
- [x] Task 2 — Service `modules/matching/service.ts` (pure scoring deterministik)
- [x] Task 3 — Queries `modules/matching/queries.ts` (`getRecommendations`)
- [x] Task 4 — Page `app/matching/recommendations/page.tsx`
- [x] Task 5 — Build & typecheck verification

#### Seed Master Data

- [x] Seed 20 skills & 12 interests via `supabase/seed/seed-skills-interests.sql` (idempotent, dijalankan via `supabase db query --linked`)

---

### Sedang Dikerjakan

- Module Meeting — spec `docs/superpowers/specs/2026-08-29-meeting-module-design.md` + plan `docs/superpowers/plans/2026-08-29-meeting-module.md` (siap eksekusi, 10 task)

### Decision Log

- 2026-08-27: Modular Monolith (bukan microservices)
- 2026-08-27: Consent tanpa guardianName/guardianContact (hanya metadata)
- 2026-08-28: Install 11 AI skills untuk support development & QA
- 2026-08-28: Buat PRODUCT.md & DESIGN.md untuk skill UI/UX
- 2026-08-28: Buat folder `superpowers/specs` & `superpowers/plans`
- 2026-08-28: Status database = `text + CHECK`, bukan native ENUM
- 2026-08-28: Split migration (schema → indexes → RLS → triggers)
- 2026-08-29: `server-only` adalah built-in Next.js marker, bukan npm package
- 2026-08-29: Migration berhasil di-push ke Supabase production project
- 2026-08-29: Profile dibuat via DB trigger (bukan application-layer)
- 2026-08-29: Server Actions dulu; REST API ditunda ke task terpisah
- 2026-08-29: Email confirmation TIDAK wajib (langsung login)
- 2026-08-29: Skill/interest scope: full CRUD, tanpa master data GET /skills dulu
- 2026-08-29: Opportunity ikut DB aktual (bukan API-SPEC): compensation integer, requirement boolean, enum text app-layer tanpa migration
- 2026-08-29: PUBLISHED ditentukan ADMIN via moderasi; HIRER hanya submit & close
- 2026-08-29: Admin moderation lewat server client + policy RLS `is_admin()`, bukan `admin.ts`
- 2026-08-29: Mutation actions fire-and-forget return `void` (plain form action); form berbasis state (`create`/`update`) return `ActionResult`
- 2026-08-29: Reject application bisa dari APPLIED (A.12) ATAU UNDER_REVIEW (API-SPEC); SELECT hanya dari UNDER_REVIEW
- 2026-08-29: `max_talent` di-enforce server-side saat select application
- 2026-08-29: Matching = read-only (query/service server-side, tanpa Server Action & REST); rule-based deterministic, tanpa AI/ML
- 2026-08-29: Migration `008` menambah policy `talent_skills`/`talent_interests` (perbaiki latent bug CRUD profile + dipakai matching)
- 2026-08-29: Smoke test menemukan tabel public tanpa GRANT ke `anon`/`authenticated`/`service_role` → fix migration `009_table_grants.sql` (RLS bukan pengganti base privileges)
- 2026-08-29: "Confirm email" dimatikan di Supabase; user lama (admin) tetap perlu di-confirm manual via service role
- 2026-08-29: Mutation actions pakai `redirect()` balik ke halaman asal (bukan cuma revalidatePath) supaya UI refresh deterministik
- 2026-08-29: Seed 20 skills & 12 interests via supabase/seed/seed-skills-interests.sql
- 2026-08-29: Match score browse/detail reuse `scoreOpportunity` (read-only, server-side); badge helper shared di `modules/matching/badge.ts`
- 2026-08-29: Meeting CANCELLED terminal, tanpa edit/reschedule (YAGNI); contract gate = `getByApplicationId` di-enforce modul Contract

### Next Task

1. ~~Smoke-test manual~~ ✅ Smoke test E2E lulus (register → create → moderate → browse → apply → review → select).
2. ~~Match score di browse card & single-opportunity score~~ ✅ `getMatchScoresForTalent()` + badge shared `modules/matching/badge.ts`; browse card & detail page tampil untuk TALENT.
3. ~~Seed master-data skills/interests~~ ✅ Seeded (20 skills, 12 interests) via `supabase/seed/seed-skills-interests.sql`.
4. ~~Admin dashboard redirect~~ ✅ Route ADMIN → `/dashboard/admin` (page + link moderasi). Typecheck lulus.

---

**Status Terakhir:** ✅ Match score di browse & detail selesai. Typecheck & lint sukses.
