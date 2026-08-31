# Rating Module Design

## Goal

Membangun modul Rating: two-way rating (TALENT rate HIRER, HIRER rate TALENT) yang tersedia setelah Work COMPLETED. Rating menutup alur bisnis setelah Payment RELEASED: kedua pihak saling memberi skor 1–5 + review opsional; rating tidak bisa diubah/hapus (immutable, terminal). Rating menjadi bahan Verified Work History (milestone berikutnya).

Modul `modules/rating/` di atas skema DB yang sudah live (`001_initial_schema.sql:276`, tabel `ratings`, kolom lengkap + CHECK `rating_type`/`score` + `UNIQUE(work_id, rater_id, rating_type)`). Tanpa perubahan skema — sprint ini hanya menambah RLS granular (baseline `003_rls_policies.sql:130` menandai policy rating TBD).

## Decisions (locked)

- **Gate rating = `work.status === 'COMPLETED'` saja** (API-SPEC §14.2; keputusan user 2026-08-31). **Tanpa gate payment RELEASED / contract COMPLETED** — rating boleh terjadi saat contract masih ACTIVE, sebelum/terslah dana dirilis. Gate dibaca via `getByContractId` modul Work.
- **`ratingType` + `rateeId` derived server-side dari posisi rater di contract** — tidak pernah diterima dari client (kebalikan API-SPEC §14.2 yang mengeksposnya di request body; Server Action bind hanya `contractId`, `score`, `reviewText`). Rater = session user; ratee = pihak lain otomatis.
- **Aktor = kedua pihak kontrak** (TALENT dan HIRER masing-masing satu rating; API-SPEC §14.2 "Rater harus Talent atau Hirer yang terlibat"). Admin tidak bisa menilai (read-only).
- **Rating immutable** — tidak ada transisi, tidak ada update/delete; satu INSERT per (rater, work). `UNIQUE(work_id, rater_id, rating_type)` DB protection; service menerjemahkan `23505` menjadi error bisnis "sudah memberi rating" (berbeda dari precedent seeding Contract yang menganggap 23505 sukses — di sini duplicate adalah user error yang harus terlihat).
- **Pendekatan: modul standar pola Meeting/Consent/Work/Payment.** Tanpa DB trigger/RPC, tanpa agregasi rekomputasi (YAGNI — rating summary dihitung on-read saat dibutuhkan, modul lain).
- **Notification defer** — konsisten keputusan Payment 2026-08-31.
- **REST API → defer** (konsisten keputusan 2026-08-29: Server Actions dulu; API-SPEC §14 jadi referensi nanti).
- **Review text opsional, tanpa moderasi** — MVP; report via modul Report bila perlu (out of scope).

## Architecture

Alur konsisten modul sebelumnya:

UI → Server Actions → Rating Service → Supabase (server client, RLS aktif)

Pola: `schemas.ts` → `queries.ts` (read) → `service.ts` (mutation) → `actions.ts`.

## Module Structure

```
modules/rating/
├── schemas.ts   → ratingSchema (score 1–5, reviewText opsional)
├── queries.ts   → listByContractId, listForContracts
├── service.ts   → submitRating (gate + ownership + duplicate handling)
└── actions.ts   → submitRating (void, fire-and-forget)
```

## Data Flow (satu aksi: submitRating)

1. UI form mengirim `contractId` + `score` + `reviewText` ke Server Action.
2. Action `requireRole` (TALENT/HIRER — keduanya boleh) lalu panggil service.
3. Service load contract (`talent_id`, `hirer_id`, `status`) by `contract_id`.
4. Ownership check: rater harus `talent_id` atau `hirer_id` kontrak.
5. Gate: load work via `modules/work/queries.getByContractId` → tolak bila `work.status !== 'COMPLETED'`.
6. Derive `rating_type` + `ratee_id` dari posisi rater (talent → `TALENT_RATES_HIRER`, ratee = hirer; sebaliknya `HIRER_RATES_TALENT`, ratee = talent). `work_id` dari row work.
7. Insert `ratings` (`work_id`, `contract_id`, `rater_id`, `ratee_id`, `rating_type`, `score`, `review_text`). `23505` → error "sudah memberi rating".

Tidak ada UPDATE/DELETE rating di level manapun (immutable).

## Schemas (Zod)

```ts
import { z } from "zod";

export const ratingTypeSchema = z.enum([
  "TALENT_RATES_HIRER",
  "HIRER_RATES_TALENT",
]);

export const ratingSchema = z.object({
  contractId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  reviewText: z.string().trim().max(2000).optional(),
});

export type RatingInput = z.infer<typeof ratingSchema>;
```

`ratingType`, `rateeId`, `raterId`, `workId` tidak pernah diterima dari client — service yang derive (keputusan locked).

## RLS — `015_rating_rls.sql`

Baseline `003`: `ratings` enable RLS, default-deny, tanpa policy. Tambahan (gaya `014`, semua `to authenticated`):

```sql
-- SELECT: talent/hirer pihak contract, admin
create policy "ratings_select_involved"
  on public.ratings for select to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
    or is_admin()
  );

-- INSERT: rater harus pihak kontrak & rater_id = dirinya; rating_type konsisten dengan posisi
create policy "ratings_insert_involved"
  on public.ratings for insert to authenticated
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (
          (c.talent_id = auth.uid() and rating_type = 'TALENT_RATES_HIRER')
          or (c.hirer_id = auth.uid() and rating_type = 'HIRER_RATES_TALENT')
        )
    )
  );
```

Tidak ada UPDATE/DELETE policy (immutable; cascade dari contracts). Admin hanya SELECT.

## Service

- `submitRating(raterId, contractId, input: { score, reviewText? })` → `ServiceResult<{ ratingId }>`:
  1. Validate via `ratingSchema` (panggilan dari action; defense di service juga).
  2. Load contract by `contract_id` (`talent_id`, `hirer_id`, `status`) → tolak bila tidak ada.
  3. Ownership: rater harus talent/hirer kontrak → selain itu "Not owner".
  4. Gate: `getByContractId` (modul Work) → `work.status !== 'COMPLETED'` → "Rating tersedia setelah pekerjaan selesai".
  5. Derive `ratingType` + `rateeId` dari posisi rater; `work_id` dari row work.
  6. Insert `ratings`; `23505` → "Kamu sudah memberi rating untuk pekerjaan ini".

Return `ServiceResult<T>` konsisten modul contract/work/payment.

## Queries

- `type RatingType = "TALENT_RATES_HIRER" | "HIRER_RATES_TALENT"`.
- `type RatingRow = { id, work_id, contract_id, rater_id, ratee_id, rating_type, score, review_text, created_at }`.
- `listByContractId(contractId)` → `RatingRow[]` (0–2 row) — dipakai blok UI detail contract.
- `listForContracts(contractIds)` → `Map<contractId, RatingRow[]>` — batch render My Applications tanpa N+1.

## Server Actions

- `submitRating(contractId, redirectTo, formData)` → `Promise<void>`; parse `score` + `reviewText` dari FormData; `requireRole` TALENT **atau** HIRER (bukan satu role — dua arah); service lalu `revalidatePath("/applications")` + `revalidatePath(/contracts/{id})` + `redirect(redirectTo)`.
- Error bisnis → silent return (pola fire-and-forget); validasi form pakai state jika perlu feedback score/review (pola form berbasis state Contract).

## Pages (UI inline)

1. `app/contracts/[id]/page.tsx` — blok rating setelah blok payment (kedua role):
   - Belum rate + work COMPLETED → form bintang 1–5 + review opsional (ratee = pihak lain).
   - Sudah rate → badge read-only (score + review + tanggal).
   - Work belum COMPLETED → hint "Rating tersedia setelah pekerjaan selesai".
2. `app/applications/page.tsx` (TALENT) — blok/badge rating per application (listForContracts batch); form rate hirer bila eligible.

Semua inline; tidak ada halaman rating terpisah.

## Security Rules

- Server Action derive semua kolom sensitif server-side (`rater_id`, `ratee_id`, `rating_type`, `work_id`); client hanya kirim `contractId` + `score` + `reviewText`.
- Ownership check service sebelum insert; RLS `ratings_insert_involved` defense-in-depth (menolak rater spoofing + rating_type mismatch di level DB).
- Score dibatasi 1–5 (Zod + CHECK DB).
- Tidak log review_text sensitif; tidak ada field identitas.

## Out of Scope

- Rating summary/agregasi (rata-rata profil) — read later saat dibutuhkan.
- Moderasi/edit/hapus rating (immutable).
- Rating antar-peer selain talent↔hirer; rating admin.
- Notification (defer), REST API (defer).
- Work History (milestone berikutnya; gate rating selesai = rating flow live).

## Acceptance Criteria

1. TALENT pihak kontrak dapat submit `TALENT_RATES_HIRER` hanya saat `work.status = COMPLETED`; HIRER dapat `HIRER_RATES_TALENT` dengan gate sama.
2. Non-involved ditolak ("Not owner"); work belum COMPLETED ditolak; duplicate (sudah rate) ditolak dengan pesan jelas.
3. `ratingType`, `rateeId`, `raterId`, `work_id` selalu derived server-side; tidak ada dari client.
4. Rating immutable: tanpa UPDATE/DELETE di UI, service, maupun RLS.
5. RLS `ratings`: SELECT involved/admin, INSERT hanya rater = pihak kontrak dengan rating_type konsisten + `rater_id = auth.uid()`; lainnya default-deny (42501 / 0 rows).
6. UI inline 2 tempat (detail contract, My Applications) status-aware, tanpa N+1.
7. `npm run build` + typecheck + lint lulus; smoke E2E: rate talent→hirer sukses; duplicate ditolak; rate sebelum work COMPLETED ditolak; RLS REST (anon [] / non-involved ditolak).
