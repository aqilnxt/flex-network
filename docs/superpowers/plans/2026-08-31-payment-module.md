# Payment Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HIRER mensimulasikan pembayaran (`PENDING → SIMULATED_PAID`, set `held_at/held_by`) dan melepas dana (`SIMULATED_PAID → RELEASED`, set `released_at/released_by`) hanya setelah gate `work.status = COMPLETED && hirer_confirmed = true`; RELEASED men-trigger side effect `contracts.status = 'COMPLETED'`.

**Architecture:** Modular monolith pattern sama dengan modul Meeting/Consent/Contract/Work: `modules/payment/` (schemas → queries → service → actions) di atas tabel `payments` yang sudah live + row di-seed modul Contract saat ACTIVE (tanpa perubahan skema). State machine di-enforce server-side di service; RLS granular baru di migration `014` (SELECT involved/admin, UPDATE hirer-only). Modul Payment membaca gate work via `getByContractId` dari `modules/work/queries` (precedent: Contract service memanggil Consent queries) - tanpa siklus import.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (server client + RLS), Zod, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-08-31-payment-module-design.md`

## Global Constraints

- Status canonical payment: `PENDING / SIMULATED_PAID / RELEASED` (CHECK constraint DB 001:240, jangan diubah).
- `PENDING → SIMULATED_PAID` hanya oleh HIRER pihak kontrak, hanya dari contract ACTIVE (API-SPEC 12.3); set `held_at` + `held_by`.
- `SIMULATED_PAID → RELEASED` hanya oleh HIRER pihak kontrak, hanya jika `payment.status = 'SIMULATED_PAID'` && `work.status = 'COMPLETED'` && `work.hirer_confirmed = true` (BRD 15.3); skip `PENDING → RELEASED` ditolak.
- Side effect RELEASED: `contracts.status = 'COMPLETED'` + `completed_at` - satu-satunya jalur kontrak jadi COMPLETED (keputusan user 2026-08-31).
- Admin read-only (tidak ada transisi payment oleh admin).
- Kolom `held_at/held_by/released_at/released_by` di-set service dari session user server-side, tidak pernah dari client.
- Tidak ada notification, tidak ada REST API, tidak ada refund/gateway (defer - spec Out of Scope).
- Migration tidak mengubah skema tabel (kolom `payments` sudah live di 001; INSERT policy seed sudah ada di 012).
- Verifikasi project: `npx tsc --noEmit`, `npm run lint`, `npm run build` (tidak ada test framework).
- Commit format: `type(scope): deskripsi imperative lowercase` (lihat `/GIT_COMMIT.md`).

---

### Task 1: Migration `014_payment_rls.sql` + push

**Files:**
- Create: `supabase/migrations/014_payment_rls.sql`

**Interfaces:**
- Consumes: tabel `payments` (001, RLS enabled default-deny tanpa policy; INSERT policy `payments_insert_seed` dari 012), tabel `contracts` (001), helper `is_admin()` (006).
- Produces: RLS SELECT involved/admin + UPDATE hirer-only pada `payments`.

- [ ] **Step 1: Tulis migration**

```sql
-- 014_payment_rls.sql - granular policies untuk payments
-- Baseline 003: RLS enabled, default-deny, tanpa policy.
-- INSERT (seed saat contract ACTIVE) sudah ada di 012_contract_rls.sql.
-- Kedua transisi (SIMULATED_PAID, RELEASED) aktornya HIRER - state machine di-enforce service.

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

-- UPDATE: hanya hirer pihak contract (kedua transisi aktornya HIRER; talent read-only di level RLS)
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

Catatan: tidak ada policy INSERT (row di-seed modul Contract via `payments_insert_seed` dari 012) dan DELETE (cascade dari contracts). UPDATE lebih ketat dari Work - hirer-only (bukan involved) karena talent tidak pernah menransisi payment; RLS defense-in-depth, gate bisnis (SIMULATED_PAID + work COMPLETED + hirer_confirmed) di-enforce service.

- [ ] **Step 2: Push ke Supabase**

Run: `supabase db push`
Expected: migration applied.

- [ ] **Step 3: Verifikasi policy**

Run: `supabase db query --linked "select tablename, policyname, cmd from pg_policies where tablename = 'payments' order by policyname;"`
Expected: 2 rows - `payments_insert_seed` (INSERT, dari 012), `payments_select_involved` (SELECT), `payments_update_hirer` (UPDATE).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/014_payment_rls.sql
git commit -m "feat(db): add payments rls policies"
```

---

### Task 2: Schemas `modules/payment/schemas.ts`

**Files:**
- Create: `modules/payment/schemas.ts`

**Interfaces:**
- Produces: `paymentStatusSchema`, `PaymentStatus` (semua `z.infer`).

- [ ] **Step 1: Tulis schema**

```ts
import { z } from "zod";

export const paymentStatusSchema = z.enum([
  "PENDING",
  "SIMULATED_PAID",
  "RELEASED",
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
```

Catatan: transisi status dikirim sebagai konstanta server-side per action (client tidak pernah mengirim status bebas). Kolom `held_at`, `held_by`, `released_at`, `released_by` tidak pernah diterima dari client - di-set service dari session user.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/payment/schemas.ts
git commit -m "feat(payment): add payment schemas"
```

---

### Task 3: Service `modules/payment/service.ts`

**Files:**
- Create: `modules/payment/service.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (dari `@/lib/supabase/server`), `getByContractId` dari `@/modules/work/queries` (gate: return `WorkRow | null`, cek `status === "COMPLETED" && hirer_confirmed`).
- Produces:
  - `type ServiceResult<T = unknown> = { data: T | null; error: { message: string } | null }`
  - `simulatePayment(hirerId: string, contractId: string): Promise<ServiceResult<{ paymentId: string }>>`
  - `releasePayment(hirerId: string, contractId: string): Promise<ServiceResult<{ paymentId: string }>>`

- [ ] **Step 1: Tulis service**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getByContractId as getWorkByContractId } from "@/modules/work/queries";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type PaymentWithContract = {
  paymentId: string;
  paymentStatus: string;
  contractTalentId: string;
  contractHirerId: string;
  contractStatus: string;
};

async function loadPaymentWithContract(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  contractId: string,
): Promise<ServiceResult<PaymentWithContract>> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, status, contract:contracts(talent_id, hirer_id, status)",
    )
    .eq("contract_id", contractId)
    .maybeSingle();

  if (error) return { data: null, error: { message: error.message } };
  if (!data) {
    return { data: null, error: { message: "Payment tidak ditemukan" } };
  }

  const row = data as unknown as {
    id: string;
    status: string;
    contract: { talent_id: string; hirer_id: string; status: string } | null;
  };

  if (!row.contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }

  return {
    data: {
      paymentId: row.id,
      paymentStatus: row.status,
      contractTalentId: row.contract.talent_id,
      contractHirerId: row.contract.hirer_id,
      contractStatus: row.contract.status,
    },
    error: null,
  };
}

export async function simulatePayment(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ paymentId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadPaymentWithContract(
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
  if (ctx.paymentStatus !== "PENDING") {
    return {
      data: null,
      error: { message: "Payment sudah disimulasikan" },
    };
  }

  const { error } = await supabase
    .from("payments")
    .update({
      status: "SIMULATED_PAID",
      held_at: new Date().toISOString(),
      held_by: hirerId,
    })
    .eq("id", ctx.paymentId);
  if (error) return { data: null, error: { message: error.message } };
  return { data: { paymentId: ctx.paymentId }, error: null };
}

export async function releasePayment(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ paymentId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadPaymentWithContract(
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
  if (ctx.paymentStatus !== "SIMULATED_PAID") {
    return {
      data: null,
      error: { message: "Payment belum disimulasikan" },
    };
  }

  const work = await getWorkByContractId(contractId);
  if (!work) {
    return { data: null, error: { message: "Work tidak ditemukan" } };
  }
  if (work.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Pekerjaan belum selesai" },
    };
  }
  if (!work.hirer_confirmed) {
    return {
      data: null,
      error: { message: "Pekerjaan belum dikonfirmasi hirer" },
    };
  }

  const { error: payError } = await supabase
    .from("payments")
    .update({
      status: "RELEASED",
      released_at: new Date().toISOString(),
      released_by: hirerId,
    })
    .eq("id", ctx.paymentId);
  if (payError) return { data: null, error: { message: payError.message } };

  const { error: contractError } = await supabase
    .from("contracts")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", contractId);
  if (contractError) {
    return {
      data: null,
      error: {
        message: `Dana dirilis namun kontrak gagal diselesaikan: ${contractError.message}`,
      },
    };
  }

  return { data: { paymentId: ctx.paymentId }, error: null };
}
```

Catatan: `loadPaymentWithContract` - helper bersama, pola sama dengan `loadWorkWithContract` modul Work. Urutan cek: ownership → contract ACTIVE → state payment → gate work. `releasePayment` mengimpor `getByContractId` dari modul Work sebagai gate (precedent: modul Contract mengimpor `getConsentDecision` modul Consent; tidak ada siklus karena Work tidak mengimpor Payment). Dua update berurutan non-atomic diterima (spec Decisions); kegagalan update contract setelah payment RELEASED menghasilkan error eksplisit dengan pesan diagnostik.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/payment/service.ts
git commit -m "feat(payment): add payment service with release gate"
```

---

### Task 4: Queries `modules/payment/queries.ts`

**Files:**
- Create: `modules/payment/queries.ts`

**Interfaces:**
- Produces:
  - `type PaymentStatus = "PENDING" | "SIMULATED_PAID" | "RELEASED"`
  - `type PaymentRow = { id, contract_id, amount, currency, status, held_at, released_at, held_by, released_by }`
  - `getByContractId(contractId: string): Promise<PaymentRow | null>` - dipakai blok UI detail contract.
  - `listForContracts(contractIds: string[]): Promise<Map<string, PaymentRow>>` - batch render inline tanpa N+1.

- [ ] **Step 1: Tulis queries**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PaymentStatus = "PENDING" | "SIMULATED_PAID" | "RELEASED";

export type PaymentRow = {
  id: string;
  contract_id: string;
  amount: number | null;
  currency: string;
  status: PaymentStatus;
  held_at: string | null;
  released_at: string | null;
  held_by: string | null;
  released_by: string | null;
};

const PAYMENT_COLUMNS =
  "id, contract_id, amount, currency, status, held_at, released_at, held_by, released_by";

export async function getByContractId(
  contractId: string,
): Promise<PaymentRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("contract_id", contractId)
    .maybeSingle();
  return (data as unknown as PaymentRow) ?? null;
}

export async function listForContracts(
  contractIds: string[],
): Promise<Map<string, PaymentRow>> {
  const map = new Map<string, PaymentRow>();
  if (contractIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .in("contract_id", contractIds);

  for (const p of (data as unknown as PaymentRow[]) ?? []) {
    map.set(p.contract_id, p);
  }
  return map;
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/payment/queries.ts
git commit -m "feat(payment): add payment queries"
```

---

### Task 5: Server Actions `modules/payment/actions.ts`

**Files:**
- Create: `modules/payment/actions.ts`

**Interfaces:**
- Consumes: `simulatePayment`/`releasePayment` (Task 3), `requireRole` dari `@/modules/lib/auth`.
- Produces:
  - `simulatePayment(contractId: string, redirectTo: string): Promise<void>`
  - `releasePayment(contractId: string, redirectTo: string): Promise<void>`
  - Keduanya fire-and-forget `void` - error bisnis silent return; sukses `revalidatePath` + `redirect(redirectTo)` (keputusan 2026-08-29).

- [ ] **Step 1: Tulis actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import {
  simulatePayment as simulatePaymentService,
  releasePayment as releasePaymentService,
} from "./service";

export async function simulatePayment(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await simulatePaymentService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}

export async function releasePayment(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await releasePaymentService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}
```

Catatan: kedua action = HIRER (keputusan user: SIMULATED_PAID dan RELEASED sama-sama aktor HIRER). `redirectTo` disuplai caller. `redirect()` bertipe `never`.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/payment/actions.ts
git commit -m "feat(payment): add payment server actions"
```

---

### Task 6: My Applications (TALENT) - badge payment read-only

**Files:**
- Modify: `app/applications/page.tsx`

**Interfaces:**
- Consumes: `listForContracts` dari `@/modules/payment/queries` (Task 4), map `contracts` yang sudah ada di page (`Map<applicationId, ContractRow>`).
- Produces: blok payment read-only per application (badge status + amount; TALENT tidak punya aksi payment).

- [ ] **Step 1: Tambah import + batch fetch**

```tsx
import { listForContracts } from "@/modules/payment/queries";
```

Setelah fetch works (baris `const works = await listForContracts(...);`):

```tsx
const payments = await listForContracts(
  [...contracts.values()].map((c) => c.id),
);
```

- [ ] **Step 2: Render blok payment di dalam tiap card, setelah blok work**

```tsx
{(() => {
  const contract = contracts.get(a.id);
  if (!contract) return null;
  const payment = payments.get(contract.id);
  if (!payment) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Payment:</span>
        <span className="text-xs bg-gray-100 rounded px-2 py-1">
          {payment.status}
        </span>
        <span className="text-sm text-gray-600">
          Rp {payment.amount ?? "-"}
        </span>
      </div>
      {payment.status === "PENDING" && (
        <p className="text-sm text-gray-600 mt-1">
          Menunggu hirer membayar (simulasi).
        </p>
      )}
      {payment.status === "SIMULATED_PAID" && (
        <p className="text-sm text-blue-700 mt-1">
          Dana ditahan (escrow simulasi) - dirilis setelah pekerjaan
          dikonfirmasi hirer.
        </p>
      )}
      {payment.status === "RELEASED" && (
        <p className="text-sm text-green-700 mt-1">
          Dana dirilis - kontrak selesai.
        </p>
      )}
    </div>
  );
})()}
```

Catatan: read-only untuk TALENT - tidak ada tombol (aksi keduanya HIRER). Payment row ada untuk contract yang pernah ACTIVE; kontrak PENDING_AGREEMENT/TERMINATED tidak punya row → blok senyap.

- [ ] **Step 3: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/applications/
git commit -m "feat(payment): add payment badge to my applications"
```

---

### Task 7: Detail contract - blok payment + aksi HIRER

**Files:**
- Modify: `app/contracts/[id]/page.tsx`

**Interfaces:**
- Consumes: `getByContractId` dari `@/modules/payment/queries` (Task 4, di-alias `getPaymentByContractId`), `simulatePayment`/`releasePayment` (Task 5), `contract` + `work` + `isHirer` + `user` yang sudah ada di page.
- Produces: blok payment (status + amount + waktu + aksi Bayar/Rilis untuk HIRER).

- [ ] **Step 1: Tambah import**

```tsx
import { getByContractId as getPaymentByContractId } from "@/modules/payment/queries";
import {
  simulatePayment,
  releasePayment,
} from "@/modules/payment/actions";
```

- [ ] **Step 2: Fetch payment + render blok**

Setelah `const work = await getByContractId(id);`:

```tsx
const payment = await getPaymentByContractId(id);
```

Tambahkan blok setelah blok work (`{work && (...)}`), sebelum div aksi kontrak:

```tsx
{payment && (
  <div className="mt-3 border rounded p-4 text-sm flex flex-col gap-2">
    <p>
      <span className="font-medium">Payment:</span>{" "}
      <span className="text-xs bg-gray-100 rounded px-2 py-1">
        {payment.status}
      </span>
      <span className="ml-2">Rp {payment.amount ?? "-"}</span>
    </p>
    {payment.held_at && (
      <p className="text-gray-600">
        Ditahan: {new Date(payment.held_at).toLocaleString("id-ID")}
      </p>
    )}
    {payment.released_at && (
      <p className="text-gray-600">
        Dirilis: {new Date(payment.released_at).toLocaleString("id-ID")}
      </p>
    )}
    {isHirer &&
      contract.status === "ACTIVE" &&
      payment.status === "PENDING" && (
        <form
          action={simulatePayment.bind(null, contract.id, `/contracts/${contract.id}`)}
          className="mt-2"
        >
          <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
            Bayar (Simulasi)
          </button>
        </form>
      )}
    {isHirer &&
      contract.status === "ACTIVE" &&
      payment.status === "SIMULATED_PAID" &&
      work?.status === "COMPLETED" &&
      work.hirer_confirmed && (
        <form
          action={releasePayment.bind(null, contract.id, `/contracts/${contract.id}`)}
          className="mt-2"
        >
          <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
            Rilis Dana (Simulasi)
          </button>
        </form>
      )}
    {isHirer &&
      contract.status === "ACTIVE" &&
      payment.status === "SIMULATED_PAID" &&
      !(work?.status === "COMPLETED" && work.hirer_confirmed) && (
        <p className="text-sm text-amber-600">
          Dana ditahan - rilis setelah pekerjaan selesai &amp; dikonfirmasi.
        </p>
      )}
    {payment.status === "RELEASED" && (
      <p className="text-green-700">
        Dana dirilis (simulasi) - kontrak selesai.
      </p>
    )}
  </div>
)}
```

Catatan: `payment` bisa `null` (kontrak belum pernah ACTIVE) → blok tidak render. Aksi hanya HIRER (`isHirer`); TALENT read-only. Tombol release hanya muncul saat gate terpenuhi (`work?.status === "COMPLETED" && work.hirer_confirmed`); service tetap double-check. Setelah RELEASED contract jadi COMPLETED → semua guard `contract.status === "ACTIVE"` otomatis menyembunyikan tombol.

- [ ] **Step 3: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/contracts
git commit -m "feat(payment): add payment block to contract detail"
```

---

### Task 8: Build & typecheck verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: semua PASS tanpa error.

- [ ] **Step 2: E2E smoke manual (2 akun browser)**

Data reuse smoke Work: contract `b8ce8bdc-3fd1-40bd-832d-465c8daac86b` (CNTR-260831-DVA4) status **ACTIVE**, work `COMPLETED` + `hirer_confirmed = true` (hasil smoke Work), payment `PENDING`. Akun: `smoke-talent-consent@example.test` (TALENT pihak kontrak) + `smoke-hirer-consent@example.test` (HIRER), password `Smoke123!`. Dev server: `npm run dev`.

1. HIRER buka `/contracts/b8ce8bdc-3fd1-40bd-832d-465c8daac86b` → blok Payment `PENDING` + tombol **Bayar (Simulasi)** → klik → badge `SIMULATED_PAID` + "Ditahan: <timestamp>".
2. DB: `payments.status = 'SIMULATED_PAID'`, `held_at` terisi, `held_by` = hirer id; `released_at` masih NULL.
3. Double-transisi: tombol **Bayar** hilang; service `simulatePayment` menolak panggilan kedua ("Payment sudah disimulasikan") - verifikasi UI (tombol hilang) + code path.
4. Rilis gate sukses (work COMPLETED + confirmed): tombol **Rilis Dana (Simulasi)** muncul → klik → badge `RELEASED` + "Dana dirilis (simulasi) - kontrak selesai".
5. DB: `payments.status = 'RELEASED'`, `released_at`/`released_by` terisi; **`contracts.status = 'COMPLETED'` + `completed_at` terisi** (side effect).
6. Gate-fail path: reset state via SQL `update works set hirer_confirmed = false where contract_id = 'b8ce8bdc-...';` + `update payments set status = 'SIMULATED_PAID' ...` (jaga payment tetap SIMULATED_PAID) → HIRER reload detail → tombol **Rilis** TIDAK muncul (hint biru "rilis setelah pekerjaan selesai & dikonfirmasi") → restore confirm work via UI → tombol release muncul lagi.
7. RLS via REST: TALENT pihak kontrak SELECT `/rest/v1/payments?contract_id=eq.b8ce8bdc-...` → 1 row (involved); TALENT asing SELECT → `[]`; PATCH payments oleh talent → 0 rows / 42501 (`payments_update_hirer` hanya hirer).
8. UI TALENT: badge payment read-only di `/applications` (PENDING → SIMULATED_PAID → RELEASED) tanpa N+1 (1 query batch `listForContracts`).

- [ ] **Step 3: Commit (jika ada perbaikan)**

```bash
git add -A
git commit -m "fix(payment): address smoke test findings"
```

---

### Task 9: Update `docs/PROGRESS.md`

- [ ] **Step 1: Update progress**

- Tambah "Module Payment" ke "Sudah Selesai" (Task 1-8).
- Decision Log tambah:
  - `2026-08-31: Payment SIMULATED_PAID & RELEASED aktor = HIRER (API-SPEC 12.3/12.4); admin read-only`
  - `2026-08-31: Contract COMPLETED = side effect modul Payment saat RELEASED (satu-satunya jalur); jalur non-atomik dua update diterima (simulated escrow)`
  - `2026-08-31: RLS payments UPDATE = hirer-only (kedua transisi aktor HIRER); talent read-only di level RLS`
  - `2026-08-31: Notification side effect payment defer (modul Notification terpisah); audit via held_by/released_by`
- Status terakhir: Sprint 9 - Module Payment selesai; next: Rating (gate work COMPLETED) atau Verified Work History.

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update progress payment module"
```

---

## Self-Review Notes

- **Spec coverage:** RLS (Task 1), schemas (Task 2), service simulate/release + side effect contract COMPLETED (Task 3), queries (Task 4), actions + redirectTo (Task 5), UI TALENT badge (Task 6), UI detail contract + aksi HIRER (Task 7), verification + smoke + RLS (Task 8), progress (Task 9). Acceptance criteria spec: AC 1 → Task 3+7 (simulate gate), AC 2 → Task 3+7 (release gate + hint), AC 3 → Task 3 side effect + smoke step 5, AC 4 → constraint + Task 3, AC 5 → Task 1 + smoke step 7, AC 6 → Task 6+7, AC 7 → Task 8 Step 1.
- **Placeholder scan:** tidak ada TBD/TODO; service lengkap dengan helper `loadPaymentWithContract`; actions menerima `redirectTo` (pola redirect balik); semua kode lengkap.
- **Type consistency:** `ServiceResult`, `PaymentRow`, `PaymentStatus`, `getByContractId` (payment), `listForContracts` (payment), signatures `simulatePayment(hirerId, contractId)` / `releasePayment(hirerId, contractId)` konsisten dipakai Task 5-7. Action names `simulatePayment`/`releasePayment` (void, 2 param: contractId + redirectTo) konsisten di Task 7 UI. Gate konsumsi `WorkRow.status`/`WorkRow.hirer_confirmed` dari modul Work (`getByContractId`) - sudah live, tanpa perubahan modul Work.
