# PROGRESS.md - Flex Network Roadmap

## Current Milestone: Core Modules - Opportunity, Application, & Matching

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
  - `lib/supabase/browser.ts` - client-side singleton
  - `lib/supabase/server.ts` - server-side authenticated (Next.js 16 + `await cookies()`)
  - `lib/supabase/admin.ts` - server-only, service role (bypass RLS)
- [x] Install dependencies (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Migration SQL (5 files):
  - `001_initial_schema.sql` - 22 tabel + helper `set_updated_at()`
  - `002_indexes.sql` - index ownership & FK
  - `003_rls_policies.sql` - enable RLS + policy dasar
  - `004_updated_at_triggers.sql` - 13 trigger auto-update
  - `005_auth_triggers.sql` - trigger `handle_new_user()` (profiles + talent/hirer profile)
- [x] Push migration ke Supabase via CLI (`supabase db push`)
- [x] Verified database: 22 tables, RLS enabled, triggers active

#### Module Auth & Profile (Foundation)

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-auth-profile-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-auth-profile.md`
- [x] Task 1 - Migration `005_auth_triggers.sql` (trigger auto-create profile)
- [x] Task 2 - Shared types `lib/result.ts` (`ActionResult<T>`)
- [x] Task 3 - Install `zod`
- [x] Task 4 - Auth helpers `modules/lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireRole`)
- [x] Task 5 - Auth schemas `modules/auth/schemas.ts` (`registerSchema`, `loginSchema`)
- [x] Task 6 - Auth service + actions (`register`, `login`, `logout`)
- [x] Task 7 - Profile schema `modules/profile/schemas.ts`
- [x] Task 8 - Profile service + actions (update, skill/interest CRUD)
- [x] Task 9 - Middleware protected routes
- [x] Task 10 - Pages (login & register)
- [x] Task 11 - Dashboard pages (role router, talent, hirer)
- [x] Task 12 - Profile page & form
- [x] Task 13 - Build & typecheck verification

#### Module Opportunity

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-opportunity-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-opportunity-module.md`
- [x] Task 1 - Migration `006_opportunity_rls.sql` (`is_admin()`, policy admin, policy junction)
- [x] Task 2 - Schemas `modules/opportunity/schemas.ts` (create/update/moderate)
- [x] Task 3 - Queries `modules/opportunity/queries.ts` (`listPublished`, `getOpportunityById`)
- [x] Task 4 - Service `modules/opportunity/service.ts` (create/update/submit/close/moderate/delete)
- [x] Task 5 - Server Actions `modules/opportunity/actions.ts`
- [x] Task 6 - Browse page `app/opportunities/page.tsx`
- [x] Task 7 - Detail page `app/opportunities/[id]/page.tsx`
- [x] Task 8 - Hirer list `app/hirer/opportunities/page.tsx`
- [x] Task 9 - Hirer create form
- [x] Task 10 - Hirer edit form
- [x] Task 11 - Admin moderation `app/admin/opportunities/page.tsx`
- [x] Task 12 - Build & typecheck verification

#### Module Application

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-application-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-application-module.md`
- [x] Task 1 - Migration `007_application_rls.sql` (policy update hirer)
- [x] Task 2 - Schema `modules/application/schemas.ts`
- [x] Task 3 - Queries `modules/application/queries.ts` (listForTalent, listForOpportunity, getApplicationStatus)
- [x] Task 4 - Service `modules/application/service.ts` (apply/review/select/reject)
- [x] Task 5 - Server Actions `modules/application/actions.ts`
- [x] Task 6 - My Applications page `app/applications/page.tsx`
- [x] Task 7 - Apply form di detail opportunity
- [x] Task 8 - Applicant list page (HIRER)
- [x] Task 9 - Link "Lihat Applicant" di hirer list
- [x] Task 10 - Build & typecheck verification

#### Module Matching

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-28-matching-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-28-matching-module.md`
- [x] Task 1 - Migration `008_talent_skills_interests_rls.sql` (owner-scoped policy)
- [x] Task 2 - Service `modules/matching/service.ts` (pure scoring deterministik)
- [x] Task 3 - Queries `modules/matching/queries.ts` (`getRecommendations`)
- [x] Task 4 - Page `app/matching/recommendations/page.tsx`
- [x] Task 5 - Build & typecheck verification

#### Seed Master Data

- [x] Seed 20 skills & 12 interests via `supabase/seed/seed-skills-interests.sql` (idempotent, dijalankan via `supabase db query --linked`)

#### Module Meeting

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-29-meeting-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-29-meeting-module.md`
- [x] Task 1 - Migration `010_meeting_rls.sql` (select involved/admin, insert hirer+SELECTED, update hirer)
- [x] Task 2 - Schemas `modules/meeting/schemas.ts` (scheduleMeetingSchema + refine masa depan)
- [x] Task 3 - Service `modules/meeting/service.ts` (schedule/complete/cancel + state machine)
- [x] Task 4 - Queries `modules/meeting/queries.ts` (`getByApplicationId`, `listForApplications`)
- [x] Task 5 - Server Actions `modules/meeting/actions.ts`
- [x] Task 6 - Form jadwal `schedule-meeting-form.tsx`
- [x] Task 7 - Applicant list: form schedule + info meeting + complete/cancel
- [x] Task 8 - My Applications blok meeting (TALENT, read-only)
- [x] Task 9 - Build, typecheck, lint, E2E smoke (schedule/complete/cancel/validasi/RLS)
- [x] Task 10 - Update PROGRESS.md

#### Module Consent

- [x] Brainstorming ARCHITECTURAL + spec: `docs/superpowers/specs/2026-08-29-consent-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-29-consent-module.md`
- [x] Task 1 - Migration `011_consent_rls.sql` (select involved/admin, insert talent owner+gates, update talent)
- [x] Task 2 - Schemas `modules/consent/schemas.ts` (minimal, tanpa guardian field)
- [x] Task 3 - Service `modules/consent/service.ts` (request/approve/reject + state machine terminal)
- [x] Task 4 - Queries `modules/consent/queries.ts` (`getByApplicationId`, `listForApplications`, `getRequirementMap`, `getConsentDecision`)
- [x] Task 5 - Server Actions `modules/consent/actions.ts`
- [x] Task 6 - Form request `app/applications/consent-request-form.tsx`
- [x] Task 7 - My Applications blok consent + aksi (TALENT)
- [x] Task 8 - Applicant list badge read-only (HIRER)
- [x] Task 9 - Build, typecheck, lint, E2E smoke (approve/reject path, NOT_REQUIRED senyap, gate meeting, RLS REST)
- [x] Task 10 - Update PROGRESS.md

#### Module Contract

- [x] Implementation plan: `docs/superpowers/plans/2026-08-29-contract-module.md` (spec: `docs/superpowers/specs/2026-08-29-contract-module-design.md`)
- [x] Task 1 - Migration `012_contract_rls.sql` (select involved/admin, insert hirer gated, update involved; seed insert policies payments/works) + push + verifikasi 5 policy
- [x] Task 2 - Schemas `modules/contract/schemas.ts` (create/update, tanpa field state)
- [x] Task 3 - Service `modules/contract/service.ts` (create/edit/propose/agree/decline + contract_number + side effects seed payments/works)
- [x] Task 4 - Queries `modules/contract/queries.ts` (`getById`, `getByApplicationId` gate Work, list batch)
- [x] Task 5 - Server Actions `modules/contract/actions.ts` (create/update/propose/agree/decline)
- [x] Task 6 - Form create + edit contract (client components)
- [x] Task 7 - Detail contract page + aksi agree/decline/propose + edit page
- [x] Task 8 - Hirer applicant list: form create + badge/link kontrak
- [x] Task 9 - My Applications blok kontrak + aksi agree/decline (TALENT)
- [x] Task 10 - Build, typecheck, lint, E2E smoke (create→edit→propose→agree→ACTIVE + seed payments/works; decline path TERMINATED; gate meeting/consent/duplikat; RLS REST 42501 + isolation)
- [x] Task 11 - Update PROGRESS.md

#### Module Work

- [x] Spec: `docs/superpowers/specs/2026-08-31-work-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-31-work-module.md`
- [x] Task 1 - Migration `013_work_rls.sql` (select involved/admin, update involved) + push + verifikasi 3 policy
- [x] Task 2 - Schemas `modules/work/schemas.ts` (`workStatusSchema`)
- [x] Task 3 - Service `modules/work/service.ts` (startWork/completeWork/confirmCompletion + state machine + confirm gate)
- [x] Task 4 - Queries `modules/work/queries.ts` (`getByContractId` gate Payment/Rating, `listForContracts` batch)
- [x] Task 5 - Server Actions `modules/work/actions.ts` (startWork/completeWork/confirmWork + redirectTo)
- [x] Task 6 - My Applications blok work + aksi mulai/selesai (TALENT)
- [x] Task 7 - Applicant list badge work + tombol konfirmasi selesai (HIRER)
- [x] Task 8 - Detail contract blok work + aksi
- [x] Task 9 - Build, typecheck, lint, E2E smoke (start→complete→confirm; skip transisi ditolak; payments tetap PENDING; RLS REST 42501 + isolation)
- [x] Task 10 - Update PROGRESS.md

#### Module Payment

- [x] Spec: `docs/superpowers/specs/2026-08-31-payment-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-31-payment-module.md`
- [x] Task 1 - Migration `014_payment_rls.sql` (select involved/admin, update hirer-only) + push + verifikasi 3 policy
- [x] Task 2 - Schemas `modules/payment/schemas.ts` (`paymentStatusSchema`)
- [x] Task 3 - Service `modules/payment/service.ts` (simulatePayment/releasePayment + state machine + gate work + side effect contract COMPLETED)
- [x] Task 4 - Queries `modules/payment/queries.ts` (`getByContractId`, `listForContracts` batch)
- [x] Task 5 - Server Actions `modules/payment/actions.ts` (simulatePayment/releasePayment, HIRER + redirectTo)
- [x] Task 6 - My Applications badge payment (TALENT, read-only)
- [x] Task 7 - Detail contract blok payment + aksi Bayar/Rilis (HIRER)
- [x] Task 8 - Build, typecheck, lint, E2E smoke (bayar→rilis; gate-fail saat confirm di-reset; side effect contract COMPLETED; RLS REST talent PATCH 0 rows + anon []; UI 2 role)
- [x] Task 9 - Update PROGRESS.md

#### Module Rating

- [x] Spec: `docs/superpowers/specs/2026-08-31-rating-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-08-31-rating-module.md`
- [x] Task 1 - Migration `015_rating_rls.sql` (select involved/admin, insert involved + anti-spoof rater_id/rating_type) + push + verifikasi 2 policy
- [x] Task 2 - Schemas `modules/rating/schemas.ts` (`ratingSchema`: contractId + score 1-5 + reviewText ops)
- [x] Task 3 - Service `modules/rating/service.ts` (submitRating + gate work COMPLETED + derive ratingType/rateeId/work_id + 23505 error bisnis)
- [x] Task 4 - Queries `modules/rating/queries.ts` (`listByContractId`, `listForContracts` map→array dua arah)
- [x] Task 5 - Server Actions `modules/rating/actions.ts` (submitRating, requireUser dua role + FormData + redirectTo)
- [x] Task 6 - Detail contract blok rating (form + badge + rating pihak lain read-only)
- [x] Task 7 - My Applications blok rating TALENT + cleanup duplikat blok work
- [x] Task 8 - Build, typecheck, lint, E2E smoke (rate dua arah; gate-fail form hilang saat IN_PROGRESS; restore; RLS REST involved 2 row / asing [] / anon [] / mismatch 42501 / spoof rater 42501 / PATCH 0 rows)
- [x] Task 9 - Update PROGRESS.md

#### Module Verified Work History

- [x] Spec: `docs/superpowers/specs/2026-09-01-workhistory-module-design.md`
- [x] Implementation plan: `docs/superpowers/plans/2026-09-01-workhistory-module.md`
- [x] Task 1 - Migration `016_work_history_rls.sql` (select involved/admin, insert involved, update involved) + push + verifikasi 3 policy
- [x] Task 2 - Service `modules/work_history/service.ts` (`upsertVerifiedHistory`: insert PENDING → flip VERIFIED + verified_at/verified_by, idempotent)
- [x] Task 3 - Trigger di `modules/rating/service.ts` (setelah insert rating sukses; gate kedua rating dua arah lengkap; side effect best-effort)
- [x] Task 4 - Build, typecheck, lint, E2E smoke (rate 1 arah → 0 rows; rate arah kedua → VERIFIED + snapshot; rate ulang dua arah → tetap 1 row; RLS REST involved 1 row / asing [] / anon [] / PATCH 0 rows / INSERT spoof 42501)
- [x] Task 5 - Update PROGRESS.md

---


#### Module Work History Pages

- [x] Migration 017_work_history_public_rls.sql (public VERIFIED SELECT policy)
- [x] Queries modules/work_history/queries.ts (listByTalentId, listVerifiedByTalentId)
- [x] Public Page app/profiles/[id]/work-history/page.tsx
- [x] Private Dashboard app/work-history/page.tsx
- [x] Build & typecheck verification

#### Module Notification

- [x] Spec: docs/superpowers/specs/2026-09-03-notification-module-design.md
- [x] Plan: docs/superpowers/plans/2026-09-03-notification-module-plan.md
- [x] Task 1 - Migration 018_notification_enhancements.sql (actor_id, metadata, is_read→read_at, RLS own) + push
- [x] Task 2 - Service modules/notification/service.ts (notify) + queries (listNotifications, getUnreadCount)
- [x] Task 3 - UI components/notification/notification-badge.tsx (Realtime) + app/notifications/page.tsx
- [x] Task 4 - Side effects notify best-effort di 6 service (application, meeting, contract, payment, work, rating) - tsc + build ok
- [x] Build & typecheck verification

#### Module Admin & Audit

- [x] Spec: docs/superpowers/specs/2026-09-03-admin-audit-design.md
- [x] Plan: docs/superpowers/plans/2026-09-03-admin-audit.md
- [x] Task 1 - Migration 019_admin_audit_rls.sql (reports/audit_logs RLS) + push
- [x] Task 2 - Audit helper modules/audit/service.ts (logAudit, listAuditLogs)
- [x] Task 3 - Report module (schemas, queries, service, actions)
- [x] Task 4 - Admin service modules/admin/service.ts + actions (stats, listUsers, suspend/reactivate)
- [x] Task 5 - Dashboard app/admin/page.tsx (stat cards + nav) + app/admin/users/page.tsx
- [x] Task 6 - Reports UI app/admin/reports/page.tsx + components/report/report-form.tsx
- [x] Task 7 - Audit page app/admin/audit/page.tsx + wire moderate → logAudit + build ok

#### Landing Page - Navbar & Hero Rework

- [x] `components/landing/logo-mark.tsx` (extract LogoMark dari app/page.tsx)
- [x] `components/landing/site-header.tsx` - fixed navbar, pill floating saat scroll (border + backdrop-blur + max-w mengecil), mobile menu dengan animasi toggle ikon
- [x] Hero: tambah announcement pill "Baru: Verified Work History" (pattern arrow-circle dari hero-section-1 21st.dev, diadaptasi ke world Flex Network), restagger entrance `rise`
- [x] `app/globals.css` - smooth scroll + `scroll-margin-top` untuk anchor di bawah fixed nav
- [x] Verifikasi: tsc, eslint (file berubah), next build, screenshot+DOM check desktop & mobile, detector impeccable (0 findings)

#### Module Digital Signature

- [x] Spec + Plan: docs/superpowers/plans/2026-09-04-digital-signature.md (7 task)
- [x] Migration 020_signature.sql (kolom private contracts: status PENDING_SIGNATURE, ttd dua pihak, doc/hash; storage bucket contracts-private + signed URL) + push
- [x] Provider abstraction modules/signature/ (factory `getSignatureProvider` SIGNATURE_MODE=simulated|privy; provider-simulated aktif via pdf-lib; provider-privy stub throw Phase 2) + template dokumen standar FN + hash sha256
- [x] Service modules/signature/service.ts (requestSignature + signDocument dua arah → ACTIVE + seed payments/works + notify + audit) + queries info
- [x] Server Actions modules/signature/actions.ts (kirim permintaan + tanda tangan)
- [x] UI signature panel di detail contract (status sign dua pihak + aksi + download signed URL)
- [x] Webhook stub app/api/webhooks/privy/route.ts (POST raw body, gate verifyWebhook → 401, audit PRIVY_WEBHOOK_RECEIVED via admin client, tanpa session auth)
- [x] Verify: tsc + next build ok

#### Module Email Notification + Audit Fix

- [x] Spec: docs/superpowers/specs/2026-09-04-email-notification-design.md
- [x] modules/notification/email.ts — Resend SDK, template HTML inline (logo + title + message + CTA), getRecipientEmail via admin client (RLS profile_private), skip jika RESEND_API_KEY kosong
- [x] notify() extended — in-app row + email best-effort fire-and-forget (.catch swallow)
- [x] Migration 023_audit_insert_rls.sql — policy insert audit_logs authenticated (append-only; select tetap admin) + push
- [x] logAudit actorType param (USER/ADMIN/SYSTEM, backward compatible default)
- [x] E2E: signature request → notif in-app row + audit row via session logAudit (tanpa backfill) jalan; email mode off (no API key) flow normal
- [x] tsc + build clean, deployed production

#### Portfolio Link + Profil Publik Talent

- [x] Spec: docs/superpowers/specs/2026-09-05-portfolio-link-design.md
- [x] Migration 024_talent_profile_insert_own.sql (policy insert upsert talent_profiles) + push
- [x] /profile: section "Portfolio & Pendidikan" (TALENT only) — portfolio_url, cv_url, school_name, grade_level; action updateTalentProfile + zod URL validation
- [x] Halaman publik /profiles/[id] — nama, bio, chip sekolah/kelas, link portfolio+CV, skills badge, verified work history (VERIFIED badge), empty state per section, 404 notFound
- [x] modules/profile/queries.ts — getPublicTalentProfile (profiles + talent_profiles + skills + verified work history)
- [x] E2E: talent isi link → upsert DB → public profile render lengkap; 404 path OK; tsc + build clean; deployed production

### Sedang Dikerjakan

- (kosong)

### Decision Log

- 2026-09-03: Navbar landing pakai fixed floating pill (scroll-state), tanpa framer-motion; animasi entrance tetap CSS `rise` existing. Referensi 21st.dev hero-section-1 diadaptasi, bukan disalin (foto/gradient violasi DESIGN.md).

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

- 2026-08-29: Meeting CANCELLED terminal, tanpa edit/reschedule (YAGNI); contract gate = `getByApplicationId` di-enforce modul Contract
- 2026-08-29: Smoke meeting menemukan bug service `getOwnedMeeting` (mengecek status application, bukan status meeting) → fix: cek `meetings.status` di `getOwnedMeeting` sendiri
- 2026-08-29: RLS verified via direct REST: hirer owner bisa PATCH, talent non-owner dapat 204 + 0 rows (blocked)
- 2026-08-29: Smoke E2E meeting lulus (schedule → validasi past-date → complete → cancel terminal → talent view)
- 2026-08-29: Consent lazy eksplisit - row hanya saat required; NOT_REQUIRED & MISSING derived, tanpa row
- 2026-08-29: Consent APPROVED & REJECTED terminal; aktor TALENT (simulated declaration); is_minor dibaca apa adanya (defer pengisian)
- 2026-08-29: Contract gate = getConsentDecision (eligible iff !required || APPROVED), di-enforce modul Contract
- 2026-08-29: Smoke consent menemukan `is_minor` ada di `talent_profiles`, bukan `profiles` → fix queries (`getRequirementMap` batch talent_profiles) + service (`talent_profiles.maybeSingle`)
- 2026-08-29: Contract propose = auto-agree HIRER (proposed_by + hirer_agreed); satu tombol agree TALENT cukup untuk ACTIVE
- 2026-08-29: Contract ACTIVE side effects: service insert payments (PENDING, amount=compensation) + works (NOT_STARTED); 23505 dianggap sukses (idempotent)
- 2026-08-29: Contract COMPLETED dicapai via alur Work (modul berikutnya); decline hanya dari PENDING_AGREEMENT → TERMINATED
- 2026-08-29: Contract gate = application SELECTED + meeting COMPLETED + getConsentDecision eligible; gate modul Work = getByApplicationId status ACTIVE
- 2026-08-31: Work transisi status = TALENT saja (BRD 16.2); HIRER hanya confirm completion (verification event, irreversible)
- 2026-08-31: Payment RELEASED = tanggung jawab modul Payment (sprint berikutnya); Work hanya expose gate `getByContractId` (COMPLETED + hirer_confirmed); gate Rating nanti = work COMPLETED
- 2026-08-31: Work actions redirect balik via parameter redirectTo (dipakai 2 halaman: /applications dan /contracts/[id])
- 2026-08-31: Payment SIMULATED_PAID & RELEASED aktor = HIRER (API-SPEC 12.3/12.4); tombol "Bayar (Simulasi)" + "Rilis Dana (Simulasi)" di detail contract
- 2026-08-31: Contract COMPLETED = side effect modul Payment saat RELEASED (satu-satunya jalur; set status + completed_at)
- 2026-08-31: RLS payments UPDATE = hirer-only (talent read-only di level RLS); notification side effect defer
- 2026-08-31: Dua update berurutan non-atomik (payments → contracts) diterima utk simulated escrow; RPC/trigger ditolak demi konsistensi pola service-layer
- 2026-08-31: Rating gate = work.status COMPLETED saja (API-SPEC 14.2) - tanpa gate payment RELEASED (keputusan user); rating sah saat contract masih ACTIVE
- 2026-08-31: Rating immutable - tanpa UPDATE/DELETE di UI/service/RLS; UNIQUE(work_id, rater_id, rating_type) + 23505 diterjemahkan error bisnis (beda dari precedent seeding yang idempotent-success)
- 2026-08-31: ratingType/rateeId/raterId/work_id derived server-side dari posisi rater; client hanya kirim contractId + score + reviewText
- 2026-08-31: RLS ratings INSERT anti-spoof: rater_id = auth.uid() + rating_type konsisten posisi pihak kontrak (talent→TALENT_RATES_HIRER, hirer→HIRER_RATES_TALENT)
- 2026-08-31: Aktor rating = TALENT & HIRER (dua arah) - action pakai requireUser, ownership di service + RLS; admin read-only
- 2026-08-31: Cleanup bug lama: duplikat blok Work di app/applications/page.tsx (render 2x sejak task UI Work) dihapus saat integrasi rating
- 2026-09-01: Gate Verified Work History = kedua rating dua arah lengkap (TALENT_RATES_HIRER + HIRER_RATES_TALENT) - bukan hirer confirmation (menyimpang API-SPEC 13.3/15.4; keputusan user)
- 2026-09-01: work_history di-upsert on-demand oleh side effect modul Rating (satu-satunya jalur tulis); PENDING dulu lalu flip VERIFIED + verified_at/verified_by = rater pelengkap pasangan; idempotent (23505 race-benign, neq VERIFIED)
- 2026-09-01: Side effect best-effort non-atomik - kegagalan flip tidak menggagalkan rating (precedent non-atomik Contract 2026-08-29)
- 2026-09-01: RLS work_history = SELECT involved/admin, INSERT/UPDATE pihak kontrak; admin moderation & halaman Work History defer
- 2026-09-03: Work History Pages selesai (017 public VERIFIED policy + queries + public/private page; hirer_id tidak ada di tabel - publik expose title/duration/compensation/verified_at)
- 2026-09-03: Notification ARCHITECTURAL - migration 018 (actor_id, metadata, is_read→read_at), service notify + queries, badge Realtime + page, side effects 6 service best-effort
- 2026-09-03: Admin & Audit ARCHITECTURAL - migration 019 (reports/audit_logs RLS), audit logAudit helper, report module, admin stats/users, report moderation + auditTrail
- 2026-09-04: Digital signature dual-mode (simulated default, PrivyID Phase 2); status PENDING_SIGNATURE; signatory TALENT+HIRER; PDF via pdf-lib + template standar FN; .env.example ditrack via gitignore exception

### Next Task

1. ~~Smoke-test manual~~ ✅ Smoke test E2E lulus (register → create → moderate → browse → apply → review → select).
2. ~~Match score di browse card & single-opportunity score~~ ✅ `getMatchScoresForTalent()` + badge shared `modules/matching/badge.ts`; browse card & detail page tampil untuk TALENT.
3. ~~Seed master-data skills/interests~~ ✅ Seeded (20 skills, 12 interests) via `supabase/seed/seed-skills-interests.sql`.
4. ~~Admin dashboard redirect~~ ✅ Route ADMIN → `/dashboard/admin` (page + link moderasi). Typecheck lulus.
5. ~~Module Meeting~~ ✅ Spec + plan + 10 task selesai, E2E smoke lulus.
6. ~~Module Consent~~ ✅ Spec + plan + 10 task selesai, E2E smoke + RLS lulus.
7. ~~Module Contract~~ ✅ Spec + plan + 11 task selesai, E2E smoke + RLS lulus.
8. ~~Module Work~~ ✅ Spec + plan + 10 task selesai, E2E smoke + RLS lulus.
9. ~~Module Rating~~ ✅ Spec + plan + 9 task selesai, E2E smoke + RLS lulus.
10. ~~Module Verified Work History~~ ✅ Spec + plan + 5 task selesai, E2E smoke + RLS lulus.
11. ~~Module Work History Pages~~ ✅ Spec + plan + 4 task selesai (017 + queries + public/private).
12. ~~Module Notification~~ ✅ Spec + plan + 4 task selesai, build ok.
13. ~~Module Admin & Audit~~ ✅ Spec + plan + 7 task selesai, build ok.

---

**Status Terakhir:** ✅ Sprint 13 - Admin & Audit **selesai** (Task 1-7). Build ok. Business Flow + Ops lengkap (Task 1-4). Build ok. Next: Report / Admin/Audit (Task 1-5). Build, typecheck, lint, E2E smoke + RLS sukses. Business Flow inti lengkap (Register → … → Rating → Verified Work History). Next milestone kandidat (lihat BRD): halaman Work History (TALENT + publik VERIFIED-only), Notification, Report, atau Admin/Audit.
