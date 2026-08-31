# Work Module Design

## Goal

Membangun modul Work: pengelolaan pekerjaan berdasarkan contract ACTIVE. Work row sudah di-seed oleh modul Contract saat contract menjadi ACTIVE (`status = NOT_STARTED`). TALENT menggerakkan status `NOT_STARTED → IN_PROGRESS → COMPLETED`, lalu HIRER mengonfirmasi penyelesaian (`hirer_confirmed = true`) sebagai verification event. Kombinasi `work.status = COMPLETED && hirer_confirmed = true` menjadi gate yang dipakai modul Payment (modul berikutnya) untuk transisi `SIMULATED_PAID → RELEASED`.

Modul `modules/work/` di atas skema DB yang sudah live (`001_initial_schema.sql`, tabel `works`, kolom lengkap + CHECK status). Tanpa perubahan skema — sprint ini hanya menambah RLS granular.

## Decisions (locked)

- **Modul mandiri `modules/work/` (Pendekatan A).** Work = capability terpisah sesuai Module Ownership di AGENTS.md (`works` → Work). Modul Contract tidak menampung work actions; kontrak hanya seed row saat ACTIVE (sudah terlaksana).
- **Payment RELEASED = tanggung jawab modul Payment (sprint berikutnya).** Modul Work TIDAK pernah menulis tabel `payments`. Modul Work hanya expose gate query `getByContractId` (row + `status` + `hirer_confirmed`); Payment module wajib blok RELEASED bila belum COMPLETED + confirmed. Keputusan di-approve user 2026-08-31.
- **Aktor transisi status = TALENT saja.** `NOT_STARTED → IN_PROGRESS` dan `IN_PROGRESS → COMPLETED` hanya oleh talent pihak kontrak (BRD 16, FR-WORK-002/003). HIRER tidak bisa mengubah status work.
- **HIRER confirmation = event terpisah + terminal.** `confirmCompletion` hanya dari `COMPLETED` + `hirer_confirmed = false`; set `hirer_confirmed = true`, `hirer_confirmed_at`, `confirmed_by`. Tidak ada un-confirm/re-confirm (verification event, BRD 17.3). Minimal tanpa input notes (keputusan approved user; kolom `notes` di schema tidak dipakai sprint ini).
- **Tidak ada skip transisi.** `NOT_STARTED → COMPLETED` langsung ditolak (BRD 16.2). Tidak ada transisi mundur.
- **Hanya contract ACTIVE.** Work hanya eksis untuk contract ACTIVE; semua transisi mengecek `contracts.status = 'ACTIVE'` (BRD 16.2 "Work hanya dapat dibuat berdasarkan contract ACTIVE" — row di-seed saat transisi ke ACTIVE, jadi contract TERMINATED sebelum work selesai memblokir semua transisi lanjutan).
- **Payment module nanti mengeksekusi RELEASED.** Modul Work expose `getByContractId` (gate data); payment release rule (`SIMULATED_PAID` + `COMPLETED` + `hirer_confirmed`, BRD 15.3) di-enforce di modul Payment. Ditulis eksplisit agar tidak hilang.
- **Rating gate nanti** — rating hanya boleh setelah Work COMPLETED (BRD 17.1); modul Work expose query gate yang sama. Ditulis eksplisit agar tidak hilang.
- **Notification & audit → defer** (task terpisah).
- **REST API → defer** (konsisten keputusan 2026-08-29: Server Actions dulu).
- DB tidak diubah — tabel `works` sudah lengkap di 001 (kolom, CHECK status, UNIQUE contract_id). Sprint ini hanya menambah RLS granular (INSERT policy seed sudah ada di `012_contract_rls.sql`).

## Architecture

Alur konsisten dengan modul sebelumnya:

UI → Server Actions → Work Service → Supabase (server client, RLS aktif)

Pola: `schemas.ts` → `queries.ts` (read) → `service.ts` (mutations) → `actions.ts`.

## Module Structure

```
modules/work/
├── schemas.ts   → workStatusSchema (enum NOT_STARTED/IN_PROGRESS/COMPLETED)
├── queries.ts   → getByContractId, listForContracts
├── service.ts   → startWork, completeWork, confirmCompletion (state machine + ownership + gate check)
└── actions.ts   → startWork, completeWork, confirmWork (void, fire-and-forget)
```

## State Machine

Status canonical: `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` (CHECK DB 001:262; BRD 16.1).

| Transisi | Syarat | Aktor | Side effect |
|---|---|---|---|
| `NOT_STARTED → IN_PROGRESS` | talent pihak kontrak + contract `ACTIVE` + work belum ada transisi; set `started_at` | TALENT | — |
| `IN_PROGRESS → COMPLETED` | talent pihak kontrak + contract `ACTIVE`; set `completed_at` | TALENT | — |
| `COMPLETED + hirer_confirmed=false → confirmed` | hirer pihak kontrak + status `COMPLETED` + belum confirmed; set `hirer_confirmed=true`, `hirer_confirmed_at`, `confirmed_by` | HIRER | — (payment RELEASED ditangani modul Payment via gate) |

- Tidak boleh `NOT_STARTED → COMPLETED` langsung (BRD 16.2).
- `hirer_confirmed` irreversible (verification event) — tidak ada action un-confirm.
- `notes` tidak diisi modul ini (UI MVP tanpa input; kolom tidak dikirim client).
- Work row hanya ada untuk contract ACTIVE (seed oleh Contract); contract TERMINATED tidak pernah punya work (service Contract hanya seed saat transisi ke ACTIVE).

## Gate Expose (untuk modul lain)

- **Payment gate (modul Payment, sprint berikutnya):** payment boleh `SIMULATED_PAID → RELEASED` iff `payment.status === 'SIMULATED_PAID'` && `work.status === 'COMPLETED'` && `work.hirer_confirmed === true` (BRD 15.3). Modul Work expose `getByContractId(contractId)` sebagai single call gate.
- **Rating gate (sprint Rating):** rating boleh diberikan iff `work.status === 'COMPLETED'` (BRD 17.1); query yang sama dipakai.
- Tidak ada coupling lain: modul Work tidak mengimpor modul Payment/Rating.

## Schemas (Zod)

```ts
import { z } from "zod";

export const workStatusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);

export type WorkStatus = z.infer<typeof workStatusSchema>;
```

Transisi status diteruskan sebagai konstanta server-side per action (`startWorkAction` menarget IN_PROGRESS dari NOT_STARTED, dst) — client tidak pernah mengirim status bebas. Kolom `hirer_confirmed`, `confirmed_by`, timestamps tidak pernah diterima dari client (Zod strip + service yang set).

## RLS — `013_work_rls.sql`

Baseline `003_rls_policies.sql`: `works` enable RLS, default-deny, tanpa policy. INSERT policy seed sudah dibuat `012_contract_rls.sql` (`works_insert_seed` — pihak kontrak saat contract ACTIVE).

Tambahan (mengikuti gaya `010`/`011`/`012`, semua `to authenticated`):

```sql
-- SELECT: talent/hirer pihak contract, admin
create policy "works_select_involved"
  on public.works for select to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
    or is_admin()
  );

-- UPDATE: talent transisi status / hirer confirm (state machine di-enforce service)
create policy "works_update_involved"
  on public.works for update to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );
```

Catatan: tidak ada policy INSERT (row di-seed modul Contract via `works_insert_seed` dari 012) dan DELETE (cascade dari contracts). Perbedaan peran (talent transisi vs hirer confirm) di-enforce service; RLS hanya membatasi SELECT/UPDATE ke involved parties.

## Service

Semua mutation: ownership check dulu → gate check → state check → write. Return `ServiceResult<T>` (`{ data, error }`, konsisten modul contract/application).

Helper: `loadWorkWithContract(supabase, contractId)` → fetch work by `contract_id` + join contract (`talent_id`, `hirer_id`, `status`); return error bila work/contract tidak ada.

- `startWork(talentId, contractId)`:
  1. Load work + contract → tolak bila tidak ada.
  2. Tolak bila `contract.talent_id !== talentId` ("Not owner").
  3. Tolak bila `contract.status !== 'ACTIVE'` ("Kontrak belum aktif").
  4. Tolak bila `work.status !== 'NOT_STARTED'` ("Work sudah dimulai").
  5. Update `status = 'IN_PROGRESS'`, `started_at = now()`.
- `completeWork(talentId, contractId)`:
  1. Load + ownership + contract ACTIVE (sama).
  2. Tolak bila `work.status !== 'IN_PROGRESS'` ("Work belum dimulai" — blok skip NOT_STARTED → COMPLETED).
  3. Update `status = 'COMPLETED'`, `completed_at = now()`.
- `confirmCompletion(hirerId, contractId)`:
  1. Load work + contract.
  2. Tolak bila `contract.hirer_id !== hirerId` ("Not owner").
  3. Tolak bila `contract.status !== 'ACTIVE'`.
  4. Tolak bila `work.status !== 'COMPLETED'` ("Pekerjaan belum ditandai selesai oleh talent").
  5. Tolak bila `work.hirer_confirmed === true` ("Sudah dikonfirmasi").
  6. Update `hirer_confirmed = true`, `hirer_confirmed_at = now()`, `confirmed_by = hirerId`. Terminal — tidak ada action lain setelahnya.

Tidak ada update tabel `payments` di modul ini (keputusan boundary di atas).

## Queries

- `type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"`.
- `type WorkRow = { id, contract_id, status, started_at, completed_at, hirer_confirmed, hirer_confirmed_at, confirmed_by, notes }`.
- `getByContractId(contractId)` → `WorkRow | null` — **single call gate modul Payment** (release iff `status === 'COMPLETED' && hirer_confirmed`) **dan gate Rating** (rating iff `status === 'COMPLETED'`); juga dipakai blok UI.
- `listForContracts(contractIds)` → `Map<contractId, WorkRow>` — batch render inline tanpa N+1 (pemanggil sudah punya contract per application).

## Server Actions

- `startWork(contractId)` → `Promise<void>` fire-and-forget; `requireRole("TALENT")`; `revalidatePath("/applications")` + `revalidatePath(/contracts/{id})` + `redirect` balik (konsisten keputusan 2026-08-29: redirect balik supaya UI refresh deterministik).
- `completeWork(contractId)` → `Promise<void>`; `requireRole("TALENT")`.
- `confirmWork(contractId)` → `Promise<void>`; `requireRole("HIRER")`.
- Nama action sama dgn service (tidak bentrok — action void tidak menerima `_prev`/FormData); service di-import dengan alias jika perlu (pola modul Contract).
- Error bisnis → silent return (pola fire-and-forget Meeting/Consent/Contract); UI tidak menampilkan error dari action void.

## Pages (UI inline)

1. `app/applications/page.tsx` (TALENT) — blok work per application (hanya bila kontrak ada & work ada):
   - `NOT_STARTED` → tombol **Mulai Kerja**.
   - `IN_PROGRESS` → tombol **Tandai Selesai**.
   - `COMPLETED` + belum confirmed → "Menunggu konfirmasi hirer".
   - `COMPLETED` + confirmed → badge selesai + terkonfirmasi (siap rating — modul nanti).
2. `app/hirer/opportunities/[id]/applications/page.tsx` (HIRER) — badge work read-only per application; saat `COMPLETED && !hirer_confirmed` → tombol **Konfirmasi Selesai**; setelah confirmed → badge terkonfirmasi.
3. `app/contracts/[id]/page.tsx` — blok status work + `hirer_confirmed` + aksi sesuai role/status (konsolidasi tempat aksi utama).

Semua inline; tidak ada halaman work terpisah.

## Security Rules

- `requireRole` + ownership check di service (talent kontrak / hirer kontrak) sebelum setiap mutation.
- RLS defense-in-depth: SELECT/UPDATE involved only; `hirer_confirmed` hanya bisa diset via service path hirer (talent boleh UPDATE row-nya sendiri di RLS — dibatasi service; RLS tidak membedakan kolom).
- Tidak ada field input bebas dari client (schema hanya enum status; notes tidak dipakai).
- Tidak log data sensitif.

## Out of Scope

- Transisi payment `SIMULATED_PAID` / `RELEASED` (modul Payment — sprint berikutnya; gate `getByContractId` sudah disiapkan).
- Rating & Review (butuh `work.status === 'COMPLETED'`; modul Rating berikutnya).
- Verified Work History (setelah rating/modul terpisah).
- Halaman work terpisah `/works`.
- Notifikasi & audit log.
- REST API endpoints (defer).
- Input notes/feedback saat confirm (kolom `notes` tidak dipakai MVP).

## Acceptance Criteria

1. Work row hanya untuk contract ACTIVE (seed oleh modul Contract, sudah berjalan).
2. TALENT pihak kontrak dapat `NOT_STARTED → IN_PROGRESS` (set `started_at`) dan `IN_PROGRESS → COMPLETED` (set `completed_at`); skip transisi ditolak; aktor selain talent kontrak ditolak.
3. HIRER pihak kontrak dapat confirm hanya saat `COMPLETED && !hirer_confirmed`; set `hirer_confirmed = true` + `hirer_confirmed_at` + `confirmed_by`; irreversible.
4. Modul Work tidak pernah menulis tabel `payments` (Payment module nanti mengeksekusi RELEASED via gate).
5. RLS `works` aktif: SELECT involved/admin, UPDATE involved, lainnya default-deny; talent asing SELECT `[]`, INSERT/UPDATE ditolak.
6. UI inline di 3 tempat (My Applications, applicant list, detail contract) status-aware tanpa N+1.
7. `npm run build` + typecheck + lint lulus.
