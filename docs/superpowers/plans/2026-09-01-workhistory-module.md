# Verified Work History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setelah kedua rating dua arah (`TALENT_RATES_HIRER` + `HIRER_RATES_TALENT`) untuk satu work lengkap, `work_history` talent otomatis di-upsert dan di-flip `PENDING → VERIFIED` (`verified_at`, `verified_by` terisi). Satu aksi, tanpa UI baru.

**Architecture:** Side effect di dalam `submitRating` (`modules/rating/service.ts`) setelah insert rating sukses — satu-satunya jalur tulis ke `work_history`. Fungsi helper baru `modules/work_history/service.ts` (`upsertVerifiedHistory`) menangani upsert idempotent: pastikan row ada (insert PENDING, `23505` race-benign), lalu update ke `VERIFIED` bila belum. RLS granular baru di migration `016` (baseline `003`: RLS enabled default-deny tanpa policy). Tanpa DB trigger/RPC, tanpa UI, tanpa REST (spec Out of Scope).

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (server client + RLS), Zod (tidak ada input baru).

**Spec:** `docs/superpowers/specs/2026-09-01-workhistory-module-design.md`

## Global Constraints

- Tabel `work_history` TIDAK diubah skemanya (001:293 — `contract_id` UNIQUE, `verification_status` CHECK `('PENDING','VERIFIED','REJECTED')`, `verified_at`, `verified_by`, snapshot kolom nullable).
- **Gate VERIFIED = kedua rating dua arah ada untuk `work_id` yang sama** (keputusan user 2026-09-01) — bukan hirer-confirmation (menyimpang API-SPEC §13.3/§15.4 secara sadar; spec Decisions locked).
- Trigger hanya jalan pada rating yang **melengkapi pasangan** (setelah insert sukses); duplicate/gate-fail/not-owner tidak pernah memicu.
- Idempotent penuh: row sudah VERIFIED → no-op; race insert (`23505` pada UNIQUE `contract_id`) → re-select lalu lanjut; tanpa duplikat.
- Side effect best-effort: kegagalan flip TIDAK menggagalkan rating (rating sudah tersimpan; non-atomik dua statement diterima, precedent Contract 2026-08-29).
- Semua kolom sensitif derived server-side (`verified_by`, `verified_at`, snapshot); client tidak mengirim apa pun baru.
- Migration hanya menambah policy (baseline 003: RLS enabled, default-deny, tanpa policy).
- Tidak ada notification, REST API, halaman Work History, admin moderation (semua defer — spec Out of Scope).
- Verifikasi project: `npx tsc --noEmit`, `npm run lint`, `npm run build` (tidak ada test framework).
- Commit format: `type(scope): deskripsi imperative lowercase` (lihat `/GIT_COMMIT.md`).

---

### Task 1: Migration `016_work_history_rls.sql` + push

**Files:**
- Create: `supabase/migrations/016_work_history_rls.sql`

**Interfaces:**
- Consumes: tabel `work_history` (001:293, RLS enabled default-deny tanpa policy), tabel `contracts` (001:207), helper `is_admin()` (006).
- Produces: RLS SELECT (talent owner / hirer pihak contract / admin), INSERT involved, UPDATE involved pada `work_history`. Service rating (pihak kontrak, authenticated) butuh ketiganya untuk upsert.

- [ ] **Step 1: Tulis migration**

```sql
-- 016_work_history_rls.sql — granular policies untuk work_history
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- Gate bisnis (kedua rating lengkap) di-enforce service modul Rating;
-- RLS defense-in-depth (INSERT/UPDATE hanya pihak kontrak).

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

-- UPDATE: pihak kontrak (flip VERIFIED dari side effect rating)
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

Catatan: `DELETE` hanya cascade dari `contracts` (tanpa policy — default-deny). Admin moderation (VERIFIED → REJECTED dsb.) = sprint terpisah; admin SELECT-only di sini. Policy UPDATE involved (talent + hirer) konsisten pola `works` (`013`); tanpa jalur UI, ini defense-in-depth semata.

- [ ] **Step 2: Push ke Supabase**

Run: `supabase db push`
Expected: migration applied.

- [ ] **Step 3: Verifikasi policy**

Run: `supabase db query --linked "select policyname, cmd from pg_policies where tablename = 'work_history' order by policyname;"`
Expected: 3 rows — `work_history_insert_involved` (INSERT), `work_history_select_involved` (SELECT), `work_history_update_involved` (UPDATE).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/016_work_history_rls.sql
git commit -m "feat(db): add work history rls policies"
```

---

### Task 2: Service `modules/work_history/service.ts`

**Files:**
- Create: `modules/work_history/service.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (dari `@/lib/supabase/server`).
- Produces:
  - `type ContractSnapshot = { id: string; talent_id: string; opportunity_id: string; role_title: string | null; duration: string | null; compensation: number | null }`
  - `upsertVerifiedHistory(contract: ContractSnapshot, activatorId: string): Promise<void>` — idempotent, best-effort, tidak throw.

- [ ] **Step 1: Tulis service**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContractSnapshot = {
  id: string;
  talent_id: string;
  opportunity_id: string;
  role_title: string | null;
  duration: string | null;
  compensation: number | null;
};

export async function upsertVerifiedHistory(
  contract: ContractSnapshot,
  activatorId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("work_history")
    .select("id, verification_status")
    .eq("contract_id", contract.id)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase.from("work_history").insert({
      contract_id: contract.id,
      talent_id: contract.talent_id,
      opportunity_id: contract.opportunity_id,
      title: contract.role_title,
      duration: contract.duration,
      compensation: contract.compensation,
    });
    if (insertError && insertError.code !== "23505") {
      return;
    }
  }

  await supabase
    .from("work_history")
    .update({
      verification_status: "VERIFIED",
      verified_at: new Date().toISOString(),
      verified_by: activatorId,
    })
    .eq("contract_id", contract.id)
    .neq("verification_status", "VERIFIED");
}
```

Catatan: dua langkah sesuai keputusan user (PENDING dulu, lalu flip). Langkah 1 idempotent — row sudah ada → skip; `23505` = race benign → lanjut. Langkah 2 idempotent — `neq("verification_status", "VERIFIED")` mencegah update ulang; bila row belum VERIFIED → flip + `verified_at` + `verified_by` = aktivator (rater yang melengkapi pasangan). Best-effort `void`: error tidak dilempar (rating sudah tersimpan, precedent non-atomik 2026-08-31); `verification_notes` tidak disentuh (admin moderation sprint terpisah).

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/work_history/service.ts
git commit -m "feat(work-history): add verified history upsert service"
```

---

### Task 3: Integrasikan side effect di `modules/rating/service.ts`

**Files:**
- Modify: `modules/rating/service.ts`

**Interfaces:**
- Consumes: `upsertVerifiedHistory` + `ContractSnapshot` dari `@/modules/work_history/service` (Task 2).
- Produces: `submitRating` (signature tetap `submitRating(raterId, input): Promise<ServiceResult<{ ratingId: string }>>`) kini memicu Verified Work History saat insert rating melengkapi pasangan dua arah.

- [ ] **Step 1: Tambah import**

Di atas file (setelah import `@/modules/work/queries`):

```ts
import { upsertVerifiedHistory } from "@/modules/work_history/service";
```

- [ ] **Step 2: Perluas select contract**

Ubah select contract (baris ~188) dari:

```ts
.select("id, talent_id, hirer_id, status")
```

menjadi:

```ts
.select(
  "id, talent_id, hirer_id, opportunity_id, role_title, duration, compensation, status",
)
```

Ubah tipe cast `row` (baris ~47) menjadi:

```ts
const row = contract as unknown as {
  id: string;
  talent_id: string;
  hirer_id: string;
  opportunity_id: string;
  role_title: string | null;
  duration: string | null;
  compensation: number | null;
  status: string;
};
```

Catatan: semua kolom baru sudah ada di `contracts` (001:207 — `opportunity_id`, `role_title`, `duration`, `compensation`); snapshot tanpa fetch tambahan.

- [ ] **Step 3: Tambah trigger setelah insert sukses**

Ganti return sukses di akhir `submitRating` (baris ~94–97) dengan:

```ts
  const ratingId = (inserted as unknown as { id: string }).id;

  // Trigger Verified Work History: kedua arah rating untuk work ini lengkap.
  const { data: existingTypes } = await supabase
    .from("ratings")
    .select("rating_type")
    .eq("work_id", work.id);

  const types = new Set(
    (existingTypes as unknown as { rating_type: string }[] | null)?.map(
      (r) => r.rating_type,
    ) ?? [],
  );
  if (
    types.has("TALENT_RATES_HIRER") &&
    types.has("HIRER_RATES_TALENT")
  ) {
    await upsertVerifiedHistory(
      {
        id: row.id,
        talent_id: row.talent_id,
        opportunity_id: row.opportunity_id,
        role_title: row.role_title,
        duration: row.duration,
        compensation: row.compensation,
      },
      raterId,
    );
  }

  return { data: { ratingId: ratingRow.id }, error: null };
```

(final block sebelumnya `const ratingRow = inserted as unknown as { id: string } | null;` ditarik ke atas sehingga `ratingId` aman non-null — sesuaikan deklarasi `ratingRow` sebelum blok side effect).

Catatan urutan: trigger HANYA setelah insert rating sukses — path `23505` (duplicate) dan semua error path return sebelum titik ini, jadi rating gagal tidak pernah memicu flip (spec AC 4). Cek kelengkapan = query `ratings` by `work_id` (bukan `contract_id`) — konsisten UNIQUE rating per work. Hasil Set berisi ≥2 tipe berarti pasangan lengkap (max 2 row per work). Side effect best-effort: `upsertVerifiedHistory` void, tidak melempar; error rating tetap `null` (rating tersimpan sah). Contract `id` ikut dikirim sebagai `ContractSnapshot.id`.

- [ ] **Step 4: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/rating/service.ts
git commit -m "feat(rating): trigger verified work history on two-way rating"
```

---

### Task 4: Build & typecheck verification + E2E smoke + RLS REST

**Files:**
- None (verification only)

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: semua PASS tanpa error.

- [ ] **Step 2: E2E smoke (2 akun browser)**

Reuse kontrak smoke Rating: `b8ce8bdc-3fd1-40bd-832d-465c8daac86b` (CNTR-260831-DVA4, work COMPLETED + hirer_confirmed, payment RELEASED). Akun: `smoke-talent-consent@example.test` (TALENT) + `smoke-hirer-consent@example.test` (HIRER), password `Smoke123!`. Dev server: `npm run dev`.

Pre-reset via SQL (rating sprint lama sudah dua arah — bersihkan supaya trigger bisa diamati):

```sql
delete from ratings where contract_id = 'b8ce8bdc-3fd1-40bd-832d-465c8daac86b';
delete from work_history where contract_id = 'b8ce8bdc-3fd1-40bd-832d-465c8daac86b';
```

1. TALENT rate hirer (score 5) di detail contract → badge `5/5`. DB: `select * from work_history where contract_id = 'b8ce8bdc-...';` → **0 rows** (satu arah belum lengkap — AC 1).
2. HIRER rate talent (score 4) → badge `4/5`. DB: row `work_history` muncul — `verification_status = 'VERIFIED'`, `verified_at` terisi, `verified_by` = **hirer id** (aktivator = rating terakhir), snapshot `title` = `contract.role_title`, `duration`, `compensation` terisi, `talent_id` + `opportunity_id` benar (AC 2).
3. Idempotency: `delete from ratings where ...` lalu rate ulang dua arah dengan akun yang sama → tetap **1 row** VERIFIED (tidak duplikat, tanpa error — AC 3, UNIQUE `contract_id`).
4. Not-owner/gate-fail tidak memicu: panggil action dengan akun pihak ketiga / sebelum reset work status → rating error, tanpa row baru.
5. Admin/admin client tidak punya jalur tulis work_history (tanpa action baru) — verifikasi hanya ada satu call site (`modules/rating/service.ts`).

- [ ] **Step 3: RLS via REST**

1. TALENT pihak kontrak: GET `/rest/v1/work_history?contract_id=eq.b8ce8bdc-...` → 1 row (talent owner).
2. HIRER pihak kontrak: GET sama → 1 row (via policy contract).
3. TALENT asing (punya akun smoke lain): GET → `[]`.
4. Anon: GET → `[]`.
5. Non-involved PATCH `/rest/v1/work_history?id=eq.<row>` `{verification_status:"REJECTED"}` → **0 rows** (UPDATE policy using menolak).
6. INSERT spoof (contract milik orang lain) → 42501 (`work_history_insert_involved`).

- [ ] **Step 4: Commit (jika ada perbaikan)**

```bash
git add -A
git commit -m "fix(work-history): address smoke test findings"
```

---

### Task 5: Update `docs/PROGRESS.md`

- [ ] **Step 1: Update progress**

- Tambah seksi "Module Verified Work History" ke "Sudah Selesai" (Task 1–4).
- Decision Log tambah:
  - `2026-09-01: Gate Verified Work History = kedua rating dua arah lengkap (TALENT_RATES_HIRER + HIRER_RATES_TALENT) — bukan hirer confirmation (menyimpang API-SPEC 13.3/15.4; keputusan user)`
  - `2026-09-01: work_history di-upsert on-demand oleh side effect modul Rating (satu-satunya jalur tulis); PENDING dulu lalu flip VERIFIED + verified_at/verified_by = rater pelengkap pasangan; idempotent (23505 race-benign, neq VERIFIED)`
  - `2026-09-01: Side effect best-effort non-atomik — kegagalan flip tidak menggagalkan rating (precedent non-atomik Contract 2026-08-29)`
  - `2026-09-01: RLS work_history = SELECT involved/admin, INSERT/UPDATE pihak kontrak; admin moderation & halaman Work History defer`
- Status terakhir: Sprint 11 — Verified Work History selesai; next milestone dari roadmap (lihat BRD — kandidat: Notification / Report / Admin audit atau halaman Work History publik).

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update progress work history module"
```

---

## Self-Review Notes

- **Spec coverage:** RLS 3 policy (Task 1), upsert idempotent PENDING→flip (Task 2, sesuai keputusan "PENDING dulu, lalu flip"), trigger di submitRating setelah insert sukses + derive server-side (Task 3), tanpa UI/action/REST sesuai spec (tidak ada task), verifikasi build+smoke+RLS (Task 4), progress (Task 5). AC 1 → smoke step 1; AC 2 → smoke step 2; AC 3 → Task 2 idempotent + smoke step 3; AC 4 → Task 3 (trigger hanya setelah insert sukses) + smoke step 4; AC 5 → Task 1 + smoke RLS; AC 6 → Task 4 Step 1.
- **Placeholder scan:** tidak ada TBD/TODO; SQL, TS, langkah smoke lengkap dengan nilai konkret; tidak ada "similar to Task N".
- **Type consistency:** `ContractSnapshot` = `{ id, talent_id, opportunity_id, role_title, duration, compensation }` dipakai konsisten di Task 2 (produces) dan Task 3 (consumer membangun objek dari row contract yang di-select diperluas di Step 2 Task 3). `upsertVerifiedHistory(contract, activatorId)` dipanggil dengan `raterId` sebagai aktivator. Tidak ada siklus import (work_history/service hanya import supabase client). Tidak ada modul lain yang berubah.
