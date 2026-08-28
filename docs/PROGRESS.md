# PROGRESS.md — Flex Network Roadmap

## Current Milestone: Sprint 3 — Opportunity Module

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

---

### Sedang Dikerjakan

_(kosong — sprint Opportunity selesai)_

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

### Next Task

1. Smoke-test manual (`npm run dev`): create → submit → moderate → browse → detail.
2. Migrasi konvensi `middleware` → `proxy` (Next 16 deprecation warning), opzional.
3. Lanjut ke sprint berikutnya (Application module / matching).

---

**Status Terakhir:** ✅ Sprint 3 — Opportunity Module **selesai** (Task 1–12). Build & typecheck sukses.
