# Rating Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kedua pihak kontrak (TALENT & HIRER) saling memberi rating 1-5 + review opsional untuk satu work, hanya setelah gate `work.status === "COMPLETED"`; rating immutable (satu INSERT per `(work_id, rater_id, rating_type)`, tanpa UPDATE/DELETE).

**Architecture:** Modular monolith pattern sama dengan modul Meeting/Consent/Contract/Work/Payment: `modules/rating/` (schemas → queries → service → actions) di atas tabel `ratings` yang sudah live (001:276, kolom + CHECK + `UNIQUE(work_id, rater_id, rating_type)`; tanpa perubahan skema). Gate work dibaca via `getByContractId` dari `modules/work/queries` (precedent: Payment service memanggil Work queries) - tanpa siklus import. `ratingType`, `rateeId`, `raterId`, `workId` selalu derived server-side dari posisi rater di contract; RLS granular baru di migration `015` (SELECT involved/admin, INSERT involved dengan konsistensi rating_type, tanpa UPDATE/DELETE).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (server client + RLS), Zod, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-08-31-rating-module-design.md`

## Global Constraints

- Tabel `ratings` TIDAK diubah skemanya (001:276 - kolom, `check (score between 1 and 5)`, `check (rating_type in ('TALENT_RATES_HIRER','HIRER_RATES_TALENT'))`, `unique (work_id, rater_id, rating_type)`).
- **Gate rating = `work.status === "COMPLETED"` saja** (API-SPEC §14.2; keputusan user 2026-08-31). **Tanpa** gate payment RELEASED / contract COMPLETED - rating boleh terjadi saat contract masih ACTIVE.
- Rating immutable: tidak ada UPDATE/DELETE di service, action, UI, maupun RLS. Duplicate (`23505` pada `UNIQUE(work_id, rater_id, rating_type)`) = error bisnis "sudah memberi rating" (BLOGI berbeda dari precedent seed Contract yang memperlakukan 23505 sukses - di sini duplicate adalah user error).
- `raterId`, `rateeId`, `ratingType`, `work_id` di-derive service dari session user + posisi di contract - tidak pernah dari client.
- Rater = pihak kontrak (talent ATAU hirer); `ratee_id` = pihak lain; `rater_id = auth.uid()` di RLS INSERT + `rating_type` konsisten posisi.
- Aktor: TALENT dan HIRER sama-sama boleh (dua arah); admin read-only (SELECT saja).
- Tidak ada notification, tidak ada REST API (defer - spec Out of Scope).
- Migration hanya menambah policy (baseline 003: RLS enabled, default-deny, tanpa policy).
- Verifikasi project: `npx tsc --noEmit`, `npm run lint`, `npm run build` (tidak ada test framework).
- Commit format: `type(scope): deskripsi imperative lowercase` (lihat `/GIT_COMMIT.md`).

---

### Task 1: Migration `015_rating_rls.sql` + push

**Files:**
- Create: `supabase/migrations/015_rating_rls.sql`

**Interfaces:**
- Consumes: tabel `ratings` (001:276, RLS enabled default-deny tanpa policy), tabel `contracts` (001), helper `is_admin()` (006).
- Produces: RLS SELECT involved/admin + INSERT involved (rater = auth.uid() + rating_type konsisten) pada `ratings`; tanpa UPDATE/DELETE (immutable).

- [ ] **Step 1: Tulis migration**

```sql
-- 015_rating_rls.sql - granular policies untuk ratings
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- Rating immutable: tidak ada policy UPDATE/DELETE (cascade dari contracts).
-- Gate bisnis (work COMPLETED) di-enforce service; RLS defense-in-depth.

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

-- INSERT: rater = dirinya, pihak kontrak, rating_type konsisten posisi
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

Catatan: tanpa policy UPDATE/DELETE - rating immutable (spec Decisions); DELETE hanya cascade dari contracts. INSERT menolak rater spoofing (`rater_id = auth.uid()`) dan mismatch `rating_type` di level DB - gate `work COMPLETED` tetap di service (RLS tidak bisa cek tabel works tanpa subquery berat; defense-in-depth, bukan pengganti service).

- [ ] **Step 2: Push ke Supabase**

Run: `supabase db push`
Expected: migration applied.

- [ ] **Step 3: Verifikasi policy**

Run: `supabase db query --linked "select policyname, cmd from pg_policies where tablename = 'ratings' order by policyname;"`
Expected: 2 rows - `ratings_insert_involved` (INSERT), `ratings_select_involved` (SELECT).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/015_rating_rls.sql
git commit -m "feat(db): add ratings rls policies"
```

---

### Task 2: Schemas `modules/rating/schemas.ts`

**Files:**
- Create: `modules/rating/schemas.ts`

**Interfaces:**
- Produces: `ratingTypeSchema`, `ratingSchema`, `RatingType`, `RatingInput` (semua via `z.infer`).

- [ ] **Step 1: Tulis schema**

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

export type RatingType = z.infer<typeof ratingTypeSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
```

Catatan: `ratingType`, `rateeId`, `raterId`, `workId` tidak ada di schema - service yang derive (spec Decisions locked). `score` 1-5 (paralel CHECK DB 001:284). `reviewText` opsional, trim, max 2000.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/rating/schemas.ts
git commit -m "feat(rating): add rating schemas"
```

---

### Task 3: Service `modules/rating/service.ts`

**Files:**
- Create: `modules/rating/service.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (dari `@/lib/supabase/server`), `getByContractId` dari `@/modules/work/queries` (gate: return `WorkRow | null` dengan `id` + `status`), `ratingSchema` + `RatingInput` dari `./schemas` (Task 2).
- Produces:
  - `type ServiceResult<T = unknown> = { data: T | null; error: { message: string } | null }`
  - `submitRating(raterId: string, input: RatingInput): Promise<ServiceResult<{ ratingId: string }>>`

- [ ] **Step 1: Tulis service**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getByContractId as getWorkByContractId } from "@/modules/work/queries";
import { ratingSchema, type RatingInput, type RatingType } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

function deriveRatingRole(
  raterId: string,
  talentId: string,
  hirerId: string,
): { rateeId: string; ratingType: RatingType } | null {
  if (raterId === talentId) {
    return { rateeId: hirerId, ratingType: "TALENT_RATES_HIRER" };
  }
  if (raterId === hirerId) {
    return { rateeId: talentId, ratingType: "HIRER_RATES_TALENT" };
  }
  return null;
}

export async function submitRating(
  raterId: string,
  input: RatingInput,
): Promise<ServiceResult<{ ratingId: string }>> {
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: { message: "Input rating tidak valid" } };
  }

  const supabase = await createSupabaseServerClient();

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("id, talent_id, hirer_id, status")
    .eq("id", parsed.data.contractId)
    .maybeSingle();
  if (contractError) return { data: null, error: { message: contractError.message } };
  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }

  const row = contract as unknown as {
    talent_id: string;
    hirer_id: string;
    status: string;
  };

  const role = deriveRatingRole(raterId, row.talent_id, row.hirer_id);
  if (!role) {
    return { data: null, error: { message: "Not owner" } };
  }

  const work = await getWorkByContractId(parsed.data.contractId);
  if (!work) {
    return { data: null, error: { message: "Work tidak ditemukan" } };
  }
  if (work.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Rating tersedia setelah pekerjaan selesai" },
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ratings")
    .insert({
      work_id: work.id,
      contract_id: parsed.data.contractId,
      rater_id: raterId,
      ratee_id: role.rateeId,
      rating_type: role.ratingType,
      score: parsed.data.score,
      review_text: parsed.data.reviewText ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        data: null,
        error: { message: "Kamu sudah memberi rating untuk pekerjaan ini" },
      };
    }
    return { data: null, error: { message: insertError.message } };
  }

  const ratingRow = inserted as unknown as { id: string } | null;
  return { data: { ratingId: ratingRow?.id ?? "" }, error: null };
}
```

Catatan: urutan cek - validasi Zod → load contract → ownership (`deriveRatingRole` return `null` = bukan pihak) → gate `work.status === "COMPLETED"` (tanpa cek `hirer_confirmed` dan tanpa cek payment - keputusan user 2026-08-31; contract status TIDAK dicek karena rating sah sejak work COMPLETED, contract bisa masih ACTIVE sebelum payment RELEASED) → derive + insert. `work_id` dari row work (modul Work query) - client tidak pernah mengirim. `23505` = error bisnis eksplisit (berbeda dari precedent idempotent seeding Contract - di sini duplicate harus terlihat user). Tidak ada UPDATE/DELETE fungsi.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/rating/service.ts
git commit -m "feat(rating): add rating service with work gate"
```

---

### Task 4: Queries `modules/rating/queries.ts`

**Files:**
- Create: `modules/rating/queries.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (dari `@/lib/supabase/server`).
- Produces:
  - `type RatingType = "TALENT_RATES_HIRER" | "HIRER_RATES_TALENT"`
  - `type RatingRow = { id, work_id, contract_id, rater_id, ratee_id, rating_type, score, review_text, created_at }`
  - `listByContractId(contractId: string): Promise<RatingRow[]>` - 0-2 row, dipakai blok UI detail contract.
  - `listForContracts(contractIds: string[]): Promise<Map<string, RatingRow[]>>` - batch render My Applications tanpa N+1.

- [ ] **Step 1: Tulis queries**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RatingType = "TALENT_RATES_HIRER" | "HIRER_RATES_TALENT";

export type RatingRow = {
  id: string;
  work_id: string;
  contract_id: string;
  rater_id: string;
  ratee_id: string;
  rating_type: RatingType;
  score: number;
  review_text: string | null;
  created_at: string;
};

const RATING_COLUMNS =
  "id, work_id, contract_id, rater_id, ratee_id, rating_type, score, review_text, created_at";

export async function listByContractId(
  contractId: string,
): Promise<RatingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ratings")
    .select(RATING_COLUMNS)
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });
  return (data as unknown as RatingRow[]) ?? [];
}

export async function listForContracts(
  contractIds: string[],
): Promise<Map<string, RatingRow[]>> {
  const map = new Map<string, RatingRow[]>();
  if (contractIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ratings")
    .select(RATING_COLUMNS)
    .in("contract_id", contractIds);

  for (const r of (data as unknown as RatingRow[]) ?? []) {
    const list = map.get(r.contract_id) ?? [];
    list.push(r);
    map.set(r.contract_id, list);
  }
  return map;
}
```

Catatan: satu contract punya 0-2 rating (dua arah) → value berupa array, bukan single row (beda dari Work/Payment yang `Map<string, Row>`). Kandidat UI cari rating-nya sendiri via `rater_id === user.id`.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/rating/queries.ts
git commit -m "feat(rating): add rating queries"
```

---

### Task 5: Server Actions `modules/rating/actions.ts`

**Files:**
- Create: `modules/rating/actions.ts`

**Interfaces:**
- Consumes: `submitRating` (Task 3), `ratingSchema` + `RatingInput` (Task 2), `requireUser` dari `@/modules/lib/auth` (return `user` dengan `id`).
- Produces:
  - `submitRating(contractId: string, redirectTo: string, formData: FormData): Promise<void>`
  - Fire-and-forget `void` - error bisnis/validasi silent return; sukses `revalidatePath` + `redirect(redirectTo)` (keputusan 2026-08-29).

- [ ] **Step 1: Tulis actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { ratingSchema } from "./schemas";
import { submitRating as submitRatingService } from "./service";

export async function submitRating(
  contractId: string,
  redirectTo: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const parsed = ratingSchema.safeParse({
    contractId,
    score: Number(formData.get("score")),
    reviewText:
      (formData.get("reviewText") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) return;

  const { error } = await submitRatingService(user.id, parsed.data);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}
```

Catatan: `requireUser` (bukan `requireRole`) - kedua role boleh menilai; ownership + konsistensi rating_type di-enforce service + RLS INSERT policy. `contractId` dari bind (bukan FormData) supaya tidak bisa di-spoof per-form. Validasi gagal → silent return (pola fire-and-forget, konsisten keputusan 2026-08-29); sukses `revalidatePath("/applications")` + `/contracts/{id}` + `redirect` balik. `redirect()` bertipe `never`.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/rating/actions.ts
git commit -m "feat(rating): add rating server action"
```

---

### Task 6: Detail contract - blok rating + form (kedua role)

**Files:**
- Modify: `app/contracts/[id]/page.tsx`

**Interfaces:**
- Consumes: `listByContractId` dari `@/modules/rating/queries` (Task 4), `submitRating` (Task 5), `contract` + `work` + `isHirer` + `user` yang sudah ada di page.
- Produces: blok rating setelah blok payment - form submit (score 1-5 + review opsional) saat eligible, badge read-only setelah submit, hint saat gate belum terpenuhi.

- [ ] **Step 1: Tambah import + fetch**

```tsx
import { listByContractId } from "@/modules/rating/queries";
import { submitRating } from "@/modules/rating/actions";
```

Setelah `const payment = await getPaymentByContractId(id);`:

```tsx
const ratings = await listByContractId(id);
const myRating = ratings.find((r) => r.rater_id === user.id);
const rateeRating = ratings.find((r) => r.ratee_id === user.id);
const isTalent = user.id === contract.talent_id;
const canRate = work?.status === "COMPLETED" && !myRating;
```

- [ ] **Step 2: Render blok rating**

Tambahkan blok setelah blok payment (`{payment && (...)}`), sebelum `<div className="flex gap-2 mt-4">`:

```tsx
<div className="mt-3 border rounded p-4 text-sm flex flex-col gap-2">
  <p>
    <span className="font-medium">Rating:</span>{" "}
    {myRating ? (
      <>
        <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1">
          {myRating.score}/5
        </span>
        <span className="ml-2 text-gray-600">
          {new Date(myRating.created_at).toLocaleDateString("id-ID")}
        </span>
        {myRating.review_text && (
          <p className="text-gray-600 mt-1">“{myRating.review_text}”</p>
        )}
      </>
    ) : work?.status === "COMPLETED" ? (
      <form
        action={submitRating.bind(null, contract.id, `/contracts/${contract.id}`)}
        className="flex flex-col gap-2 mt-1"
      >
        <select
          name="score"
          required
          defaultValue=""
          className="border rounded px-2 py-1 text-sm max-w-xs"
        >
          <option value="" disabled>
            Pilih skor
          </option>
          {[1, 2, 3, 4, 5].map((s) => (
            <option key={s} value={s}>
              {s} - {["Buruk", "Kurang", "Cukup", "Baik", "Sangat baik"][s - 1]}
            </option>
          ))}
        </select>
        <textarea
          name="reviewText"
          rows={2}
          maxLength={2000}
          placeholder="Review (opsional)"
          className="border rounded px-2 py-1 text-sm max-w-xs"
        />
        <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm max-w-fit">
          Kirim Rating
        </button>
      </form>
    ) : (
      <span className="text-amber-600">
        Rating tersedia setelah pekerjaan selesai.
      </span>
    )}
  </p>
  {rateeRating && (
    <p className="text-gray-600">
      {isHirer ? "Talent" : "Hirer"} memberi rating{" "}
      <span className="text-xs bg-gray-100 rounded px-2 py-1">
        {rateeRating.score}/5
      </span>
      {rateeRating.review_text ? ` - “${rateeRating.review_text}”` : ""}
    </p>
  )}
</div>
```

Catatan: form action bound `(contractId, redirectTo, formData)` - `score`/`reviewText` dari FormData, sisanya derived service. Tidak ada tombol edit/hapus (immutable). Setelah submit → `revalidatePath` + `redirect` balik → badge read-only. Gate UI = `work?.status === "COMPLETED"`; service double-check. RLS SELECT involved memastikan hanya melihat rating kontrak sendiri.

- [ ] **Step 3: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/contracts
git commit -m "feat(rating): add rating block to contract detail"
```

---

### Task 7: My Applications (TALENT) - blok rating + form + cleanup duplikat

**Files:**
- Modify: `app/applications/page.tsx`

**Interfaces:**
- Consumes: `listForContracts` dari `@/modules/rating/queries` (Task 4), `submitRating` (Task 5), `contracts` + `works` map yang sudah ada di page, `user` dari `requireRole("TALENT")`.
- Produces: blok rating per application (form rate hirer saat eligible; badge read-only setelah submit).
- Cleanup: file ini punya duplikat blok work (baris ~185-227 dan ~228-270 render dua kali) - hapus satu (bug visual dari sprint Work, sekalian dirapikan karena file ini disentuh).

- [ ] **Step 1: Hapus duplikat blok work**

Hapus blok work kedua (IIFE kedua yang me-render `<span>Work:</span>` - baris ~228-270; sisakan satu). Verifikasi visual: tiap card aplikasi menampilkan blok Work tepat satu kali.

- [ ] **Step 2: Tambah import + batch fetch**

```tsx
import { listForContracts as listRatingsForContracts } from "@/modules/rating/queries";
import { submitRating } from "@/modules/rating/actions";
```

Setelah fetch payments:

```tsx
const ratings = await listRatingsForContracts(
  [...contracts.values()].map((c) => c.id),
);
```

- [ ] **Step 3: Render blok rating setelah blok payment**

Tambahkan IIFE setelah blok payment (`payments.get(...)`), sebelum penutup card:

```tsx
{(() => {
  const contract = contracts.get(a.id);
  if (!contract) return null;
  const work = works.get(contract.id);
  if (!work) return null;
  const rows = ratings.get(contract.id) ?? [];
  const myRating = rows.find((r) => r.rater_id === user.id);
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Rating:</span>
        {myRating ? (
          <>
            <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1">
              {myRating.score}/5
            </span>
            {myRating.review_text && (
              <span className="text-sm text-gray-600 truncate max-w-xs">
                “{myRating.review_text}”
              </span>
            )}
          </>
        ) : work.status === "COMPLETED" ? (
          <form
            action={submitRating.bind(null, contract.id, "/applications")}
            className="flex items-center gap-2"
          >
            <select
              name="score"
              required
              defaultValue=""
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="" disabled>
                Nilai hirer
              </option>
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="reviewText"
              maxLength={2000}
              placeholder="Review (opsional)"
              className="border rounded px-2 py-1 text-sm"
            />
            <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
              Kirim Rating
            </button>
          </form>
        ) : (
          <span className="text-sm text-gray-600">
            Tersedia setelah pekerjaan selesai.
          </span>
        )}
      </div>
    </div>
  );
})()}
```

Catatan: TALENT selalu rate hirer (`TALENT_RATES_HIRER`) - derive di service. Gate UI = `work.status === "COMPLETED"`; duplicate dicegah oleh `!myRating` + UNIQUE DB + service. `reviewText` via `<input>` biasa (bukan textarea) - konsisten ringkas untuk list.

- [ ] **Step 4: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/applications/page.tsx
git commit -m "feat(rating): add rating block to my applications"
```

---

### Task 8: Build & typecheck verification + E2E smoke

**Files:**
- None (verification only)

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: semua PASS tanpa error.

- [ ] **Step 2: E2E smoke manual (2 akun browser)**

Data reuse smoke Payment: contract `b8ce8bdc-3fd1-40bd-832d-465c8daac86b` (CNTR-260831-DVA4) status **COMPLETED** (hasil side effect Payment), work `COMPLETED` + `hirer_confirmed = true`, payment `RELEASED`. Akun: `smoke-talent-consent@example.test` (TALENT pihak kontrak) + `smoke-hirer-consent@example.test` (HIRER), password `Smoke123!`. Dev server: `npm run dev`.

1. TALENT buka `/contracts/b8ce8bdc-3fd1-40bd-832d-465c8daac86b` → blok Rating: belum ada rating, work COMPLETED → form (select 1-5 + review) → pilih 5, isi "Hirer profesional" → **Kirim** → badge `5/5` + review tampil, form hilang.
2. DB: row `ratings` baru - `rating_type = 'TALENT_RATES_HIRER'`, `rater_id` = talent id, `ratee_id` = hirer id, `score = 5`, `work_id`/`contract_id` benar.
3. Duplicate: TALENT reload → badge read-only, form hilang; panggil ulang action via curl/devtools → error "Kamu sudah memberi rating untuk pekerjaan ini" (service path) - UI tidak menawarkan jalur kedua.
4. HIRER buka contract yang sama → form rate talent → kirim (score 4) → badge `4/5`; DB row kedua `rating_type = 'HIRER_RATES_TALENT'`.
5. Gate-fail path: reset via SQL `update works set status = 'IN_PROGRESS' where contract_id = 'b8ce8bdc-...';` → reload detail (kedua role) → form rating hilang, hint "Rating tersedia setelah pekerjaan selesai" → restore `update works set status = 'COMPLETED' ...`.
6. My Applications TALENT: blok Rating per application (badge setelah rate) tanpa N+1 (1 query batch `listForContracts`).
7. RLS via REST: TALENT pihak kontrak SELECT `/rest/v1/ratings?contract_id=eq.b8ce8bdc-...` → 2 rows (involved); TALENT asing → `[]`; INSERT spoof (`rater_id` = talent lain / `rating_type` mismatch) → 42501 (`ratings_insert_involved`); PATCH ratings oleh siapapun → 0 rows (tidak ada UPDATE policy).
8. UI admin: admin tidak punya tombol/tform rating (read-only - tanpa blok form).

- [ ] **Step 3: Commit (jika ada perbaikan)**

```bash
git add -A
git commit -m "fix(rating): address smoke test findings"
```

---

### Task 9: Update `docs/PROGRESS.md`

- [ ] **Step 1: Update progress**

- Tambah "Module Rating" ke "Sudah Selesai" (Task 1-8).
- Decision Log tambah:
  - `2026-08-31: Rating gate = work.status COMPLETED saja (API-SPEC 14.2; keputusan user) - tanpa gate payment RELEASED; rating sah saat contract masih ACTIVE`
  - `2026-08-31: Rating immutable - tanpa UPDATE/DELETE (UI/service/RLS); UNIQUE(work_id, rater_id, rating_type) + 23505 = error bisnis "sudah memberi rating" (bukan idempotent success)`
  - `2026-08-31: ratingType/rateeId/raterId/work_id derived server-side dari posisi rater di contract; client hanya kirim contractId + score + reviewText`
  - `2026-08-31: RLS ratings INSERT menolak rater spoofing + rating_type mismatch di level DB (rater_id = auth.uid() + rating_type konsisten posisi)`
- Status terakhir: Sprint 10 - Module Rating selesai; next: Verified Work History.

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update progress rating module"
```

---

## Self-Review Notes

- **Spec coverage:** RLS SELECT+INSERT (Task 1), schemas (Task 2), service submit + gate + derive + 23505 (Task 3), queries list 2 arah (Task 4), action FormData + requireUser + redirectTo (Task 5), UI detail contract kedua role (Task 6), UI My Applications + cleanup duplikat work block (Task 7), verification + smoke + RLS REST (Task 8), progress (Task 9). AC spec: AC 1 → Task 3 (gate/derive) + Task 6/7 (UI), AC 2 → Task 3 ("Not owner"/gate/23505) + smoke steps 3/5/7, AC 3 → Task 3+5 (derive, client hanya 3 field), AC 4 → Task 1 (tanpa policy U/D) + Task 3 (tanpa fungsi update) + smoke step 7, AC 5 → Task 1 + smoke step 7, AC 6 → Task 6+7 (batch map), AC 7 → Task 8 Step 1.
- **Placeholder scan:** tidak ada TBD/TODO; service, action, queries, SQL, JSX UI lengkap; tidak ada "similar to Task N".
- **Type consistency:** `RatingInput` (`contractId`, `score`, `reviewText?`), `RatingRow`, `RatingType`, `listByContractId` → `RatingRow[]`, `listForContracts` → `Map<string, RatingRow[]>` (array, bukan single - beda dari Work/Payment, disengaja karena 2 arah), `submitRating(raterId, input)` service vs action `submitRating(contractId, redirectTo, formData)` (pola bind form). Konsumsi `WorkRow.status` via `getByContractId` modul Work - sudah live, tanpa perubahan modul Work. `requireUser` dipakai (bukan `requireRole`) karena aktor dua role - konsisten detail contract yang pakai `requireUser`.
