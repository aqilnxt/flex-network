# Payment Module Design

## Goal

Membangun modul Payment: simulated escrow berdasarkan contract ACTIVE. Payment row sudah di-seed oleh modul Contract saat contract menjadi ACTIVE (`status = PENDING`, `amount = compensation`). HIRER mensimulasikan pembayaran (`PENDING → SIMULATED_PAID` — dana dianggap ditahan escrow), lalu setelah pekerjaan selesai dan dikonfirmasi, HIRER melepas dana (`SIMULATED_PAID → RELEASED`). Saat RELEASED, contract ikut menjadi `COMPLETED` (side effect modul Payment) — menutup siklus bisnis Contract → Payment → Work → Rating.

Modul `modules/payment/` di atas skema DB yang sudah live (`001_initial_schema.sql`, tabel `payments`, kolom lengkap + CHECK status). Tanpa perubahan skema — sprint ini hanya menambah RLS granular.

## Decisions (locked)

- **Modul mandiri `modules/payment/` (Pendekatan A).** Payment = capability terpisah sesuai Module Ownership di AGENTS.md (`payments` → Payment). Modul Contract tidak menampung payment actions; kontrak hanya seed row saat ACTIVE (sudah terlaksana).
- **Pendekatan A: modul standar, side effect di service.** Pola sama dengan Meeting/Consent/Contract/Work. Dua update berurutan saat release (payments lalu contracts) bukan atomic — window inkonsisten tipis dianggap acceptable untuk simulated MVP; tidak ada DB trigger / RPC atomik (ditolak: keluar pola codebase, logic tersembunyi, susah test).
- **Aktor `SIMULATED_PAID` = HIRER** via tombol **Bayar (Simulasi)** (API-SPEC 12.3). Tidak ada otomatisasi sistem; PENDING tetap perlu aksi manual hirer. Admin tidak bisa menransisi (read-only).
- **Aktor RELEASED = HIRER**, gate (BRD 15.3 / API-SPEC 12.4): `payment.status = 'SIMULATED_PAID'` && `work.status = 'COMPLETED'` && `work.hirer_confirmed = true`. Gate work dibaca via `getByContractId` modul Work (single call gate yang sudah disiapkan).
- **Contract COMPLETED = side effect modul Payment saat RELEASED** (keputusan user 2026-08-31). Service update `contracts.status = 'COMPLETED'` + `completed_at` setelah payments RELEASED. Tidak ada modul lain yang menulis status contract COMPLETED.
- **Notification defer** — API-SPEC menyebut "notification dibuat" pada simulate-paid/release; ditunda ke modul Notification terpisah. Audit trail tetap ada via `held_at`/`held_by`/`released_at`/`released_by`.
- **REST API → defer** (konsisten keputusan 2026-08-29: Server Actions dulu).
- **Tidak ada refund/withdrawal/gateway** — MVP simulated (BRD 15.4). RELEASED terminal; tidak ada transisi mundur.
- DB tidak diubah — tabel `payments` sudah lengkap di 001 (kolom, CHECK status, UNIQUE contract_id). Sprint ini hanya menambah RLS granular (INSERT policy seed sudah ada di `012_contract_rls.sql`).

## Architecture

Alur konsisten dengan modul sebelumnya:

UI → Server Actions → Payment Service → Supabase (server client, RLS aktif)

Pola: `schemas.ts` → `queries.ts` (read) → `service.ts` (mutations) → `actions.ts`.

## Module Structure

```
modules/payment/
├── schemas.ts   → paymentStatusSchema (enum PENDING/SIMULATED_PAID/RELEASED)
├── queries.ts   → getByContractId, listForContracts
├── service.ts   → simulatePayment, releasePayment (state machine + ownership + gate check)
└── actions.ts   → simulatePayment, releasePayment (void, fire-and-forget)
```

## State Machine

Status canonical: `PENDING` → `SIMULATED_PAID` → `RELEASED` (CHECK DB 001:246; BRD 15.1).

| Transisi | Syarat | Aktor | Side effect |
|---|---|---|---|
| `PENDING → SIMULATED_PAID` | hirer pihak kontrak + contract `ACTIVE` + payment `PENDING`; set `held_at`, `held_by` | HIRER | — (notification defer) |
| `SIMULATED_PAID → RELEASED` | hirer pihak kontrak + payment `SIMULATED_PAID` + work `COMPLETED` + `hirer_confirmed = true`; set `released_at`, `released_by` | HIRER | contract → `COMPLETED` + `completed_at` |

- RELEASED hanya jika ketiga syarat terpenuhi (BRD 15.3); tidak ada skip `PENDING → RELEASED` langsung.
- Tidak ada transisi mundur; `SIMULATED_PAID` dan `RELEASED` terminal.
- Payment row hanya ada untuk contract yang pernah ACTIVE (seed oleh Contract); transisi selalu cek `contracts.status = 'ACTIVE'`.

## Contract COMPLETED Side Effect

- `releasePayment` setelah update `payments` sukses → update `contracts.status = 'COMPLETED'` + `completed_at = now()`.
- Diizinkan RLS `contracts_update_involved` (012): hirer involved boleh update contract.
- Sequential, non-atomic: bila update contract gagal setelah payment RELEASED → error dikembalikan, payment sudah RELEASED; contract tetap ACTIVE (window inkonsisten tipis, diterima simulated MVP; perbaikan manual via admin). Tidak ada retry otomatis (YAGNI).
- Setelah contract COMPLETED: tidak ada transisi payment/work lagi (semua mutation cek contract ACTIVE).

## Schemas (Zod)

```ts
import { z } from "zod";

export const paymentStatusSchema = z.enum(["PENDING", "SIMULATED_PAID", "RELEASED"]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
```

Transisi tidak diterima dari client — konstanta server-side per action. Kolom `held_at`, `held_by`, `released_at`, `released_by` tidak pernah diterima dari client (service yang set).

## RLS — `014_payment_rls.sql`

Baseline `003_rls_policies.sql`: `payments` enable RLS, default-deny, tanpa policy. INSERT policy seed sudah dibuat `012_contract_rls.sql` (`payments_insert_seed` — pihak kontrak saat contract ACTIVE).

Tambahan (mengikuti gaya `010`/`011`/`012`, semua `to authenticated`):

```sql
-- SELECT: talent/hirer pihak contract, admin
create policy "payments_select_involved"
  on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
    or is_admin()
  );

-- UPDATE: hanya hirer pihak contract (kedua transisi SIMULATED_PAID & RELEASED aktor HIRER;
-- state machine di-enforce service)
create policy "payments_update_hirer"
  on public.payments for update to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.hirer_id = auth.uid()
    )
  );
```

Catatan: UPDATE lebih ketat dari Work (hirer-only, bukan involved) karena kedua transisi payment hanya oleh HIRER (API-SPEC 12.3/12.4); talent read-only. Tidak ada policy DELETE (cascade dari contracts). Admin hanya SELECT.

## Service

Semua mutation: ownership check dulu → gate check → state check → write. Return `ServiceResult<T>` (`{ data, error }`, konsisten modul contract/work).

Helper: `loadPaymentWithContract(supabase, contractId)` → fetch payment by `contract_id` + join contract (`talent_id`, `hirer_id`, `status`); return error bila payment/contract tidak ada.

- `simulatePayment(hirerId, contractId)`:
  1. Load payment + contract → tolak bila tidak ada.
  2. Tolak bila `contract.hirer_id !== hirerId` ("Not owner").
  3. Tolak bila `contract.status !== 'ACTIVE'` ("Kontrak belum aktif").
  4. Tolak bila `payment.status !== 'PENDING'` ("Payment sudah disimulasikan").
  5. Update `status = 'SIMULATED_PAID'`, `held_at = now()`, `held_by = hirerId`.
- `releasePayment(hirerId, contractId)`:
  1. Load payment + contract.
  2. Tolak bila `contract.hirer_id !== hirerId` ("Not owner").
  3. Tolak bila `contract.status !== 'ACTIVE'`.
  4. Tolak bila `payment.status !== 'SIMULATED_PAID'` ("Payment belum disimulasikan" — blok skip PENDING → RELEASED).
  5. Load work via `getByContractId` (modul Work) → tolak bila `work.status !== 'COMPLETED'` ("Pekerjaan belum selesai") atau `!work.hirer_confirmed` ("Pekerjaan belum dikonfirmasi hirer").
  6. Update `payments`: `status = 'RELEASED'`, `released_at = now()`, `released_by = hirerId`.
  7. Update `contracts.status = 'COMPLETED'`, `completed_at = now()` (side effect; keputusan 2026-08-31).

Cross-module import: service Payment memanggil `getByContractId` dari `modules/work/queries` (pola precedent: Contract service memanggil Consent `getConsentDecision`). Modul Payment tidak pernah menulis tabel `works`.

## Queries

- `type PaymentStatus = "PENDING" | "SIMULATED_PAID" | "RELEASED"`.
- `type PaymentRow = { id, contract_id, amount, currency, status, held_at, released_at, held_by, released_by }`.
- `getByContractId(contractId)` → `PaymentRow | null` — dipakai blok UI detail contract.
- `listForContracts(contractIds)` → `Map<contractId, PaymentRow>` — batch render inline tanpa N+1.

## Server Actions

- `simulatePayment(contractId, redirectTo)` → `Promise<void>` fire-and-forget; `requireRole("HIRER")`; `revalidatePath("/applications")` + `revalidatePath(/contracts/{id})` + `redirect` balik (konsisten keputusan 2026-08-29).
- `releasePayment(contractId, redirectTo)` → `Promise<void>`; `requireRole("HIRER")`.
- Error bisnis → silent return (pola fire-and-forget); UI tidak menampilkan error dari action void.

## Pages (UI inline)

1. `app/contracts/[id]/page.tsx` — blok payment setelah blok work (kedua role):
   - Badge status + amount (`Rp {amount}`) + waktu held/released.
   - HIRER + contract ACTIVE + `PENDING` → tombol **Bayar (Simulasi)**.
   - HIRER + `SIMULATED_PAID` + gate terpenuhi (work COMPLETED + confirmed) → tombol **Rilis Dana (Simulasi)**.
   - HIRER + `SIMULATED_PAID` + gate belum terpenuhi → hint "Menunggu pekerjaan selesai & dikonfirmasi".
   - TALENT read-only (badge saja).
2. `app/applications/page.tsx` (TALENT) — badge payment read-only per application block (listForContracts batch).

Semua inline; tidak ada halaman payment terpisah. HIRER aksi utama di detail contract (task scope: "inline di detail contract / my applications").

## Security Rules

- `requireRole("HIRER")` + ownership check di service (`contract.hirer_id === hirerId`) sebelum setiap mutation.
- RLS defense-in-depth: SELECT involved/admin, UPDATE hirer-only; talent tidak bisa UPDATE payment row sama sekali di level RLS.
- Tidak ada field input bebas dari client (tanpa FormData; hanya contractId dari bind + redirectTo).
- Tidak ada field state dari client; `held_by`/`released_by` selalu dari session user server-side.
- Tidak log data sensitif.

## Out of Scope

- Notification (defer — modul Notification terpisah).
- REST API endpoints (defer; spec API-SPEC 12 menjadi referensi nanti).
- Real payment gateway, real escrow, refund, withdrawal (BRD 15.4).
- Halaman payment terpisah `/payments`.
- Rating gate (modul Rating berikutnya; gate `work.status === 'COMPLETED'` sudah expose modul Work).
- Admin transisi payment (admin read-only).

## Acceptance Criteria

1. HIRER pihak kontrak dapat `PENDING → SIMULATED_PAID` (set `held_at`, `held_by`) hanya saat contract ACTIVE; aktor lain ditolak.
2. HIRER pihak kontrak dapat `SIMULATED_PAID → RELEASED` hanya saat `work.status = COMPLETED && hirer_confirmed = true`; skip `PENDING → RELEASED` ditolak; gate belum terpenuhi ditolak.
3. RELEASED men-trigger side effect `contracts.status = 'COMPLETED'` + `completed_at` (satu-satunya jalur kontrak jadi COMPLETED).
4. Timestamps/aktor (`held_at`, `held_by`, `released_at`, `released_by`) di-set server, tidak pernah dari client.
5. RLS `payments` aktif: SELECT involved/admin, UPDATE hirer-only, lainnya default-deny; talent UPDATE ditolak (42501), talent asing SELECT `[]`.
6. UI inline di 2 tempat (detail contract, My Applications) status-aware tanpa N+1.
7. `npm run build` + typecheck + lint lulus; smoke E2E: simulate-paid → release (gagal sebelum gate, sukses setelah) + contract COMPLETED.
