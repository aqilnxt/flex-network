# Application Module Design

## Goal

Membangun modul Application: TALENT apply ke opportunity yang PUBLISHED, HIRER melihat pelamar lalu me-review/memilih/menolak. Modul `modules/application/` di atas skema DB yang sudah live (`001_initial_schema.sql`, tabel `applications`).

## Decisions (locked)

- **Reject** dari `APPLIED` **atau** `UNDER_REVIEW`; **select** hanya dari `UNDER_REVIEW` (gabungan APPENDIX A.12 + API-SPEC 7).
- **Notification & audit → defer** (task terpisah).
- **`max_talent` di-enforce saat select** (block bila jumlah `SELECTED` pada opportunity tersebut sudah `>= max_talent`).
- **Reject reason TIDAK disimpan** - tabel `applications` tidak punya kolom reason (ikuti DB aktual, konsisten keputusan Opportunity). Reject tanpa reason.
- **UI menu inti** saja (bukan minimal, tanpa halaman detail application terpisah).

## Architecture

Alur konsisten dengan `modules/auth`, `modules/profile`, `modules/opportunity`:

UI → Server Actions → Application Service → Supabase (server client, RLS aktif)

Pola: `schemas.ts` → `queries.ts` (read) → `service.ts` (mutations) → `actions.ts`.

## Module Structure

```
modules/application/
├── schemas.ts   → createApplicationSchema { opportunityId, message? } + inferred type
├── queries.ts   → listForTalent, listForOpportunity, getApplicationStatus
├── service.ts   → apply, review, select, reject (state machine + RBAC)
└── actions.ts   → apply, reviewApplication, selectApplication, rejectApplication
```

## State Machine

Status canonical: `APPLIED → UNDER_REVIEW → SELECTED / REJECTED`.

| Transisi | Syarat | Aktor |
|---|---|---|
| `- → APPLIED` | opportunity `PUBLISHED`, `application_deadline > now()`, belum ada duplikat | TALENT |
| `APPLIED → UNDER_REVIEW` | hirer owner opportunity | HIRER |
| `UNDER_REVIEW → SELECTED` | hirer owner + jumlah `SELECTED` < `max_talent` | HIRER |
| `APPLIED → REJECTED` | hirer owner | HIRER |
| `UNDER_REVIEW → REJECTED` | hirer owner | HIRER |

Semua transisi divalidasi di service layer (cegah: status ilegal, non-owner, over-hire, duplikat, deadline lewat, opportunity non-PUBLISHED). Transisi ilegal ditolak.

## Schemas (Zod)

```ts
export const createApplicationSchema = z.object({
  opportunityId: z.string().uuid(),
  message: z.string().trim().max(1000).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
```

## RLS - `007_application_rls.sql`

Baseline (`003_rls_policies.sql`) sudah ada:
- `applications_select_owner_or_hirer` - select (talent owner / hirer terkait).
- `applications_insert_talent` - insert `with check (talent_id = auth.uid())`.

Tambahan (additive): policy **update** untuk HIRER.

```sql
create policy "applications_update_hirer"
  on public.applications for update to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  );
```

Catatan: admin access tidak ditambahkan (di luar scope task ini; defer ke sprint berikutnya bila perlu).

## Service

- `apply(talentId, input)` - ambil opportunity; tolak bila bukan `PUBLISHED` atau `application_deadline <= now()`; insert status `APPLIED` (UNIQUE jadi defense duplikat); return `{ data, error }`.
- `review(hirerId, id)` - verify `hirer` owner opportunity terkait; hanya status `APPLIED`; set `UNDER_REVIEW` + `reviewed_at`.
- `select(hirerId, id)` - verify owner; hanya status `UNDER_REVIEW`; hitung count `SELECTED` pada opportunity itu → block bila `>= max_talent`; set `SELECTED` + `selected_at`.
- `reject(hirerId, id)` - verify owner; status `APPLIED`/`UNDER_REVIEW`; set `REJECTED` + `rejected_at`.

Semua mutation mengembalikan `{ data, error }` custom (untuk konsistensi) dan melakukan ownership/state check sebelum write.

## Queries

- `listForTalent(talentId)` - daftar application milik talent (semua status), join opportunity title/status untuk tampilan.
- `listForOpportunity(opportunityId, hirerId)` - return `{ applications, maxTalent, selectedCount }`; hanya valid untuk hirer owner (jika bukan owner → return `{ error }`). `applications` = daftar pelamar + join talent profile (full_name). `maxTalent` dan `selectedCount` dipakai UI untuk men-disable tombol Select saat kuota penuh.
- `getApplicationStatus(talentId, opportunityId)` - return status application bila ada (atau `null`), dipakai halaman detail opportunity untuk men-disable tombol Apply bila talent sudah apply + menampilkan status.

## Server Actions (return `ActionResult`; `requireUser`/`requireRole` di awal)

- `apply(_prev, formData)` → `ActionResult` (useActionState; error duplikat/deadline/non-published ditampilkan ke talent). Field: `opportunityId`, `message`.
- `reviewApplication(id)` → `Promise<void>` fire-and-forget + `revalidatePath` (konsisten mutation opportunity).
- `selectApplication(id)` → `Promise<void>` fire-and-forget.
- `rejectApplication(id)` → `Promise<void>` fire-and-forget.

## Pages

1. `app/applications/page.tsx` - **TALENT** "My Applications" (`requireRole("TALENT")`), list + status badge + link opportunity.
2. `app/opportunities/[id]/page.tsx` - tambah form **Apply** (client component) hanya untuk role TALENT; tampil disable + status bila sudah apply (`getApplicationStatus`).
3. `app/hirer/opportunities/[id]/applications/page.tsx` - **HIRER** applicant list (`requireRole("HIRER")` + ownership check), semua status + aksi review/select/reject + indikator kuota (`maxTalent`/`selectedCount`).
4. `app/hirer/opportunities/page.tsx` - tambah link "Lihat Applicant" ke halaman applicant.

## Security Rules

- Jangan percaya input/client - Zod validasi input.
- Authorization selalu server-side - `requireUser()`/`requireRole()` sebelum mutation; ownership check `hirer_id = auth.uid()` / `talent_id = auth.uid()`.
- RLS sebagai defense-in-depth.
- Jangan log data sensitif.

## Out of Scope

- Notification & audit side effects (task terpisah).
- Admin access ke application.
- Reject reason persistence (tanpa kolom DB).
- Matching (task terpisah).

## Acceptance Criteria

1. TALENT dapat apply ke opportunity PUBLISHED (create `APPLIED`); ditolak bila deadline lewat/duplikat/non-PUBLISHED.
2. HIRER owner dapat lihat applicant, move `APPLIED → UNDER_REVIEW`, lalu `SELECTED` (dengan enforcement `max_talent`) atau `REJECTED`.
3. HIRER dapat langsung reject dari `APPLIED`.
4. Talent melihat status application-nya sendiri; tombol Apply disable bila sudah apply.
5. Semua transisi ilegal & non-owner ditolak.
6. `npm run build` lulus tanpa error TypeScript.
