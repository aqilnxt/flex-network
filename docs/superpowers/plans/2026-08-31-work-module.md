# Work Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TALENT menggerakkan work `NOT_STARTED → IN_PROGRESS → COMPLETED` pada contract ACTIVE, HIRER mengonfirmasi penyelesaian (`hirer_confirmed = true`), dan gate `COMPLETED && hirer_confirmed` dipublikasikan via `getByContractId` untuk modul Payment (sprint berikutnya).

**Architecture:** Modular monolith pattern yang sama dengan modul Meeting/Consent/Contract: `modules/work/` (schemas → queries → service → actions) di atas tabel `works` yang sudah live + row di-seed modul Contract saat ACTIVE (tanpa perubahan skema). State machine di-enforce server-side di service; RLS granular baru di migration `013`. Modul Work TIDAK pernah menulis tabel `payments`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (server client + RLS), Zod, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-08-31-work-module-design.md`

## Global Constraints

- Status canonical work: `NOT_STARTED / IN_PROGRESS / COMPLETED` (CHECK constraint DB 001:262, jangan diubah).
- Transisi `NOT_STARTED → IN_PROGRESS` dan `IN_PROGRESS → COMPLETED` hanya oleh TALENT pihak kontrak; `NOT_STARTED → COMPLETED` langsung ditolak (BRD 16.2).
- `confirmCompletion` hanya oleh HIRER pihak kontrak, hanya dari `COMPLETED && !hirer_confirmed`; irreversible (verification event, BRD 17.3).
- Semua transisi mengecek `contracts.status = 'ACTIVE'`.
- Modul Work TIDAK menyentuh tabel `payments` (release rule BRD 15.3 = modul Payment via `getByContractId`).
- Kolom `notes` tidak diisi modul ini; `confirmed_by`/`hirer_confirmed_at`/timestamps di-set service, tidak pernah dari client.
- Migration tidak mengubah skema tabel (kolom `works` sudah live di 001; INSERT policy seed sudah ada di 012).
- Verifikasi project: `npx tsc --noEmit`, `npm run lint`, `npm run build` (tidak ada test framework).
- Commit format: `type(scope): deskripsi imperative lowercase` (lihat `/GIT_COMMIT.md`).

---

### Task 1: Migration `013_work_rls.sql` + push

**Files:**
- Create: `supabase/migrations/013_work_rls.sql`

**Interfaces:**
- Consumes: tabel `works` (001, RLS enabled default-deny tanpa policy; INSERT policy `works_insert_seed` dari 012), tabel `contracts` (001), helper `is_admin()` (006).
- Produces: RLS SELECT involved/admin + UPDATE involved pada `works`.

- [ ] **Step 1: Tulis migration**

```sql
-- 013_work_rls.sql — granular policies untuk works
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- INSERT (seed saat contract ACTIVE) sudah ada di 012_contract_rls.sql.
-- Perbedaan peran (talent transisi vs hirer confirm) di-enforce service.

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

- [ ] **Step 2: Push ke Supabase**

Run: `supabase db push`
Expected: migration applied.

- [ ] **Step 3: Verifikasi policy**

Run: `supabase db query --linked "select tablename, policyname, cmd from pg_policies where tablename = 'works' order by policyname;"`
Expected: 3 rows — `works_insert_seed` (INSERT, dari 012), `works_select_involved` (SELECT), `works_update_involved` (UPDATE).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/013_work_rls.sql
git commit -m "feat(db): add works rls policies"
```

---

### Task 2: Schemas `modules/work/schemas.ts`

**Files:**
- Create: `modules/work/schemas.ts`

**Interfaces:**
- Produces: `workStatusSchema`, `WorkStatus` (semua `z.infer`).

- [ ] **Step 1: Tulis schema**

```ts
import { z } from "zod";

export const workStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

export type WorkStatus = z.infer<typeof workStatusSchema>;
```

Catatan: transisi status dikirim sebagai konstanta server-side per action (client tidak pernah mengirim status bebas). Kolom `hirer_confirmed`, `confirmed_by`, timestamps tidak pernah diterima dari client.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/work/schemas.ts
git commit -m "feat(work): add work schemas"
```

---

### Task 3: Service `modules/work/service.ts`

**Files:**
- Create: `modules/work/service.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (dari `@/lib/supabase/server`).
- Produces:
  - `type ServiceResult<T = unknown> = { data: T | null; error: { message: string } | null }`
  - `startWork(talentId: string, contractId: string): Promise<ServiceResult<{ workId: string }>>`
  - `completeWork(talentId: string, contractId: string): Promise<ServiceResult<{ workId: string }>>`
  - `confirmCompletion(hirerId: string, contractId: string): Promise<ServiceResult<{ workId: string }>>`

- [ ] **Step 1: Tulis service**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type WorkWithContract = {
  workId: string;
  workStatus: string;
  hirerConfirmed: boolean;
  contractTalentId: string;
  contractHirerId: string;
  contractStatus: string;
};

async function loadWorkWithContract(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  contractId: string,
): Promise<ServiceResult<WorkWithContract>> {
  const { data, error } = await supabase
    .from("works")
    .select(
      "id, status, hirer_confirmed, contract:contracts(talent_id, hirer_id, status)",
    )
    .eq("contract_id", contractId)
    .maybeSingle();

  if (error) return { data: null, error: { message: error.message } };
  if (!data) {
    return { data: null, error: { message: "Work tidak ditemukan" } };
  }

  const row = data as unknown as {
    id: string;
    status: string;
    hirer_confirmed: boolean;
    contract: { talent_id: string; hirer_id: string; status: string } | null;
  };

  if (!row.contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }

  return {
    data: {
      workId: row.id,
      workStatus: row.status,
      hirerConfirmed: row.hirer_confirmed,
      contractTalentId: row.contract.talent_id,
      contractHirerId: row.contract.hirer_id,
      contractStatus: row.contract.status,
    },
    error: null,
  };
}

export async function startWork(
  talentId: string,
  contractId: string,
): Promise<ServiceResult<{ workId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadWorkWithContract(
    supabase,
    contractId,
  );
  if (loadError || !ctx) return { data: null, error: loadError };

  if (ctx.contractTalentId !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (ctx.contractStatus !== "ACTIVE") {
    return {
      data: null,
      error: { message: "Kontrak belum aktif" },
    };
  }
  if (ctx.workStatus !== "NOT_STARTED") {
    return { data: null, error: { message: "Work sudah dimulai" } };
  }

  const { error } = await supabase
    .from("works")
    .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
    .eq("id", ctx.workId);
  if (error) return { data: null, error: { message: error.message } };
  return { data: { workId: ctx.workId }, error: null };
}

export async function completeWork(
  talentId: string,
  contractId: string,
): Promise<ServiceResult<{ workId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadWorkWithContract(
    supabase,
    contractId,
  );
  if (loadError || !ctx) return { data: null, error: loadError };

  if (ctx.contractTalentId !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (ctx.contractStatus !== "ACTIVE") {
    return { data: null, error: { message: "Kontrak belum aktif" } };
  }
  if (ctx.workStatus !== "IN_PROGRESS") {
    return {
      data: null,
      error: { message: "Work belum dimulai" },
    };
  }

  const { error } = await supabase
    .from("works")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", ctx.workId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { workId: ctx.workId }, error: null };
}

export async function confirmCompletion(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ workId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadWorkWithContract(
    supabase,
    contractId,
  );
  if (loadError || !ctx) return { data: null, error: loadError };

  if (ctx.contractHirerId !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (ctx.contractStatus !== "ACTIVE") {
    return { data: null, error: { message: "Kontrak belum aktif" } };
  }
  if (ctx.workStatus !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Pekerjaan belum ditandai selesai oleh talent" },
    };
  }
  if (ctx.hirerConfirmed) {
    return { data: null, error: { message: "Sudah dikonfirmasi" } };
  }

  const { error } = await supabase
    .from("works")
    .update({
      hirer_confirmed: true,
      hirer_confirmed_at: new Date().toISOString(),
      confirmed_by: hirerId,
    })
    .eq("id", ctx.workId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { workId: ctx.workId }, error: null };
}
```

Catatan: `loadWorkWithContract(supabase, contractId)` — helper bersama; semua service menerima `supabase` sebagai argumen pertama seperti modul Consent/Contract. `startWork` harus mengikuti pola `completeWork` (load + ownership + gate + state check sebelum write) — update `.eq("id", ctx.workId)`. Error message transisi: `startWork` menolak bila `workStatus !== "NOT_STARTED"` dengan pesan `"Work sudah dimulai"`; `completeWork` menolak skip dengan pesan `"Work belum dimulai"`.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/work/service.ts
git commit -m "feat(work): add work service with state machine and confirm gate"
```

---

### Task 4: Queries `modules/work/queries.ts`

**Files:**
- Create: `modules/work/queries.ts`

**Interfaces:**
- Produces:
  - `type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"`
  - `type WorkRow = { id, contract_id, status, started_at, completed_at, hirer_confirmed, hirer_confirmed_at, confirmed_by, notes }`
  - `getByContractId(contractId: string): Promise<WorkRow | null>` — **single call gate modul Payment** (release iff `status === "COMPLETED" && hirer_confirmed`) **dan gate Rating** (rating iff `status === "COMPLETED"`); juga dipakai blok UI detail contract.
  - `listForContracts(contractIds: string[]): Promise<Map<string, WorkRow>>` — batch render inline tanpa N+1.

- [ ] **Step 1: Tulis queries**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type WorkRow = {
  id: string;
  contract_id: string;
  status: WorkStatus;
  started_at: string | null;
  completed_at: string | null;
  hirer_confirmed: boolean;
  hirer_confirmed_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
};

const WORK_COLUMNS =
  "id, contract_id, status, started_at, completed_at, hirer_confirmed, hirer_confirmed_at, confirmed_by, notes";

export async function getByContractId(
  contractId: string,
): Promise<WorkRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("works")
    .select(WORK_COLUMNS)
    .eq("contract_id", contractId)
    .maybeSingle();
  return (data as unknown as WorkRow) ?? null;
}

export async function listForContracts(
  contractIds: string[],
): Promise<Map<string, WorkRow>> {
  const map = new Map<string, WorkRow>();
  if (contractIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("works")
    .select(WORK_COLUMNS)
    .in("contract_id", contractIds);

  for (const w of (data as unknown as WorkRow[]) ?? []) {
    map.set(w.contract_id, w);
  }
  return map;
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/work/queries.ts
git commit -m "feat(work): add work queries with payment and rating gate"
```

---

### Task 5: Server Actions `modules/work/actions.ts`

**Files:**
- Create: `modules/work/actions.ts`

**Interfaces:**
- Consumes: `startWork`/`completeWork`/`confirmCompletion` (Task 3), `requireRole` dari `@/modules/lib/auth`.
- Produces:
  - `startWork(contractId: string, redirectTo: string): Promise<void>`
  - `completeWork(contractId: string, redirectTo: string): Promise<void>`
  - `confirmWork(contractId: string, redirectTo: string): Promise<void>`
  - Ketiganya fire-and-forget `void` — error bisnis silent return; sukses `revalidatePath` + `redirect(redirectTo)` (konsisten keputusan 2026-08-29: redirect balik ke halaman asal supaya UI refresh deterministik).

- [ ] **Step 1: Tulis actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import {
  startWork as startWorkService,
  completeWork as completeWorkService,
  confirmCompletion as confirmCompletionService,
} from "./service";

export async function startWork(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await startWorkService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}

export async function completeWork(contractId: string, redirectTo: string): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await completeWorkService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}

export async function confirmWork(contractId: string, redirectTo: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await confirmCompletionService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}
```

Catatan: `startWork`/`completeWork` = TALENT; `confirmWork` = HIRER. `redirectTo` disuplai caller (pemanggil punya path halaman asal). `redirect()` bertipe `never` — tidak butuh return setelahnya.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/work/actions.ts
git commit -m "feat(work): add work server actions"
```

---

### Task 6: My Applications (TALENT) — blok work + aksi mulai/selesai

**Files:**
- Modify: `app/applications/page.tsx`

**Interfaces:**
- Consumes: `listForContracts` (Task 4), `startWork`/`completeWork` (Task 5), map `contracts` yang sudah ada di page (`Map<applicationId, ContractRow>`).
- Produces: blok work status-aware (tombol Mulai Kerja saat NOT_STARTED, Tandai Selesai saat IN_PROGRESS; read-only lainnya).

- [ ] **Step 1: Tambah import + batch fetch**

```tsx
import { listForContracts } from "@/modules/work/queries";
import { startWork, completeWork } from "@/modules/work/actions";
```

Setelah fetch contracts (baris `const contracts = await listContractsForApplications(appIds);`):

```tsx
const works = await listForContracts(
  [...contracts.values()].map((c) => c.id),
);
```

- [ ] **Step 2: Render blok work di dalam tiap card, setelah blok kontrak**

```tsx
{(() => {
  const contract = contracts.get(a.id);
  if (!contract) return null;
  const work = works.get(contract.id);
  if (!work) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Work:</span>
        <span className="text-xs bg-gray-100 rounded px-2 py-1">
          {work.status}
        </span>
        {work.hirer_confirmed && (
          <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1">
            Dikonfirmasi HIRER
          </span>
        )}
      </div>
      {contract.status === "ACTIVE" && work.status === "NOT_STARTED" && (
        <form action={startWork.bind(null, contract.id, "/applications")} className="mt-2">
          <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
            Mulai Kerja
          </button>
        </form>
      )}
      {contract.status === "ACTIVE" && work.status === "IN_PROGRESS" && (
        <form action={completeWork.bind(null, contract.id, "/applications")} className="mt-2">
          <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
            Tandai Selesai
          </button>
        </form>
      )}
      {work.status === "COMPLETED" && !work.hirer_confirmed && (
        <p className="text-sm text-amber-600 mt-1">Menunggu konfirmasi hirer.</p>
      )}
      {work.status === "COMPLETED" && work.hirer_confirmed && (
        <p className="text-sm text-green-700 mt-1">
          Pekerjaan selesai — dikonfirmasi hirer.
        </p>
      )}
    </div>
  );
})()}
```

Catatan: work row hanya ada untuk contract ACTIVE (seed modul Contract); guard `contract.status === "ACTIVE"` tetap eksplisit di UI. Kontrak TERMINATED (mis. `QA Engineer Contract` dari smoke Contract) tidak punya work row → blok senyap.

- [ ] **Step 3: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/applications/
git commit -m "feat(work): add work block to my applications"
```

---

### Task 7: Applicant list (HIRER) — badge work + tombol konfirmasi selesai

**Files:**
- Modify: `app/hirer/opportunities/[id]/applications/page.tsx`

**Interfaces:**
- Consumes: `listForContracts` (Task 4), `confirmWork` (Task 5), map `contracts` yang sudah ada di page.
- Produces: blok work per application (badge status; tombol **Konfirmasi Selesai** saat `COMPLETED && !hirer_confirmed`).

- [ ] **Step 1: Tambah import + batch fetch**

```tsx
import { listForContracts } from "@/modules/work/queries";
import { confirmWork } from "@/modules/work/actions";
```

Setelah fetch contracts (baris `const contracts = await listContractsForApplications(...)`):

```tsx
const works = await listForContracts(
  [...contracts.values()].map((c) => c.id),
);
```

- [ ] **Step 2: Render IIFE setelah blok kontrak**

```tsx
{(() => {
  const contract = contracts.get(a.id);
  if (!contract) return null;
  const work = works.get(contract.id);
  if (!work) return null;
  return (
    <div className="mt-3 border-t pt-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Work:</span>
        <span className="text-xs bg-gray-100 rounded px-2 py-1">
          {work.status}
        </span>
        {work.hirer_confirmed && (
          <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1">
            Dikonfirmasi
          </span>
        )}
      </div>
      {contract.status === "ACTIVE" &&
        work.status === "COMPLETED" &&
        !work.hirer_confirmed && (
          <form
            action={confirmWork.bind(
              null,
              contract.id,
              `/hirer/opportunities/${id}/applications`,
            )}
            className="mt-2"
          >
            <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
              Konfirmasi Selesai
            </button>
          </form>
        )}
      {work.status === "COMPLETED" && work.hirer_confirmed && (
        <p className="text-sm text-green-700 mt-1">
          Pekerjaan dikonfirmasi — payment dapat dilepas (modul Payment).
        </p>
      )}
    </div>
  );
})()}
```

Catatan: `id` = opportunity id dari `params` (sudah ada di scope page). Tombol confirm hanya HIRER owner (page sudah `requireRole("HIRER")` + opportunity miliknya); service double-check `contract.hirer_id`.

- [ ] **Step 2b: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/hirer/opportunities/[id]/applications/"
git commit -m "feat(work): add work block to applicant list"
```

---

### Task 8: Detail contract — blok work + aksi sesuai role/status

**Files:**
- Modify: `app/contracts/[id]/page.tsx`

**Interfaces:**
- Consumes: `getByContractId` (Task 4), `startWork`/`completeWork`/`confirmWork` (Task 5), `contract` + `user` + `isHirer` yang sudah ada di page.
- Produces: blok work (status + hirer_confirmed + aksi inline).

- [ ] **Step 1: Tambah import**

```tsx
import { getByContractId } from "@/modules/work/queries";
import { startWork, completeWork, confirmWork } from "@/modules/work/actions";
```

- [ ] **Step 2: Fetch work + render blok**

Setelah `const isHirer = ...` (sebelum return):

```tsx
const work = await getByContractId(id);
```

Tambahkan blok setelah div detail kontrak (sebelum div aksi kontrak yang sudah ada):

```tsx
{work && (
  <div className="mt-3 border rounded p-4 text-sm flex flex-col gap-2">
    <p>
      <span className="font-medium">Work:</span>{" "}
      <span className="text-xs bg-gray-100 rounded px-2 py-1">
        {work.status}
      </span>
      {work.hirer_confirmed && (
        <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1 ml-2">
          Dikonfirmasi HIRER ✔
        </span>
      )}
    </p>
    {user.id === contract.talent_id && contract.status === "ACTIVE" && work.status === "NOT_STARTED" && (
      <form action={startWork.bind(null, contract.id, `/contracts/${contract.id}`)} className="mt-2">
        <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
          Mulai Kerja
        </button>
      </form>
    )}
    {user.id === contract.talent_id && contract.status === "ACTIVE" && work.status === "IN_PROGRESS" && (
      <form action={completeWork.bind(null, contract.id, `/contracts/${contract.id}`)} className="mt-2">
        <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
          Tandai Selesai
        </button>
      </form>
    )}
    {isHirer && contract.status === "ACTIVE" && work.status === "COMPLETED" && !work.hirer_confirmed && (
      <form action={confirmWork.bind(null, contract.id, `/contracts/${contract.id}`)} className="mt-2">
        <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
          Konfirmasi Selesai
        </button>
      </form>
    )}
    {work.status === "COMPLETED" && !work.hirer_confirmed && (
      <p className="text-sm text-amber-600">Menunggu konfirmasi hirer.</p>
    )}
  </div>
)}
```

Catatan: `work` bisa `null` (kontrak belum ACTIVE / TERMINATED tanpa seed) → blok tidak render. Aksi talent/hirer dibedakan via `user.id === contract.talent_id` / `isHirer`.

- [ ] **Step 3: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/contracts
git commit -m "feat(work): add work block to contract detail"
```

---

### Task 9: Build & typecheck verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: semua PASS tanpa error.

- [ ] **Step 2: E2E smoke manual (2 akun browser)**

Data reuse smoke Contract: contract `b8ce8bdc-3fd1-40bd-832d-465c8daac86b` (CNTR-260831-DVA4) status **ACTIVE** dengan work `NOT_STARTED` (seed). Akun: `smoke-talent-consent@example.test` (TALENT pihak kontrak) + `smoke-hirer-consent@example.test` (HIRER), password `Smoke123!` (sudah di-reset sprint Contract). Dev server: `npm run dev`.

1. TALENT buka `/applications` → blok Work `NOT_STARTED` + tombol **Mulai Kerja** → klik → status `IN_PROGRESS` + `started_at` terisi (cek DB).
2. Skip test: tombol **Tandai Selesai** TIDAK muncul saat `NOT_STARTED`; service `completeWork` menolak `NOT_STARTED` ("Work belum dimulai") — verifikasi UI (tanpa tombol) + service code path.
3. TALENT **Tandai Selesai** → status `COMPLETED` + `completed_at` terisi.
4. HIRER buka applicant list opportunity Smoke Consent (`/hirer/opportunities/c13e9c82-fd73-4a55-aeda-0ba47a3d57ff/applications`) → badge work `COMPLETED` + tombol **Konfirmasi Selesai** → klik → badge "Dikonfirmasi".
5. DB: `hirer_confirmed = true`, `hirer_confirmed_at` terisi, `confirmed_by` = hirer id; **`payments` masih PENDING** (modul Work tidak menyentuh payments).
6. Terminal test: confirm kedua ditolak service ("Sudah dikonfirmasi") — tombol hilang dari UI; verify via service error di langkah smoke opsional.
7. Gate contract: coba transisi work pada kontrak TERMINATED (5192b7fc) → tidak ada work row → UI senyap; service menolak bila dipangsa.
8. RLS via REST: talent asing SELECT `/rest/v1/works` → hanya row kontraknya; PATCH works kontrak orang lain → 0 rows (204); INSERT works → 42501 (policy seed 012 mewajibkan contract ACTIVE + pihak kontrak).
9. UI TALENT: blok work status-aware (Mulai Kerja → Tandai Selesai → menunggu/dikonfirmasi) tanpa N+1 (1 query batch `listForContracts`).

- [ ] **Step 3: Commit (jika ada perbaikan)**

```bash
git add -A
git commit -m "fix(work): address smoke test findings"
```

---

### Task 10: Update `docs/PROGRESS.md`

- [ ] **Step 1: Update progress**

- Tambah "Module Work" ke "Sudah Selesai" (Task 1–9).
- Decision Log tambah:
  - `2026-08-31: Work transisi status = TALENT saja (BRD 16.2); HIRER hanya confirm completion (verification event, irreversible)`
  - `2026-08-31: Payment RELEASED = tanggung jawab modul Payment (sprint berikutnya); Work hanya expose gate getByContractId (COMPLETED + hirer_confirmed); gate Rating nanti = work COMPLETED`
  - `2026-08-29: Work actions redirect balik via parameter redirectTo (dipakai 2 halaman: /applications dan /contracts/[id])`
- Status terakhir: Sprint 8 — Module Work selesai; next: Payment (SIMULATED_PAID → RELEASED via gate work).

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update progress work module"
```

---

## Self-Review Notes

- **Spec coverage:** RLS (Task 1), schemas (Task 2), service state machine 3 transisi (Task 3), queries gate payment/rating (Task 4), actions + redirectTo (Task 5), UI TALENT (Task 6), UI HIRER (Task 7), UI detail contract (Task 8), verification + smoke + RLS (Task 9), progress (Task 10). Acceptance criteria 1–7 spec terpetakan (AC 1 di Task 1+9, AC 2–3 di Task 3+5, AC 4 eksplisit di constraint + Task 5, AC 5 di Task 1+9, AC 6 di Task 6–8, AC 7 di Task 8).
- **Placeholder scan:** tidak ada TBD/TODO; service lengkap dengan helper `loadWorkWithContract`; actions menerima `redirectTo` (pola redirect balik).
- **Type consistency:** `ServiceResult`, `WorkRow`, `WorkStatus`, `getByContractId`, `listForContracts`, signatures `startWork(talentId, contractId)` / `completeWork(talentId, contractId)` / `confirmCompletion(hirerId, contractId)` konsisten dipakai di Task 5–8. Action names `startWork`/`completeWork`/`confirmWork` (void, 2 param) dipakai konsisten di Task 6/7/8.
