# Meeting Module Design

## Goal

Membangun modul Meeting: HIRER menjadwalkan meeting untuk application yang SELECTED, lalu menandai COMPLETED / CANCELLED. Meeting COMPLETED adalah prasyarat contract (eligibility gate). Modul `modules/meeting/` di atas skema DB yang sudah live (`001_initial_schema.sql`, tabel `meetings`).

## Decisions (locked)

- **CANCELLED = terminal.** Tidak ada reschedule; tidak ada jalur balik ke SCHEDULED (APPENDIX A.14).
- **Edit/reschedule meeting → defer** (YAGNI). Konsekuensi: salah jadwal tidak bisa dikoreksi (cancel terminal, tanpa edit) - diterima sebagai keterbatasan MVP.
- **1 meeting per application** - dijaga `UNIQUE(application_id)` (APPENDIX A.13).
- **Schedule hanya dari application `SELECTED`** (API-SPEC 9.2).
- **Aktor semua mutation = HIRER owner** (via `opportunity.hirer_id`). TALENT read-only. Admin read via policy (lihat RLS).
- **Notification & audit → defer** (task terpisah).
- **REST API → defer** (konsisten keputusan 2026-08-29: Server Actions dulu).
- **Contract gate die-enforce di modul Contract (modul berikutnya)** - modul meeting hanya expose `getByApplicationId`; kontrak wajib cek `status === 'COMPLETED'` sebelum insert. Ditulis eksplisit agar tidak hilang.

## Architecture

Alur konsisten dengan modul sebelumnya:

UI → Server Actions → Meeting Service → Supabase (server client, RLS aktif)

Pola: `schemas.ts` → `queries.ts` (read) → `service.ts` (mutations) → `actions.ts`.

## Module Structure

```
modules/meeting/
├── schemas.ts   → scheduleMeetingSchema { applicationId, meetingDate, meetingTime, meetingLink?, meetingMethod?, notes? }
├── queries.ts   → getByApplicationId, listForApplications, getMeetingForTalent
├── service.ts   → schedule, complete, cancel (state machine + ownership)
└── actions.ts   → scheduleMeeting (ActionResult), completeMeeting, cancelMeeting (void)
```

## State Machine

Status canonical: `SCHEDULED → COMPLETED / CANCELLED`.

| Transisi | Syarat | Aktor |
|---|---|---|
| `- → SCHEDULED` | application `SELECTED` + hirer owner + belum ada meeting | HIRER |
| `SCHEDULED → COMPLETED` | hirer owner; set `completed_at` | HIRER |
| `SCHEDULED → CANCELLED` | hirer owner; **terminal** | HIRER |

`COMPLETED` dan `CANCELLED` sama-sama terminal - tidak ada update setelahnya.

## Schemas (Zod)

```ts
export const scheduleMeetingSchema = z
  .object({
    applicationId: z.string().uuid(),
    meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    meetingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    meetingLink: z.string().trim().url().max(500).optional().or(z.literal("")),
    meetingMethod: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (v) => new Date(`${v.meetingDate}T${v.meetingTime}`).getTime() > Date.now(),
    { message: "Tanggal & jam meeting harus di masa depan", path: ["meetingDate"] },
  );

export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;
```

## RLS - `010_meeting_rls.sql`

Baseline `003_rls_policies.sql`: `meetings` enable RLS, default-deny, tanpa policy.

Tambahan (mengikuti gaya `007`/`008`, semua `to authenticated`):

```sql
-- SELECT: hirer owner opportunity, talent pemilik application, admin
create policy "meetings_select_involved"
  on public.meetings for select to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id
        and (o.hirer_id = auth.uid() or a.talent_id = auth.uid())
    )
    or is_admin()
  );

-- INSERT: hirer owner, application harus SELECTED (defense-in-depth; service cek dulu)
create policy "meetings_insert_hirer"
  on public.meetings for insert to authenticated
  with check (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid() and a.status = 'SELECTED'
    )
  );

-- UPDATE: hirer owner (transisi complete/cancel)
create policy "meetings_update_hirer"
  on public.meetings for update to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
  );
```

Catatan: tidak ada policy DELETE (tidak ada use case delete meeting; `on delete cascade` dari applications cukup).

## Service

Semua mutation: ownership check dulu → state check → write. Return `{ data, error }` (konsisten modul application).

- `schedule(hirerId, input)`:
  1. Ambil application (`id, status, opportunity_id`).
  2. Ambil opportunity (`hirer_id`) → tolak bila `hirer_id !== hirerId` ("Not owner").
  3. Tolak bila `status !== 'SELECTED'`.
  4. Cek meeting existing untuk `application_id` → tolak bila sudah ada ("Meeting sudah dijadwalkan").
  5. Insert `SCHEDULED` (UNIQUE sebagai defense duplikat; 23505 → pesan sama).
- `complete(meetingId, hirerId)`: ownership via meeting → application → opportunity; harus `SCHEDULED`; set `COMPLETED` + `completed_at`.
- `cancel(meetingId, hirerId)`: ownership; harus `SCHEDULED`; set `CANCELLED` (tanpa kolom cancelled_at - DB tidak punya; ikuti DB aktual).

Helper ownership: `getOwnedMeeting(meetingId)` → join `applications` → `opportunities`, cek `hirer_id`.

## Queries

- `getByApplicationId(applicationId)` - meeting untuk satu application (atau `null`). Dipakai: applicant list (render kondisional) + **contract gate nanti**.
- `listForApplications(applicationIds)` - `Map<applicationId, Meeting>`, batch fetch untuk render list tanpa N+1.
- Talent read: lewat `listForTalent` application yang sudah ada? **Tidak** - applicant list hirer pakai `listForApplications`; talent lihat meeting via blok baru di `app/applications/page.tsx` memakai query per application (talent punya ≤ beberapa application; loop `getByApplicationId` diterima, atau batch `listForTalentMeetings(talentId)` - diputuskan di plan: **batch query via application ids** milik talent).

## Server Actions

- `scheduleMeeting(_prev, formData)` → `ActionResult<void>` (useActionState; field: `applicationId`, `meetingDate`, `meetingTime`, `meetingLink`, `meetingMethod`, `notes`; error ditampilkan inline).
- `completeMeeting(meetingId)` → `Promise<void>` fire-and-forget + `revalidatePath` + `redirect()` balik (konsisten keputusan 2026-08-29).
- `cancelMeeting(meetingId)` → `Promise<void>` fire-and-forget.
- Semua: `requireRole("HIRER")` dulu.

## Pages

1. `app/hirer/opportunities/[id]/applications/page.tsx` - per application:
   - `SELECTED` + belum ada meeting → form jadwal (client component `ScheduleMeetingForm`, date + time + link + method + notes).
   - Meeting `SCHEDULED` → info (tanggal, jam, metode, link) + tombol **Tandai Selesai** / **Batalkan**.
   - Meeting `COMPLETED` → badge + info (read-only).
   - `CANCELLED` → badge terminal, tanpa aksi.
2. `app/applications/page.tsx` (TALENT) - blok info meeting untuk application yang punya meeting (status + tanggal/jam + metode + link), read-only.

## Security Rules

- Zod validasi semua input; jangan percaya client.
- `requireRole("HIRER")` + ownership check `opportunity.hirer_id = auth.uid()` di service sebelum write.
- RLS defense-in-depth (policy di atas).
- Date/time future check server-side, bukan hanya `min` attr HTML.
- Tidak log data sensitif.

## Out of Scope

- Edit/reschedule meeting.
- Notifikasi ke talent saat meeting dijadwalkan/diubah status (modul notification).
- Audit log side effects.
- REST API endpoints (defer).
- Halaman detail meeting terpisah (info tampil inline).
- Consent flow (modul terpisah, setelah module ini).

## Acceptance Criteria

1. HIRER owner dapat schedule meeting hanya untuk application `SELECTED`; ditolak bila bukan owner, bukan SELECTED, sudah ada meeting, atau tanggal lewat.
2. Meeting `SCHEDULED` bisa `COMPLETED` (dengan `completed_at`) atau `CANCELLED` oleh HIRER owner; keduanya terminal.
3. Talent melihat info meeting application-nya (read-only).
4. RLS `meetings` aktif: involved parties bisa SELECT, hirer owner INSERT/UPDATE, lainnya default-deny.
5. `getByApplicationId` siap dipakai sebagai contract gate (dokumentasi eksplisit).
6. `npm run build` + typecheck + lint lulus.
