# Verified Work History Module Design

## Goal

Melengkapi akhir alur bisnis Flex Network: setelah kedua pihak selesai saling memberi rating, Work History talent otomatis ter-VERIFIED. Ini milestone terakhir dari Business Flow (Register → … → Rating → Verified Work History).

Modul `modules/work_history/` di atas skema DB yang sudah live (`001_initial_schema.sql:293`, tabel `work_history`: `contract_id` UNIQUE, `talent_id`, `opportunity_id`, snapshot `title`/`description`/`duration`/`compensation`, `verification_status` CHECK `PENDING/VERIFIED/REJECTED`, `verified_at`, `verified_by`, `verification_notes`). Tanpa perubahan skema — sprint ini menambah RLS granular (baseline `003_rls_policies.sql:131` menandai policy work_history TBD) dan satu side effect di modul Rating.

## Decisions (locked, dari user 2026-09-01)

- **Gate VERIFIED = work COMPLETED + kedua rating sudah ada** (`TALENT_RATES_HIRER` **dan** `HIRER_RATES_TALENT` untuk `work_id` yang sama). Bukan hirer-confirmation (menyimpang dari API-SPEC §13.3/§15.4 yang memakai "Hirer Confirms" — keputusan user: trigger VERIFIED saat rating dua arah lengkap).
- **Side effect di flow `submitRating`** (`modules/rating/service.ts`) — setelah insert rating sukses, cek kelengkapan dua arah; jika lengkap → flip VERIFIED. Client tidak pernah mengirim status.
- **Aktivator** = pihak yang memberi rating terakhir (rating yang melengkapi pasangan). `verified_by` = raterId aktivator (traceability), `verified_at = now()`.
- **Upsert work_history on demand** — belum ada pencipta row di flow mana pun (side effect Contract hanya seed `payments` + `works`). Saat trigger: insert row PENDING (kolom wajib dari contract: `contract_id`, `talent_id`, `opportunity_id`; snapshot murah: `title` = `contract.role_title`, `duration`, `compensation`) jika belum ada, lalu update ke VERIFIED. Idempotent: `23505` saat insert dianggap race-benign → re-select lalu lanjut flip; row sudah VERIFIED → no-op.
- **Aktivator HIRER atau TALENT** — mana pun yang rating-nya datang terakhir; tidak ada role restriction di trigger (keduanya pihak kontrak).
- **Klasifikasi BOUNDED** — satu aksi: update status. Tanpa UI baru, tanpa REST, tanpa admin moderation (VERIFIED → REJECTED dsb. defer).
- **Pendekatan: satu fungsi service + RLS granular.** Tanpa DB trigger/RPC (konsisten pola service-layer, keputusan 2026-08-31 tentang non-atomik dua update diterima).
- **Notification defer** (konsisten Payment/Rating 2026-08-31).

## Architecture

UI (rating form, sudah ada) → Server Action rating → Rating Service → **Work History Service** → Supabase (server client, RLS aktif).

Tidak ada Server Action, page, atau form baru — satu-satunya jalur tulis adalah side effect rating.

## Module Structure

```
modules/work_history/
└── service.ts   → upsertVerifiedOnRatingsComplete (satu fungsi, idempotent)
```

Ditambah satu call site di `modules/rating/service.ts`. `schemas.ts`/`queries.ts`/`actions.ts` belum dibuat (tidak ada aksi user-facing sprint ini; dibuat saat modul tampilan work history dibutuhkan).

## Data Flow (trigger VERIFIED)

`submitRating` (rating service, setelah insert ratings sukses):

1. Query `ratings` by `work_id` → kumpulkan `rating_type` yang sudah ada.
2. Jika `{TALENT_RATES_HIRER, HIRER_RATES_TALENT}` ⊆ hasil → trigger:
   a. Load `contract_id, talent_id, opportunity_id, role_title, duration, compensation` dari contract (rating service sudah load contract; tambah kolom `opportunity_id` + snapshot di select yang sama).
   b. `upsertVerifiedHistory(contractRow, workId, activatorId)`:
      - SELECT `work_history` by `contract_id` → tidak ada → INSERT PENDING (`23505` race → re-select).
      - `verification_status === 'VERIFIED'` → return (idempotent no-op).
      - UPDATE set `verification_status='VERIFIED'`, `verified_at=now()`, `verified_by=activatorId`.
3. Jika belum lengkap (baru satu arah) → tidak ada efek.

Rating yang sudah ada sebelumnya (dari sprint sebelumnya) tidak di-backfill — trigger hanya jalan pada rating yang melengkapi pasangan. Data lama yang terlanjur dua arah sebelum deploy tidak di-flip otomatis (tidak ada data production; YAGNI).

## Service

- `upsertVerifiedHistory(contract: {contract_id, talent_id, opportunity_id, role_title, duration, compensation}, workId, activatorId)` → `Promise<void>` (best-effort):
  - Error side effect **tidak menggagalkan rating** — rating sudah terlanjur tersimpan; return sukses rating tetap dikirim (non-atomik dua statement, precedent Contract 2026-08-29). Kegagalan terlihat di smoke test.
- Gate: fungsi hanya dipanggil dari rating service (bukan API publik modul lain).

## RLS — `016_work_history_rls.sql`

Baseline `003`: RLS enabled, default-deny, tanpa policy. Tambahan (gaya `014`/`015`, semua `to authenticated`):

```sql
-- SELECT: talent owner, hirer pihak contract, admin
create policy "work_history_select_involved"
  on public.work_history for select to authenticated
  using (
    talent_id = auth.uid()
    or exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.hirer_id = auth.uid()
    )
    or is_admin()
  );

-- INSERT: pihak kontrak (seed PENDING dari side effect rating)
create policy "work_history_insert_involved"
  on public.work_history for insert to authenticated
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );

-- UPDATE: pihak kontrak (flip VERIFIED); verified_by = aktor
create policy "work_history_update_involved"
  on public.work_history for update to authenticated
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

Catatan: service rating berjalan sebagai pihak kontrak (authenticated, bukan admin), jadi INSERT/UPDATE policy involved cukup. Admin moderation (REJECTED ↔ VERIFIED) = sprint terpisah.

## Server Actions & UI

Tidak ada. Trigger murni server-side; verifikasi lewat E2E smoke + cek DB.

## Security Rules

- Tidak ada input client baru; `verified_by`, `verified_at`, snapshot kolom semua derived server-side.
- Ownership tetap di-enforce rating service (rater harus pihak kontrak) sebelum side effect; RLS work_history defense-in-depth.
- Tidak log data sensitif.

## Out of Scope

- Halaman/list Work History (TALENT "Riwayat Pekerjaan", public profile VERIFIED-only) — milestone berikutnya.
- Admin moderation VERIFIED ↔ REJECTED.
- REST API §15 (defer, konsisten keputusan 2026-08-29).
- Notification, audit log (defer).
- Backfill data lama.

## Acceptance Criteria

1. Rate satu arah saja (mis. hanya TALENT_RATES_HIRER) → tidak ada row `work_history` VERIFIED (belum ada row, atau tetap PENDING bila row lama ada).
2. Rate arah kedua (rating kedua melengkapi pasangan) → row `work_history` ada dengan `verification_status='VERIFIED'`, `verified_at` terisi, `verified_by` = pemberi rating terakhir, snapshot kolom terisi dari contract.
3. Trigger idempotent: proses ulang / row sudah VERIFIED → tidak ada duplikat, tidak ada error (contract_id UNIQUE).
4. Rating yang gagal (duplicate 23505, gate-fail, not-owner) tidak pernah memicu flip.
5. RLS `work_history`: SELECT involved/admin; INSERT/UPDATE hanya pihak kontrak; non-involved + anon default-deny (42501 / []).
6. `npm run build` + typecheck + lint lulus; smoke E2E: alur lengkap dari kontrak ACTIVE → work COMPLETED → rate talent → cek belum VERIFIED → rate hirer → VERIFIED; repeat rating → error bisnis tanpa efek samping.
