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
- [x] Migration SQL (4 files):
  - `001_initial_schema.sql` — 22 tabel + helper `set_updated_at()`
  - `002_indexes.sql` — index ownership & FK
  - `003_rls_policies.sql` — enable RLS + policy dasar
  - `004_updated_at_triggers.sql` — 13 trigger auto-update
- [x] Push migration ke Supabase via CLI (`supabase db push`)
- [x] Verified database: 22 tables, RLS enabled, triggers active

---

### Sedang Dikerjakan

- [ ] **Module Auth & Profile**
  - [ ] Register & Login (Supabase Auth)
  - [ ] Profile management (TALENT & HIRER)
  - [ ] Skills & Interests management
  - [ ] Protected routes & role-based middleware

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

### Next Task

1. Panggil skill `brainstorming` dengan klasifikasi **ARCHITECTURAL** atau **BOUNDED** untuk Module Auth & Profile.
2. Buat implementasi register, login, profile management.
3. Test authentication & session.

---

**Status Terakhir:** ✅ Database foundation siap. ✅ Supabase Client siap. 🚀 Next: Auth & Profile Module.
