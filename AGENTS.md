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

- brainstorming, writing-plans, grilling (for planning)
- codebase-design, improve-architecture (for architecture)
- impeccable, ui-ux-pro-max, vercel-composition, vercel-react-best-practices (for UI/React)
- agent-browser (for E2E testing)
- deploy-to-vercel (for deployment)

## Skill Discovery

Sebelum mengerjakan task apa pun yang membutuhkan bantuan spesifik (testing, deployment, UI, refactor, dll), WAJIB cek dulu apakah ada skill yang relevan:

1. Jalankan `npx skills find <keyword>` untuk mencari skill terkait.
2. Kalo nemu skill dengan install count > 1K, rekomendasikan ke user.
3. Tanyakan apakah user mau install skill itu sebelum lanjut.
4. Jangan langsung menulis kode tanpa mengecek skill terlebih dahulu.

Pengecualian: task yang sudah jelas (bikin file, update PROGRESS.md, dll) ga perlu pake `find-skills`.

## Progress Tracking

- Setelah menyelesaikan setiap task yang terdaftar di `docs/PROGRESS.md`, WAJIB update file tersebut.
- Pindahkan task dari "Sedang Dikerjakan" ke "Sudah Selesai".
- Tambahkan entri baru di "Decision Log" jika ada keputusan penting.
- Jangan menghapus history yang sudah ada.

**Rule:** Untuk UI design, WAJIB baca `docs/DESIGN.md` terlebih dahulu.
Untuk complex logic, WAJIB panggil `brainstorming` + `grill-me` sebelum ngoding.
