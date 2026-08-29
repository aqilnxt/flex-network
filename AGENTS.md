# AGENTS.md — Flex Network AI Context

## Project

Flex Network adalah platform experience-driven yang menghubungkan Young Talent (TALENT) dengan penyedia opportunity (HIRER) berdasarkan skill dan interest.

## Tech Stack

- Framework: Next.js (App Router, React 19, TypeScript strict)
- Database: Supabase PostgreSQL (RLS enabled)
- Auth: Supabase Auth
- Styling: Tailwind CSS
- Validation: Zod
- Pattern: Modular Monolith (`/modules/<module-name>`)

## Arsitektur

Alur dependency:
UI Components → Server Actions/API Routes → Application Service → Domain → Repository → Supabase

Struktur penting:

- `app/` → routing, pages, API routes
- `modules/` → business capabilities
- `lib/supabase/` → browser.ts, server.ts, admin.ts
- `supabase/migrations/` → SQL schema & RLS

## Module Ownership

- Auth → Supabase Auth
- Profile → profiles, profile_private, talent_profiles, hirer_profiles, skills, interests, talent_skills, talent_interests
- Opportunity → opportunities, opportunity_skills, opportunity_interests
- Application → applications
- Meeting → meetings
- Consent → consents
- Contract → contracts
- Payment → payments
- Work → works
- Rating → ratings
- Work History → work_history
- Notification → notifications
- Report → reports
- Admin/Audit → audit_logs

## Business Flow

Register → Profile → Opportunity Discovery → Matching → Application → Selection → Meeting → Consent if Required → Contract → Simulated Payment → Work → Completion Confirmation → Rating → Verified Work History

## Canonical Status

- User: ACTIVE, SUSPENDED, DEACTIVATED
- Opportunity: DRAFT → PENDING_REVIEW → PUBLISHED → CLOSED
- Application: APPLIED → UNDER_REVIEW → SELECTED / REJECTED
- Meeting: SCHEDULED → COMPLETED / CANCELLED
- Consent: NOT_REQUIRED, PENDING, APPROVED, REJECTED
- Contract: DRAFT → PENDING_AGREEMENT → ACTIVE → COMPLETED / TERMINATED
- Payment: PENDING → SIMULATED_PAID → RELEASED
- Work: NOT_STARTED → IN_PROGRESS → COMPLETED
- Work History: PENDING, VERIFIED, REJECTED
- Report: SUBMITTED → UNDER_REVIEW → RESOLVED / REJECTED

## Matching Rules

- Rule-based only, dilarang pakai AI/ML.
- Skill Match = (Matched Skills / Required Skills) × 100
- Interest Match = (Matched Interests / Relevant Interests) × 100
- Final Match Score = (Skill Match × 0.70) + (Interest Match × 0.30)
- Jika Required Skills kosong: Skill Match = 100
- Jika Relevant Interests kosong: Interest Match = 100
- Classification:
  - 80–100: STRONG_MATCH
  - 60–79: GOOD_MATCH
  - 30–59: WEAK_MATCH
  - 0–29: NO_MATCH
- Perhitungan wajib server-side, deterministic, dan recommendation only.

## Security Rules

- Jangan percaya input/client.
- Authorization selalu server-side.
- Ownership check sebelum memproses resource.
- RLS sebagai defense-in-depth.
- SUPABASE_SERVICE_ROLE_KEY hanya di server.
- Jangan log password, token, service key, data sensitif.
- Consent simulated, tanpa guardianName/guardianContact.
- Tidak boleh menyimpan dokumen identitas guardian (KTP/KK/Akta).

## Data Privacy

- Public profile ≠ private data.
- Data minor diminimalkan.
- Consent hanya metadata operasional.
- Dilarang upload dokumen identitas guardian.

## Dokumentasi Referensi

Baca sesuai kebutuhan:

- /docs/BRD.md
- /docs/SRS.md
- /docs/TDD.md
- /docs/APPENDIX-A.md
- /docs/API-SPEC.md
- /docs/PROGRESS.md
- /docs/PROMPTS.md

## Commit Convention

Ikuti aturan di /GIT_COMMIT.md.
Format: `type(scope): deskripsi imperative lowercase`

## Installed Skills

- brainstorming, writing-plans, grilling (planning)
- codebase-design, improve-architecture (architecture)
- impeccable, ui-ux-pro-max, vercel-composition, vercel-react-best-practices (UI/React)
- agent-browser (E2E testing)
- deploy-to-vercel (deployment)
- caveman, caveman-commit, caveman-review (communication & review)
- investigate-first, safe-refactor, surgical-patch, verify-and-stop (agent behavior)
- find-skills (skill discovery)

## Communication Style

**Default output mode: `caveman full`**
Seluruh respon AI wajib menggunakan gaya komunikasi hemat token (caveman) level `full`.

Aturan:

- Drop filler, articles, pleasantries.
- Gunakan fragment, langsung ke poin.
- Technical terms, code, error messages tetap utuh.
- Kalo user minta `normal mode`, balik ke gaya normal.

Kecuali:

- Security warnings → tulis lengkap.
- Irreversible action → tulis lengkap.
- User minta klarifikasi → tulis lengkap dulu, lalu balik ke caveman.

Aktifkan caveman di awal setiap sesi: `/caveman full` atau sebut "caveman mode".

## Skill Discovery

Sebelum task spesifik, cek skill relevan via `npx skills find <keyword>`. Rekomendasikan skill populer (>1K install) ke user sebelum mulai.

## Progress Tracking

Wajib update `docs/PROGRESS.md` setelah setiap task selesai. Pindahkan task ke "Sudah Selesai", update "Sedang Dikerjakan", catat Decision Log jika perlu.

**Rule:** UI design WAJIB baca `docs/DESIGN.md`. Complex logic WAJIB panggil `brainstorming` + `grill-me` sebelum ngoding.
