# Opportunity Module Design

## Goal

Membangun inti marketplace: HIRER membuat/mengelola opportunity, ADMIN memoderasi, TALENT menelusuri. Module `modules/opportunity/` di atas skema DB yang sudah live (`001_initial_schema.sql`).

## Decisions (locked)

- **PUBLISHED ditentukan oleh ADMIN** via moderasi. HIRER hanya submit (`DRAFT → PENDING_REVIEW`); HIRER juga boleh close (`PUBLISHED → CLOSED`).
- **Ikut DB aktual** (bukan API-SPEC yang bentrok):
  - `compensation` = `integer` (bukan string).
  - `cv_requirement` / `portfolio_requirement` / `interview_requirement` = `boolean` (bukan enum).
  - `opportunity_type` / `work_mode` / `compensation_type` = `text` polos (tanpa CHECK). Validasi enum dilakukan di app-layer (Zod), **tanpa migration**.
- **Browse authenticated-only**. RLS baseline `to authenticated` sudah benar; API-SPEC §6.1 disync belakangan.
- **Matching di luar scope** sprint ini (task terpisah).

## Architecture

Alur tetap mengikuti pola yang sudah ada:

UI → Server Actions → Service → Supabase (server client, RLS aktif)

Konsisten dengan `modules/auth` dan `modules/profile`: `schemas.ts` → `service.ts` → `actions.ts`. Read-side dipisah ke `queries.ts` karena browse punya banyak filter.

## Module Structure

```
modules/opportunity/
├── schemas.ts    → createOpportunitySchema, updateOpportunitySchema, moderateSchema (+ inferred types)
├── queries.ts    → listPublished (search/filter/sort/page), getOpportunityById (respect visibility)
├── service.ts    → mutations: createOpty, updateOpty, submitForReview, closeOpty, moderateOpty
└── actions.ts    → Server Actions: create, update, submitReview, close, moderate
```

## State Machine

Status canonical: `DRAFT → PENDING_REVIEW → PUBLISHED → CLOSED`.

| Transisi | Dari → Ke | Actor | Action |
|---|---|---|---|
| submit | DRAFT → PENDING_REVIEW | HIRER owner | `submitReview` |
| approve | PENDING_REVIEW → PUBLISHED | ADMIN | `moderate(APPROVE_PUBLISH)` |
| request changes | PENDING_REVIEW → DRAFT | ADMIN | `moderate(REQUEST_CHANGES)` |
| close | PUBLISHED → CLOSED | HIRER owner / ADMIN | `close` / `moderate(CLOSE)` |
| delete | DRAFT → hapus | HIRER owner | `delete` |
| delete | sesuai moderasi | ADMIN | `moderate(DELETE)` |

Semua transisi divalidasi di service layer (cek status saat ini + kepemilikan) sebelum write. Transisi ilegal ditolak.

## Schemas (Zod) - sesuai DB aktual

`createOpportunitySchema`:
- `title` string min 5 max 150
- `description` string min 10
- `opportunityType` enum `INTERNSHIP|PKL|CONTRACT|FREELANCE|TEMPORARY_WORK|DAILY_WORK|EVENT_WORK|PART_TIME`
- `location` optional string
- `workMode` enum `ONSITE|REMOTE|HYBRID` default `ONSITE`
- `startDate` / `endDate` optional string (`:date` di DB)
- `workingHours` / `duration` optional string
- `compensation` integer min 0 optional
- `compensationType` enum `PAID|UNPAID|NEGOTIABLE` default `NEGOTIABLE`
- `requirements` / `responsibilities` / `otherTerms` optional string
- `maxTalent` int min 1 default 1
- `applicationDeadline` string datetime (required untuk create; divalidasi ulang saat submit)
- `requiresConsent` boolean default false
- `cvRequirement` / `portfolioRequirement` / `interviewRequirement` boolean default false
- `meetingMethod` optional string
- `skillIds` array uuid default `[]`
- `interestIds` array uuid default `[]`

`updateOpportunitySchema` = partial dari create (tanpa mengubah `status` langsung).

`moderateSchema`:
- `action` enum `APPROVE_PUBLISH|REQUEST_CHANGES|CLOSE|DELETE`
- `notes` optional string

Inferred types: `CreateOpportunityInput`, `UpdateOpportunityInput`, `ModerateInput`.

## RLS - `006_opportunity_rls.sql`

Baseline (`003_rls_policies.sql`) sudah menyediakan owner-scoped policy untuk `opportunities`. Tambahan bersifat **additive** (permissive policy di-OR):

- Helper `public.is_admin()` → `security definer`, `set search_path = ''`, cek `profiles.role = 'ADMIN'`.
- `opportunities`: policy select/update/delete tambahan untuk `is_admin()` (admin lihat & kelola semua status).
- `opportunity_skills` & `opportunity_interests` (saat ini tanpa policy → default-deny): policy select/insert/delete memakai `exists` terhadap parent `opportunities` dengan aturan visibility & ownership yang sama (published/owner/admin).

ADMIN moderation tetap lewat **server client** (bukan `admin.ts`); policy admin memungkinkan akses ini.

## Server Actions (semua return `ActionResult<T>`, ownership check di awal)

- `createOpportunity(formData)` - HIRER; insert status `DRAFT` + skill/interest junction.
- `updateOpportunity(id, formData)` - HIRER owner; hanya status `DRAFT`/`PENDING_REVIEW` yang boleh diubah.
- `submitReview(id)` - HIRER owner; validasi required fields + deadline; set `submitted_for_review_at`, status `PENDING_REVIEW`.
- `closeOpportunity(id)` - HIRER owner / ADMIN; `PUBLISHED → CLOSED`, set `closed_at`.
- `moderateOpportunity(id, action, notes)` - ADMIN; mapping ke transisi; set `moderated_by/at/notes`.
- `deleteOpportunity(id)` - HIRER owner (hanya DRAFT).

## Queries

- `listPublished({ search, type, workMode, location, skillId, interestId, compensationType, sort, page, limit })` - filter `status = PUBLISHED`; HIRER juga melihat miliknya (klausa owner).
- `getOpportunityById(id, viewer)` - enforce visibility (published / owner hirer / admin).

## Pages

- `app/opportunities/page.tsx` - browse/search/filter.
- `app/opportunities/[id]/page.tsx` - detail (data + hirer + skills/interests).
- `app/hirer/opportunities/page.tsx` - daftar opportunity milik hirer (semua status).
- `app/hirer/opportunities/new/page.tsx` & `[id]/edit/page.tsx` - form create/edit (`useActionState`).
- `app/admin/opportunities/page.tsx` - antrean moderasi (PENDING_REVIEW) + form approve/reject.

## Security Rules (dari AGENTS.md)

- Jangan percaya input/client - Zod validasi semua input.
- Authorization selalu server-side - `requireUser()` / `requireRole()` sebelum mutation; ownership check `hirer_id = user.id`.
- RLS sebagai defense-in-depth.
- Jangan log data sensitif.

## Out of Scope

- Matching (skill/interest) - task terpisah.
- REST API routes (tetap Server Actions).
- Notification trigger saat moderasi.
- Hirer profile enrichment (company name) - pakai join `hirer_profiles` secukupnya.

## Acceptance Criteria

1. HIRER dapat create (DRAFT), update, submit-review (PENDING_REVIEW).
2. ADMIN dapat approve → PUBLISHED, request-changes → DRAFT, close, delete.
3. HIRER owner dapat close opportunity PUBLISHED.
4. TALENT (auth) dapat browse/search/filter opportunity PUBLISHED dan view detail.
5. Semua transisi ilegal ditolak; ownership di-enforce.
6. `npm run build` lulus tanpa error TypeScript.
