# Consent Module Design

## Goal

Membangun modul Consent: simulated parent/guardian approval untuk application yang sudah melewati Meeting COMPLETED. TALENT (dalam simulated consent flow) membuat consent record (PENDING), lalu menyetujui (APPROVED) atau menolak (REJECTED) atas nama wali. Modul `modules/consent/` di atas skema DB yang sudah live (`001_initial_schema.sql`, tabel `consents`). Consent APPROVED/NOT_REQUIRED adalah prasyarat contract (eligibility gate modul Contract).

## Decisions (locked)

- **Lazy eksplisit (Pendekatan A).** Row consent dibuat hanya saat TALENT submit aksi "request". Tidak ada auto-create dari modul Meeting (modul terpisah, tanpa coupling).
- **NOT_REQUIRED = tanpa row.** Status `NOT_REQUIRED` selalu derived (tidak pernah tersimpan di DB). Row hanya eksis ketika required.
- **REJECTED = terminal.** APPROVED = terminal. Tidak ada re-open, re-request, atau edit (YAGNI, mengikuti pola Meeting CANCELLED terminal).
- **Aktor semua mutation = TALENT owner** (API-SPEC 10.3-10.5: simulated consent flow dieksekusi TALENT, bukan akun guardian terpisah). HIRER & ADMIN read-only.
- **`is_minor` dibaca apa adanya** dari `profiles.is_minor` (kolom ada di 001, default false, belum pernah diisi - register belum collect `birth_date`). Pengisian `is_minor`/`birth_date` = task terpisah di luar sprint ini. Consent tetap berfungsi via `opportunity.requires_consent`.
- **Guardian data dilarang keras.** Schema Zod tidak menerima `guardianName`, `guardianContact`, `guardianEmail`, `guardianAccountId`, `identityDocument`, `identityNumber`, atau data wali sensitif apa pun. Consent = simulated declaration + metadata operasional saja (BRD 13.2, APPENDIX A.15 Privacy Rule, AGENTS.md Security/Privacy).
- **Notification & audit → defer** (task terpisah).
- **REST API → defer** (konsisten keputusan 2026-08-29: Server Actions dulu).
- **Contract gate die-enforce di modul Contract (modul berikutnya)** - modul consent expose `getByApplicationId` + `getConsentDecision`; kontrak wajib blok bila `required && status !== 'APPROVED'`. Ditulis eksplisit agar tidak hilang.
- DB tidak diubah - tabel `consents` sudah lengkap di 001 (kolom, CHECK status, UNIQUE application_id). Sprint ini hanya menambah RLS granular.

## Architecture

Alur konsisten dengan modul sebelumnya:

UI → Server Actions → Consent Service → Supabase (server client, RLS aktif)

Pola: `schemas.ts` → `queries.ts` (read) → `service.ts` (mutations) → `actions.ts`.

## Module Structure

```
modules/consent/
├── schemas.ts   → createConsentSchema { applicationId }
├── queries.ts   → getByApplicationId, listForApplications, getRequirementMap, getConsentView, getConsentDecision
├── service.ts   → requestConsent, approve, reject (state machine + ownership + requirement check)
└── actions.ts   → createConsent (ActionResult), approveConsent, rejectConsent (void)
```

## State Machine

Status canonical: `NOT_REQUIRED` (derived, tanpa row) · `PENDING` · `APPROVED` · `REJECTED` (APPENDIX A.17).

| Transisi | Syarat | Aktor |
|---|---|---|
| `- → PENDING` (insert row) | application `SELECTED` + meeting `COMPLETED` + required + belum ada row | TALENT owner |
| `PENDING → APPROVED` | talent owner + `consent_required = true`; set `approved_at` | TALENT |
| `PENDING → REJECTED` | talent owner + `consent_required = true`; set `rejected_at`; **terminal** | TALENT |

`APPROVED` dan `REJECTED` sama-sama terminal. Tidak ada update setelahnya. Tidak ada policy DELETE (cascade dari applications).

## Requirement Evaluation (server-side)

```
required = opportunity.requires_consent = true OR profiles.is_minor = true
```

- Dievaluasi server-side di service saat `requestConsent`; client tidak pernah menentukan requirement (API-SPEC 10.1).
- DB aktual: kolom ada di `opportunities.requires_consent` (001:116) dan `profiles.is_minor` (001:66) - **bukan** `talent_profiles` seperti tulisan API-SPEC; ikuti DB aktual (konsisten keputusan 2026-08-29).
- `required_reason` = metadata string yang dibangun server dari sumber requirement (mis. `"Opportunity requires consent; Talent is minor"`). Bukan input user.

## Consent Decision (derived)

DB hanya menyimpan row saat required (PENDING/APPROVED/REJECTED). UI & contract gate butuh status efektif yang menyatukan row + requirement:

```ts
type ConsentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MISSING";

type ConsentDecision = {
  required: boolean;
  status: ConsentStatus;
};
```

Aturan derived (`row` = consent row untuk application, bisa `null`):

- Tidak required → `{ required: false, status: "NOT_REQUIRED" }` (row tidak akan pernah ada).
- Required + belum ada row → `{ required: true, status: "MISSING" }` (talent belum request).
- Required + row ada → `{ required: true, status: row.status }` (PENDING/APPROVED/REJECTED).
- `NOT_REQUIRED` dan `MISSING` bukan status DB - murni derived; "missing while required" diblok (APPENDIX A.17).
- **`getConsentDecision(applicationId)`** (lihat Queries) = single call contract gate modul Contract: eligible iff `!required || status === "APPROVED"`; blocked untuk `MISSING`, `PENDING`, `REJECTED`.

## Schemas (Zod)

```ts
import { z } from "zod";

export const createConsentSchema = z.object({
  applicationId: z.string().uuid("Application tidak valid"),
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
```

Sengaja minimal (API-SPEC 22.6). Zod `.strip()` default membuang field tak dikenal - guardian data tidak pernah masuk meski di-inject client. Validasi business (ownership, state, requirement) tetap di service.

## RLS - `011_consent_rls.sql`

Baseline `003_rls_policies.sql`: `consents` enable RLS, default-deny, tanpa policy (003:126 "TBD in application module").

Tambahan (mengikuti gaya `010`, semua `to authenticated`):

```sql
-- SELECT: talent pemilik consent, hirer owner opportunity, admin
create policy "consents_select_involved"
  on public.consents for select to authenticated
  using (
    talent_id = auth.uid()
    or exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
    or is_admin()
  );

-- INSERT: talent owner; application SELECTED + meeting COMPLETED (defense-in-depth; service cek dulu)
create policy "consents_insert_talent"
  on public.consents for insert to authenticated
  with check (
    talent_id = auth.uid()
    and exists (
      select 1 from public.applications a
      join public.meetings m on m.application_id = a.id
      where a.id = application_id
        and a.status = 'SELECTED'
        and m.status = 'COMPLETED'
    )
  );

-- UPDATE: talent owner saja (transisi approve/reject); hirer tidak boleh
create policy "consents_update_talent"
  on public.consents for update to authenticated
  using (talent_id = auth.uid())
  with check (talent_id = auth.uid());
```

Catatan: privacy-sensitive - HIRER hanya SELECT (butuh lihat status consent untuk tahu contract bisa lanjut), tidak pernah INSERT/UPDATE. Tidak ada policy DELETE.

## Service

Semua mutation: ownership check dulu → state check → write. Return `ServiceResult<T>` (`{ data, error }`, konsisten modul meeting/application).

- `requestConsent(talentId, input)`:
  1. Ambil application (`id, status, talent_id, opportunity_id`) → tolak bila tidak ada.
  2. Tolak bila `talent_id !== talentId` ("Not owner").
  3. Tolak bila `status !== 'SELECTED'`.
  4. Ambil meeting untuk application → tolak bila tidak ada atau `status !== 'COMPLETED'` ("Meeting belum selesai").
  5. Ambil opportunity (`requires_consent`) + profile talent (`is_minor`) → `required`; tolak bila `!required` ("Consent tidak diperlukan").
  6. Cek consent existing untuk `application_id` → tolak bila sudah ada ("Consent sudah diajukan").
  7. Insert `PENDING` + `consent_required: true` + `required_reason` + `requested_at`. `23505` → pesan duplikat sama.
- `approve(consentId, talentId)`: fetch consent → tolak bila `talent_id !== talentId`; tolak bila `!consent_required`; harus `PENDING`; set `APPROVED` + `approved_at`.
- `reject(consentId, talentId)`: sama; set `REJECTED` + `rejected_at` (terminal).

Helper ownership: `getOwnedConsent(consentId, talentId)`.

## Queries

- `type ConsentRow = { id, application_id, talent_id, opportunity_id, consent_required, required_reason, status, requested_at, approved_at, rejected_at }`.
- `getByApplicationId(applicationId)` → `ConsentRow | null`. Dipakai: **contract gate nanti** + render kondisional.
- `listForApplications(applicationIds)` → `Map<applicationId, ConsentRow>`. Batch render tanpa N+1.
- `getRequirementMap(applicationIds)` → `Map<applicationId, { required: boolean; reason: string | null }>` - join `applications → opportunities.requires_consent` + `profiles.is_minor` per talent; dipakai UI talent & hirer untuk derived state.
- `getConsentDecision(applicationId)` → `{ required, status }` - gabungan requirement + row (`row?.status ?? "NOT_REQUIRED"`); **single call untuk contract gate modul Contract**: blok bila `required && status !== "APPROVED"`.

## Server Actions

- `createConsent(_prev, formData)` → `ActionResult` (useActionState; hidden `applicationId`; error bisnis tampil inline).
- `approveConsent(consentId)` → `Promise<void>` fire-and-forget + `revalidatePath` + `redirect("/applications")` (konsisten keputusan 2026-08-29).
- `rejectConsent(consentId)` → `Promise<void>` fire-and-forget.
- Semua: `requireRole("TALENT")` dulu.

## Pages

1. `app/applications/page.tsx` (TALENT) - blok consent per application:
   - required + row PENDING → info "Menunggu persetujuan wali (simulasi)" + tombol **Setujui** / **Tolak** (plain form actions).
   - required + row PENDING → juga deklarasi copy jelas: deklarasi disetujui talent atas nama wali (simulasi), tanpa input data wali.
   - required + belum ada row + meeting COMPLETED + app SELECTED → form "Ajukan Consent" (client component `ConsentRequestForm`, useActionState untuk error inline).
   - row APPROVED / REJECTED → badge read-only (terminal).
   - Tidak required → tidak render apa pun (NOT_REQUIRED = senyap).
2. `app/hirer/opportunities/[id]/applications/page.tsx` (HIRER) - badge consent read-only per application: row ada → `Consent: <status>`; tidak ada → tanpa badge (talent belum request atau not required; detail tak diekspos ke hirer - `requires_consent` & minor status talent bukan urusan hirer).

## Security & Privacy Rules

- Zod validasi semua input; field guardian apa pun ditolak by-construction (schema minimal + strip).
- `requireRole("TALENT")` + ownership check `consents.talent_id = auth.uid()` (dan `applications.talent_id`) di service sebelum setiap mutation.
- RLS defense-in-depth (policy di atas); UPDATE terkunci ke talent owner.
- Simulated only: tidak ada guardian account, guardian login, guardian dashboard, independent guardian auth, dokumen identitas (KTP/KK/Akta), kontak guardian.
- `required_reason` hanya metadata operasional (sumber rule), bukan data pribadi.
- Tidak log data sensitif.

## Out of Scope

- Notifikasi ke talent/hirer saat consent dibuat/diputus (modul notification).
- Audit log side effects.
- REST API endpoints (defer, konsisten keputusan 2026-08-29).
- Halaman consent terpisah (info tampil inline).
- Pengisian `is_minor` / collect `birth_date` saat register (task terpisah).
- Modul Contract + gate enforcement (modul berikutnya; gate function sudah disiapkan).

## Acceptance Criteria

1. TALENT owner dapat request consent hanya untuk application `SELECTED` + meeting `COMPLETED` + required; ditolak bila bukan owner, bukan SELECTED, meeting belum COMPLETED, tidak required, atau sudah ada row.
2. Consent `PENDING` bisa `APPROVED` (dengan `approved_at`) atau `REJECTED` (dengan `rejected_at`) oleh TALENT owner; keduanya terminal; `consent_required = false` tidak pernah bisa di-approve/reject.
3. Hirer melihat badge consent read-only; tidak punya akses mutation.
4. RLS `consents` aktif: involved parties + admin SELECT, talent owner INSERT/UPDATE, lainnya default-deny.
5. `getConsentDecision` siap dipakai sebagai contract gate (dokumentasi eksplisit).
6. Tidak ada field guardian di schema/DB/UI; tidak ada dokumen identitas tersimpan.
7. `npm run build` + typecheck + lint lulus.
