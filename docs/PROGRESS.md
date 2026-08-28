# PROGRESS.md — Flex Network Roadmap

## Current Milestone: Sprint 2 — Core Modules (Auth & Profile)

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

---

### Sedang Dikerjakan

_(kosong — sprint Auth & Profile selesai)_

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

### Next Task

1. Smoke-test manual (`npm run dev`): register → login → dashboard → profile → logout.
2. Migrasi konvensi `middleware` → `proxy` (Next 16 deprecation warning), opzional.
3. Lanjut ke sprint berikutnya (Opportunity module).

---

**Status Terakhir:** ✅ Sprint 2 — Auth & Profile Module **selesai** (Task 1–13). Build & typecheck sukses.
