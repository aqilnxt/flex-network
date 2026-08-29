# Contract Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HIRER membuat contract (DRAFT) untuk application SELECTED yang lolos gate Meeting COMPLETED + Consent eligible, lalu propose (PENDING_AGREEMENT, auto-agree hirer) → agree kedua pihak → ACTIVE (seed `payments` PENDING + `works` NOT_STARTED), atau decline → TERMINATED.

**Architecture:** Modular monolith pattern yang sama dengan modul Meeting/Consent: `modules/contract/` (schemas → queries → service → actions) di atas tabel `contracts` yang sudah live (tanpa perubahan skema). Gate eligibility dievaluasi server-side di service (application SELECTED + meeting COMPLETED via query langsung + consent via `getConsentDecision` dari modul Consent). Side effects ACTIVE: insert `payments` + `works` dalam service (RLS seed policy baru). RLS granular baru di migration `012`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (server client + RLS), Zod, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-08-29-contract-module-design.md`

## Global Constraints

- Status canonical contract: `DRAFT / PENDING_AGREEMENT / ACTIVE / COMPLETED / TERMINATED` (CHECK constraint DB, jangan diubah). Modul ini TIDAK pernah menulis `COMPLETED` — status itu dicapai lewat alur Work (sprint berikutnya).
- Eligibility create (A.19): application `SELECTED` AND meeting `COMPLETED` AND (`!required || consent === APPROVED`) AND belum ada contract untuk application. Evaluasi server-side di service; RLS insert policy = defense-in-depth.
- `propose` = auto-agree HIRER (`hirer_agreed=true`, `hirer_agreed_at`) — keputusan spec 2026-08-29.
- `ACTIVE` hanya jika `talent_agreed && hirer_agreed`; saat transisi ke ACTIVE service insert `payments` (status PENDING, amount = compensation, currency IDR) + `works` (status NOT_STARTED).
- `decline` hanya dari `PENDING_AGREEMENT` → `TERMINATED` (terminal); `decline_reason` opsional (UI MVP tidak ada input reason → null).
- `contract_number` generate server-side: `CNTR-{yymmdd}-{4 char A-Z0-9 tanpa karakter ambigu}`.
- Edit hanya saat DRAFT, hanya oleh HIRER owner.
- `ACTIVE` dan `TERMINATED` terminal — tidak ada transisi keluar di modul ini.
- Validasi semua input via Zod di server; ownership + gate check sebelum setiap mutation.
- Migration tidak mengubah skema tabel (kolom `contracts`, `payments`, `works` sudah live di 001).
- Verifikasi project: `npx tsc --noEmit`, `npm run lint`, `npm run build` (tidak ada test framework).
- Commit format: `type(scope): deskripsi imperative lowercase` (lihat `/GIT_COMMIT.md`).

---

### Task 1: Migration `012_contract_rls.sql` + push

**Files:**
- Create: `supabase/migrations/012_contract_rls.sql`

**Interfaces:**
- Consumes: tabel `contracts` (001, RLS enabled default-deny tanpa policy), tabel `payments`/`works` (001), helper `is_admin()` (006).
- Produces: RLS aktif granular pada `contracts` — SELECT involved/admin, INSERT hirer gated, UPDATE involved; INSERT seed policies pada `payments`/`works`.

- [ ] **Step 1: Tulis migration**

```sql
-- 012_contract_rls.sql — granular policies untuk contracts + seed payments/works
-- Baseline 003: RLS enabled, default-deny, tanpa policy.

-- SELECT: talent, hirer, admin
create policy "contracts_select_involved"
  on public.contracts for select to authenticated
  using (
    talent_id = auth.uid()
    or hirer_id = auth.uid()
    or is_admin()
  );

-- INSERT: hirer owner; application SELECTED + meeting COMPLETED (defense-in-depth; service cek gate lengkap dulu)
create policy "contracts_insert_hirer"
  on public.contracts for insert to authenticated
  with check (
    hirer_id = auth.uid()
    and exists (
      select 1 from public.applications a
      join public.meetings m on m.application_id = a.id
      where a.id = application_id
        and a.status = 'SELECTED'
        and m.status = 'COMPLETED'
    )
  );

-- UPDATE: talent/hirer involved (transisi propose/agree/decline; edit DRAFT di-enforce service)
create policy "contracts_update_involved"
  on public.contracts for update to authenticated
  using (talent_id = auth.uid() or hirer_id = auth.uid())
  with check (talent_id = auth.uid() or hirer_id = auth.uid());

-- Seed insert: payment dibuat oleh pihak kontrak saat contract ACTIVE (side effects agree)
create policy "payments_insert_seed"
  on public.payments for insert to authenticated
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.status = 'ACTIVE'
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );

-- Seed insert: works row saat contract ACTIVE
create policy "works_insert_seed"
  on public.works for insert to authenticated
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.status = 'ACTIVE'
        and (c.talent_id = auth.uid() or c.hirer_id = auth.uid())
    )
  );
```

Catatan: tidak ada policy DELETE untuk contracts/payments/works (tidak ada use case; cascade dari applications cukup). SELECT/UPDATE untuk payments/works ditambah modul Payment/Work nanti.

- [ ] **Step 2: Push ke Supabase**

Run: `supabase db push`
Expected: migration applied.

- [ ] **Step 3: Verifikasi policy**

Run: `supabase db query --linked "select tablename, policyname, cmd from pg_policies where tablename in ('contracts','payments','works') order by tablename, policyname;"`
Expected: 5 rows — `contracts_insert_hirer` (INSERT), `contracts_update_involved` (UPDATE), `contracts_select_involved` (SELECT), `payments_insert_seed` (INSERT), `works_insert_seed` (INSERT).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/012_contract_rls.sql
git commit -m "feat(db): add contracts and seed payments works rls policies"
```

---

### Task 2: Schemas `modules/contract/schemas.ts`

**Files:**
- Create: `modules/contract/schemas.ts`

**Interfaces:**
- Produces: `createContractSchema`, `CreateContractInput`, `updateContractSchema`, `UpdateContractInput` (semua `z.infer`).

- [ ] **Step 1: Tulis schema**

```ts
import { z } from "zod";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .optional()
    .or(z.literal(""));

export const createContractSchema = z.object({
  applicationId: z.string().uuid("Application tidak valid"),
  roleTitle: z
    .string()
    .trim()
    .min(3, "Judul peran minimal 3 karakter")
    .max(120, "Judul peran maksimal 120 karakter"),
  description: optionalText(2000, "Deskripsi"),
  responsibilities: optionalText(2000, "Tanggung jawab"),
  duration: optionalText(100, "Durasi"),
  location: optionalText(120, "Lokasi"),
  compensation: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int("Kompensasi tidak valid")
        .min(0, "Kompensasi tidak boleh negatif")
        .max(2_000_000_000, "Kompensasi terlalu besar"),
    ])
    .optional(),
  termsConditions: optionalText(2000, "Syarat & ketentuan"),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema
  .omit({ applicationId: true })
  .partial();

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
```

Catatan: tidak menerima `status`, `*agreed`, `*agreed_at`, `proposed_*`, `activated_at`, `terminated_at`, `decline_reason` dari client — semua diatur service. Zod strip membuang field tak dikenal.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/contract/schemas.ts
git commit -m "feat(contract): add contract schemas"
```

---

### Task 3: Service `modules/contract/service.ts`

**Files:**
- Create: `modules/contract/service.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (dari `@/lib/supabase/server`), `CreateContractInput`/`UpdateContractInput` (Task 2), `getConsentDecision` dari `@/modules/consent/queries`.
- Produces:
  - `type ServiceResult<T = unknown> = { data: T | null; error: { message: string } | null }`
  - `createContract(hirerId: string, input: CreateContractInput): Promise<ServiceResult<{ contractId: string }>>`
  - `updateContract(hirerId: string, contractId: string, input: UpdateContractInput): Promise<ServiceResult<{ contractId: string }>>`
  - `propose(hirerId: string, contractId: string): Promise<ServiceResult<{ contractId: string }>>`
  - `agree(userId: string, contractId: string): Promise<ServiceResult<{ contractId: string }>>`
  - `decline(userId: string, contractId: string, reason: string | null): Promise<ServiceResult<{ contractId: string }>>`

- [ ] **Step 1: Tulis service**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getConsentDecision } from "@/modules/consent/queries";
import type { CreateContractInput, UpdateContractInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

function generateContractNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CNTR-${yy}${mm}${dd}-${suffix}`;
}

type ContractRow = {
  id: string;
  application_id: string;
  opportunity_id: string;
  talent_id: string;
  hirer_id: string;
  status: string;
  compensation: number | null;
};

async function loadOwnedContract(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  contractId: string,
): Promise<ServiceResult<ContractRow>> {
  const { data: contract } = await supabase
    .from("contracts")
    .select(
      "id, application_id, opportunity_id, talent_id, hirer_id, status, compensation",
    )
    .eq("id", contractId)
    .single();

  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.talent_id !== userId && contract.hirer_id !== userId) {
    return { data: null, error: { message: "Not involved" } };
  }
  return { data: contract as unknown as ContractRow, error: null };
}

export async function createContract(
  hirerId: string,
  input: CreateContractInput,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, talent_id, opportunity_id")
    .eq("id", input.applicationId)
    .single();

  if (!application) {
    return { data: null, error: { message: "Application tidak ditemukan" } };
  }
  if (application.status !== "SELECTED") {
    return {
      data: null,
      error: { message: "Kontrak hanya bisa dibuat untuk application SELECTED" },
    };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, hirer_id")
    .eq("id", application.opportunity_id)
    .single();

  if (!opportunity || opportunity.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("status")
    .eq("application_id", input.applicationId)
    .maybeSingle();

  if (!meeting || meeting.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Meeting harus COMPLETED sebelum kontrak bisa dibuat" },
    };
  }

  const decision = await getConsentDecision(input.applicationId);
  if (decision.required && decision.status !== "APPROVED") {
    const reason =
      decision.status === "PENDING"
        ? "Consent wali masih menunggu persetujuan"
        : decision.status === "REJECTED"
          ? "Consent wali ditolak"
          : "Consent wali belum diajukan";
    return { data: null, error: { message: `Kontrak diblokir: ${reason}` } };
  }

  const { data: existing } = await supabase
    .from("contracts")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();
  if (existing) {
    return { data: null, error: { message: "Kontrak sudah dibuat" } };
  }

  const { data: created, error } = await supabase
    .from("contracts")
    .insert({
      application_id: input.applicationId,
      opportunity_id: application.opportunity_id,
      talent_id: application.talent_id,
      hirer_id: hirerId,
      contract_number: generateContractNumber(),
      role_title: input.roleTitle,
      description: input.description || null,
      responsibilities: input.responsibilities || null,
      duration: input.duration || null,
      location: input.location || null,
      compensation: input.compensation ?? null,
      terms_conditions: input.termsConditions || null,
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Kontrak sudah dibuat" } };
    }
    return { data: null, error: { message: error.message } };
  }

  return { data: { contractId: (created as { id: string }).id }, error: null };
}

export async function updateContract(
  hirerId: string,
  contractId: string,
  input: UpdateContractInput,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, hirer_id, status")
    .eq("id", contractId)
    .single();

  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (contract.status !== "DRAFT") {
    return { data: null, error: { message: "Hanya kontrak DRAFT yang bisa diedit" } };
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      role_title: input.roleTitle,
      description: input.description || null,
      responsibilities: input.responsibilities || null,
      duration: input.duration || null,
      location: input.location || null,
      compensation: input.compensation ?? null,
      terms_conditions: input.termsConditions || null,
    })
    .eq("id", contractId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { contractId }, error: null };
}

export async function propose(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, hirer_id, status")
    .eq("id", contractId)
    .single();

  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (contract.status !== "DRAFT") {
    return {
      data: null,
      error: { message: "Hanya kontrak DRAFT yang bisa diajukan" },
    };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("contracts")
    .update({
      status: "PENDING_AGREEMENT",
      proposed_at: now,
      proposed_by: hirerId,
      hirer_agreed: true,
      hirer_agreed_at: now,
    })
    .eq("id", contractId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { contractId }, error: null };
}

export async function agree(
  userId: string,
  contractId: string,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract, error: ownedError } = await loadOwnedContract(
    supabase,
    userId,
    contractId,
  );
  if (ownedError || !contract) return { data: null, error: ownedError };

  if (contract.status !== "PENDING_AGREEMENT") {
    return {
      data: null,
      error: { message: "Hanya kontrak PENDING_AGREEMENT yang bisa disetujui" },
    };
  }

  const { data: current } = await supabase
    .from("contracts")
    .select("talent_agreed, hirer_agreed, talent_id, hirer_id")
    .eq("id", contractId)
    .single();

  if (!current) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  const isTalent = current.talent_id === userId;
  const alreadyAgreed = isTalent ? current.talent_agreed : current.hirer_agreed;
  if (alreadyAgreed) {
    return { data: null, error: { message: "Anda sudah menyetujui kontrak ini" } };
  }

  const now = new Date().toISOString();
  const nextTalentAgreed = isTalent ? true : current.talent_agreed;
  const nextHirerAgreed = isTalent ? current.hirer_agreed : true;
  const willActivate = nextTalentAgreed && nextHirerAgreed;

  const { error: updateError } = await supabase
    .from("contracts")
    .update(
      isTalent
        ? { talent_agreed: true, talent_agreed_at: now }
        : { hirer_agreed: true, hirer_agreed_at: now },
    )
    .eq("id", contractId);
  if (updateError) return { data: null, error: { message: updateError.message } };

  if (willActivate) {
    const { error: activateError } = await supabase
      .from("contracts")
      .update({ status: "ACTIVE", activated_at: now })
      .eq("id", contractId);
    if (activateError) return { data: null, error: { message: activateError.message } };

    const { error: paymentError } = await supabase.from("payments").insert({
      contract_id: contractId,
      amount: contract.compensation,
      currency: "IDR",
      status: "PENDING",
    });
    if (paymentError && paymentError.code !== "23505") {
      return { data: null, error: { message: paymentError.message } };
    }

    const { error: workError } = await supabase.from("works").insert({
      contract_id: contractId,
      status: "NOT_STARTED",
    });
    if (workError && workError.code !== "23505") {
      return { data: null, error: { message: workError.message } };
    }
  }

  return { data: { contractId }, error: null };
}

export async function decline(
  userId: string,
  contractId: string,
  reason: string | null,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract, error: ownedError } = await loadOwnedContract(
    supabase,
    userId,
    contractId,
  );
  if (ownedError || !contract) return { data: null, error: ownedError };

  if (contract.status !== "PENDING_AGREEMENT") {
    return {
      data: null,
      error: { message: "Hanya kontrak PENDING_AGREEMENT yang bisa ditolak" },
    };
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      status: "TERMINATED",
      terminated_at: new Date().toISOString(),
      decline_reason: reason,
    })
    .eq("id", contractId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { contractId }, error: null };
}
```

Catatan: `loadOwnedContract(supabase, userId, contractId)` — helper pembuka Task 3 (cek row ada + `talent_id`/`hirer_id` melibatkan `userId`); semua service function menerima `supabase` sebagai argumen pertama seperti `loadConsentContext` di modul Consent. Nama variabel akhir di `agree`: `nextTalentAgreed`, `nextHirerAgreed`, `willActivate`, `updateError`.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/contract/service.ts
git commit -m "feat(contract): add contract service with state machine and seed side effects"
```

---

### Task 4: Queries `modules/contract/queries.ts`

**Files:**
- Create: `modules/contract/queries.ts`

**Interfaces:**
- Produces:
  - `type ContractStatus = "DRAFT" | "PENDING_AGREEMENT" | "ACTIVE" | "COMPLETED" | "TERMINATED"`
  - `type ContractRow = { id, application_id, opportunity_id, talent_id, hirer_id, contract_number, role_title, description, responsibilities, duration, location, compensation, terms_conditions, status, proposed_at, talent_agreed, hirer_agreed, talent_agreed_at, hirer_agreed_at, activated_at, terminated_at, decline_reason }`
  - `type ContractDetail = ContractRow & { opportunity_title: string | null }`
  - `getById(contractId: string): Promise<ContractDetail | null>` — detail page.
  - `getByApplicationId(applicationId: string): Promise<ContractRow | null>` — **single call gate modul Work**: work boleh mulai iff row ada && `status === "ACTIVE"`; `works` row sudah di-seed service contract.
  - `listForTalent(talentId: string): Promise<ContractRow[]>`
  - `listForHirer(hirerId: string): Promise<ContractRow[]>`
  - `listForApplications(applicationIds: string[]): Promise<Map<string, ContractRow>>` — batch render tanpa N+1.

- [ ] **Step 1: Tulis queries**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContractStatus =
  | "DRAFT"
  | "PENDING_AGREEMENT"
  | "ACTIVE"
  | "COMPLETED"
  | "TERMINATED";

export type ContractRow = {
  id: string;
  application_id: string;
  opportunity_id: string;
  talent_id: string;
  hirer_id: string;
  contract_number: string | null;
  role_title: string | null;
  description: string | null;
  responsibilities: string | null;
  duration: string | null;
  location: string | null;
  compensation: number | null;
  terms_conditions: string | null;
  status: ContractStatus;
  proposed_at: string | null;
  talent_agreed: boolean;
  hirer_agreed: boolean;
  talent_agreed_at: string | null;
  hirer_agreed_at: string | null;
  activated_at: string | null;
  terminated_at: string | null;
  decline_reason: string | null;
};

export type ContractDetail = ContractRow & {
  opportunity_title: string | null;
};

const CONTRACT_COLUMNS =
  "id, application_id, opportunity_id, talent_id, hirer_id, contract_number, role_title, description, responsibilities, duration, location, compensation, terms_conditions, status, proposed_at, talent_agreed, hirer_agreed, talent_agreed_at, hirer_agreed_at, activated_at, terminated_at, decline_reason";

export async function getById(
  contractId: string,
): Promise<ContractDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      `${CONTRACT_COLUMNS}, opportunity:opportunities(title)`,
    )
    .eq("id", contractId)
    .maybeSingle();

  const row = data as unknown as
    | (ContractRow & { opportunity: { title: string } | null })
    | null;
  if (!row) return null;
  return {
    ...row,
    opportunity_title: row.opportunity?.title ?? null,
  };
}

export async function getByApplicationId(
  applicationId: string,
): Promise<ContractRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("application_id", applicationId)
    .maybeSingle();
  return (data as unknown as ContractRow) ?? null;
}

export async function listForTalent(
  talentId: string,
): Promise<ContractRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });
  return (data as unknown as ContractRow[]) ?? [];
}

export async function listForHirer(
  hirerId: string,
): Promise<ContractRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("hirer_id", hirerId)
    .order("created_at", { ascending: false });
  return (data as unknown as ContractRow[]) ?? [];
}

export async function listForApplications(
  applicationIds: string[],
): Promise<Map<string, ContractRow>> {
  const map = new Map<string, ContractRow>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .in("application_id", applicationIds);

  for (const c of (data as unknown as ContractRow[]) ?? []) {
    map.set(c.application_id, c);
  }
  return map;
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/contract/queries.ts
git commit -m "feat(contract): add contract queries with work gate"
```

---

### Task 5: Server Actions `modules/contract/actions.ts`

**Files:**
- Create: `modules/contract/actions.ts`

**Interfaces:**
- Consumes: `createContractSchema`/`updateContractSchema` (Task 2), service `createContract`/`updateContract`/`propose`/`agree`/`decline` (Task 3), `requireUser`, `requireRole` dari `@/modules/lib/auth`, `ActionResult` dari `@/lib/result`.
- Produces:
  - `createContract(_prev: ActionResult | null, formData: FormData): Promise<ActionResult>` (useActionState; data: `{ contractId: string }`)
  - `updateContractAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult>`
  - `proposeContract(contractId: string): Promise<void>`
  - `agreeContract(contractId: string): Promise<void>`
  - `declineContract(contractId: string): Promise<void>`

- [ ] **Step 1: Tulis actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireUser, requireRole } from "@/modules/lib/auth";
import {
  createContractSchema,
  updateContractSchema,
} from "./schemas";
import {
  createContract as createContractService,
  updateContract as updateContractService,
  propose as proposeService,
  agree as agreeService,
  decline as declineService,
} from "./service";

export async function createContract(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");

  const parsed = createContractSchema.safeParse({
    applicationId: formData.get("applicationId") ?? "",
    roleTitle: formData.get("roleTitle") ?? "",
    description: formData.get("description") ?? "",
    responsibilities: formData.get("responsibilities") ?? "",
    duration: formData.get("duration") ?? "",
    location: formData.get("location") ?? "",
    compensation: formData.get("compensation") ?? "",
    termsConditions: formData.get("termsConditions") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          parsed.error.issues[0]?.message ?? "Data yang dikirim tidak valid.",
      },
    };
  }

  const { data, error } = await createContractService(user.id, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "CONTRACT_ERROR", message: error.message },
    };
  }

  revalidatePath("/applications");
  redirect(`/contracts/${data.contractId}`);
}

export async function updateContractAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const contractId = String(formData.get("contractId") ?? "");
  const parsed = updateContractSchema.safeParse({
    roleTitle: formData.get("roleTitle") ?? "",
    description: formData.get("description") ?? "",
    responsibilities: formData.get("responsibilities") ?? "",
    duration: formData.get("duration") ?? "",
    location: formData.get("location") ?? "",
    compensation: formData.get("compensation") ?? "",
    termsConditions: formData.get("termsConditions") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          parsed.error.issues[0]?.message ?? "Data yang dikirim tidak valid.",
      },
    };
  }

  const { error } = await updateContractService(user.id, contractId, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "CONTRACT_ERROR", message: error.message },
    };
  }

  revalidatePath(`/contracts/${contractId}`);
  redirect(`/contracts/${contractId}`);
}

export async function proposeContract(contractId: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await proposeService(user.id, contractId);
  if (error) return;
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/applications");
  redirect(`/contracts/${contractId}`);
}

export async function agreeContract(contractId: string): Promise<void> {
  const user = await requireUser();
  const { error } = await agreeService(user.id, contractId);
  if (error) return;
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/applications");
  redirect(`/contracts/${contractId}`);
}

export async function declineContract(contractId: string): Promise<void> {
  const user = await requireUser();
  const { error } = await declineService(user.id, contractId, null);
  if (error) return;
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/applications");
  redirect(`/contracts/${contractId}`);
}
```

Catatan: `createContract`/`proposeContract` pakai `requireRole("HIRER")`; `agreeContract`/`declineContract` pakai `requireUser` (TALENT dan HIRER). `redirect()` bertipe `never` — tidak butuh return setelahnya.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/contract/actions.ts
git commit -m "feat(contract): add contract server actions"
```

---

### Task 6: Form create + edit contract (client components)

**Files:**
- Create: `app/hirer/opportunities/[id]/applications/contract-create-form.tsx`
- Create: `app/contracts/[id]/edit/contract-edit-form.tsx`

**Interfaces:**
- Consumes: `createContract` / `updateContractAction` (Task 5).
- Produces: `<ContractCreateForm applicationId={string} />` (dipakai Task 7), `<ContractEditForm contractId={string} initial={{ roleTitle, description, responsibilities, duration, location, compensation }} />` (dipakai Task 8).

- [ ] **Step 1: Tulis create form**

```tsx
"use client";

import { useActionState } from "react";
import { createContract } from "@/modules/contract/actions";

export function ContractCreateForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createContract, null);

  return (
    <form action={action} className="mt-3 border-t pt-3 flex flex-col gap-2">
      <p className="text-sm font-medium">Buat Kontrak (DRAFT)</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input
        name="roleTitle"
        placeholder="Judul peran (mis. Frontend Developer Intern)"
        required
        minLength={3}
        maxLength={120}
        className="border rounded px-3 py-1"
      />
      <textarea
        name="description"
        placeholder="Deskripsi pekerjaan (opsional)"
        maxLength={2000}
        className="border rounded px-3 py-2"
      />
      <textarea
        name="responsibilities"
        placeholder="Tanggung jawab (opsional)"
        maxLength={2000}
        className="border rounded px-3 py-2"
      />
      <div className="flex flex-wrap gap-2">
        <input
          name="duration"
          placeholder="Durasi (mis. 3 bulan)"
          maxLength={100}
          className="border rounded px-3 py-1"
        />
        <input
          name="location"
          placeholder="Lokasi (opsional)"
          maxLength={120}
          className="border rounded px-3 py-1"
        />
        <input
          name="compensation"
          type="number"
          min={0}
          placeholder="Kompensasi (Rp, opsional)"
          className="border rounded px-3 py-1"
        />
      </div>
      <textarea
        name="termsConditions"
        placeholder="Syarat & ketentuan (opsional)"
        maxLength={2000}
        className="border rounded px-3 py-2"
      />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-1 self-start disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Draft"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Tulis edit form**

```tsx
"use client";

import { useActionState } from "react";
import { updateContractAction } from "@/modules/contract/actions";

export function ContractEditForm({
  contractId,
  initial,
}: {
  contractId: string;
  initial: {
    roleTitle: string;
    description: string;
    responsibilities: string;
    duration: string;
    location: string;
    compensation: string;
    termsConditions: string;
  };
}) {
  const [state, action, pending] = useActionState(updateContractAction, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="contractId" value={contractId} />
      <div>
        <label className="text-sm font-medium">Judul Peran</label>
        <input
          name="roleTitle"
          defaultValue={initial.roleTitle}
          required
          minLength={3}
          maxLength={120}
          className="border rounded px-3 py-1 w-full"
        />
      </div>
      <div>
        <label className="text-sm">Deskripsi</label>
        <textarea
          name="description"
          defaultValue={initial.description}
          maxLength={2000}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      <div>
        <label className="text-sm">Tanggung Jawab</label>
        <textarea
          name="responsibilities"
          defaultValue={initial.responsibilities}
          maxLength={2000}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          name="duration"
          placeholder="Durasi (mis. 3 bulan)"
          defaultValue={initial.duration}
          maxLength={100}
          className="border rounded px-3 py-1"
        />
        <input
          name="location"
          placeholder="Lokasi"
          defaultValue={initial.location}
          maxLength={120}
          className="border rounded px-3 py-1"
        />
        <input
          name="compensation"
          type="number"
          placeholder="Kompensasi (Rp)"
          defaultValue={initial.compensation}
          className="border rounded px-3 py-1"
        />
      </div>
      <div>
        <label className="text-sm">Syarat & Ketentuan</label>
        <textarea
          name="termsConditions"
          defaultValue={initial.termsConditions}
          maxLength={2000}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-1 self-start disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
```

Catatan: `createContract` action meng-`redirect("/contracts/{id}")` saat sukses — `useActionState` tetap aman (redirect di-handle framework).

- [ ] **Step 3: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/hirer/opportunities/\[id\]/applications/contract-create-form.tsx app/contracts
git commit -m "feat(contract): add contract create and edit forms"
```

---

### Task 7: Detail contract page + aksi agree/decline/propose

**Files:**
- Create: `app/contracts/[id]/page.tsx`
- Create: `app/contracts/[id]/edit/page.tsx`
- Create: `app/contracts/[id]/edit/contract-edit-form.tsx`

**Interfaces:**
- Consumes: `getById` (Task 4), `proposeContract`/`agreeContract`/`declineContract` (Task 5), `requireUser`, `requireRole` (`@/modules/lib/auth`), `ContractEditForm` (Task 6).
- Produces: halaman detail kontrak dengan tombol kondisional per status/role + halaman edit DRAFT.

- [ ] **Step 1: Tulis page**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { getById } from "@/modules/contract/queries";
import {
  proposeContract,
  agreeContract,
  declineContract,
} from "@/modules/contract/actions";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const contract = await getById(id);

  if (!contract) notFound();

  const isHirer = contract.hirer_id === user.id;
  const canAgree =
    contract.status === "PENDING_AGREEMENT" &&
    ((isHirer && !contract.hirer_agreed) ||
      (!isHirer && !contract.talent_agreed));

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/applications" className="text-blue-600 text-sm">
        ← Kembali
      </Link>
      <h1 className="text-2xl font-bold mt-2">
        {contract.role_title ?? "Kontrak"}
      </h1>
      <p className="text-sm text-gray-600">
        {contract.contract_number ?? "-"} ·{" "}
        <span className="text-xs bg-gray-100 rounded px-2 py-1">
          {contract.status}
        </span>
      </p>

      <div className="mt-4 border rounded p-4 flex flex-col gap-2 text-sm">
        <p>
          <span className="font-medium">Opportunity:</span>{" "}
          {contract.opportunity_title ?? "-"}
        </p>
        {contract.description && (
          <p>
            <span className="font-medium">Deskripsi:</span> {contract.description}
          </p>
        )}
        {contract.responsibilities && (
          <p>
            <span className="font-medium">Tanggung jawab:</span>{" "}
            {contract.responsibilities}
          </p>
        )}
        {contract.duration && (
          <p>
            <span className="font-medium">Durasi:</span> {contract.duration}
          </p>
        )}
        {contract.location && (
          <p>
            <span className="font-medium">Lokasi:</span> {contract.location}
          </p>
        )}
        {contract.compensation != null && (
          <p>
            <span className="font-medium">Kompensasi:</span> Rp {contract.compensation}
          </p>
        )}
        {contract.terms_conditions && (
          <p>
            <span className="font-medium">Syarat & Ketentuan:</span>{" "}
            {contract.terms_conditions}
          </p>
        )}
        <div className="flex gap-4 mt-2 text-sm">
          <span>
            Talent: {contract.talent_agreed ? "✔ setuju" : "belum"}
          </span>
          <span>Hirer: {contract.hirer_agreed ? "✔ setuju" : "belum"}</span>
        </div>
        {contract.status === "TERMINATED" && contract.decline_reason && (
          <p className="text-gray-600">Alasan: {contract.decline_reason}</p>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {isHirer && contract.status === "DRAFT" && (
          <>
            <Link
              href={`/contracts/${contract.id}/edit`}
              className="bg-gray-200 rounded px-3 py-1 text-sm"
            >
              Edit
            </Link>
            <form action={proposeContract.bind(null, contract.id)}>
              <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
                Ajukan ke Talent
              </button>
            </form>
          </>
        )}
        {contract.status === "PENDING_AGREEMENT" && (
          <>
            {canAgree ? (
              <form action={agreeContract.bind(null, contract.id)}>
                <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                  Setujui Kontrak
                </button>
              </form>
            ) : null}
            <form action={declineContract.bind(null, contract.id)}>
              <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">
                Tolak Kontrak
              </button>
            </form>
          </>
        )}
        {contract.status === "ACTIVE" && (
          <p className="text-sm text-green-700">
            Kontrak aktif — payment & work otomatis disiapkan.
          </p>
        )}
      </div>
    </div>
  );
}
```

Catatan: `isHirer` dipakai untuk membedakan pihak; talent yang bukan pihak kontrak diblok RLS (row tidak terlihat → notFound).

- [ ] **Step 2: Tulis edit page**

`app/contracts/[id]/edit/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import { getById } from "@/modules/contract/queries";
import { ContractEditForm } from "./contract-edit-form";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("HIRER");
  const { id } = await params;
  const contract = await getById(id);

  if (!contract || contract.hirer_id !== user.id) notFound();
  if (contract.status !== "DRAFT") notFound();

  return (
    <div className="p-8 max-w-2xl">
      <Link href={`/contracts/${contract.id}`} className="text-blue-600 text-sm">
        ← Kembali
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Edit Kontrak</h1>
      <ContractEditForm
        contractId={contract.id}
        initial={{
          roleTitle: contract.role_title ?? "",
          description: contract.description ?? "",
          responsibilities: contract.responsibilities ?? "",
          duration: contract.duration ?? "",
          location: contract.location ?? "",
          compensation: contract.compensation != null ? String(contract.compensation) : "",
          termsConditions: contract.terms_conditions ?? "",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/contracts modules/contract/actions.ts
git commit -m "feat(contract): add contract detail and edit pages"
```

---

### Task 8: Hirer applicant list — tombol buat kontrak + link kontrak

**Files:**
- Modify: `app/hirer/opportunities/[id]/applications/page.tsx`

**Interfaces:**
- Consumes: `listForApplications` (Task 4), `ContractCreateForm` (Task 6).
- Produces: blok kontrak per application (form create saat SELECTED + meeting COMPLETED + belum ada kontrak; link detail bila ada).

- [ ] **Step 1: Tambah import + batch fetch**

```tsx
import { listForApplications as listContractsForApplications } from "@/modules/contract/queries";
import { ContractCreateForm } from "./contract-create-form";

// setelah fetch meetings + consents:
const contracts = await listContractsForApplications(
  (applications ?? []).map((a) => a.id),
);
```

- [ ] **Step 2: Render IIFE setelah blok consent**

```tsx
{(() => {
  const contract = contracts.get(a.id);
  if (a.status !== "SELECTED") return null;
  if (contract) {
    return (
      <div className="mt-3 border-t pt-3 text-sm">
        Kontrak:{" "}
        <span className="text-xs bg-gray-100 rounded px-2 py-1">
          {contract.status}
        </span>{" "}
        <Link href={`/contracts/${contract.id}`} className="text-blue-600">
          Lihat detail
        </Link>
      </div>
    );
  }
  const meeting = meetings.get(a.id);
  if (meeting?.status !== "COMPLETED") return null;
  return <ContractCreateForm applicationId={a.id} />;
})()}
```

Catatan: form create hanya muncul saat SELECTED + meeting COMPLETED + belum ada kontrak. Gate consent dievaluasi service saat submit (error message jelas). Tidak ada tombol saat DRAFT/PENDING_AGREEMENT dsb — kontrak dikelola di detail page.

- [ ] **Step 2b: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/hirer/opportunities/[id]/applications/"
git commit -m "feat(contract): add contract creation to applicant list"
```

---

### Task 9: My Applications (TALENT) — blok contract + aksi agree/decline

**Files:**
- Modify: `app/applications/page.tsx`

**Interfaces:**
- Consumes: `listForApplications as listContractsForApplications` (Task 4), `agreeContract`/`declineContract` (Task 5).
- Produces: blok kontrak dengan status + tombol agree/decline saat PENDING_AGREEMENT.

- [ ] **Step 1: Tambah import**

```tsx
import { listForApplications as listContractsForApplications } from "@/modules/contract/queries";
import {
  agreeContract,
  declineContract,
} from "@/modules/contract/actions";
```

- [ ] **Step 2: Batch fetch setelah fetch consents**

```tsx
const contracts = await listContractsForApplications(appIds);
```

- [ ] **Step 3: Render blok kontrak di dalam tiap card, setelah blok consent**

```tsx
{(() => {
  const contract = contracts.get(a.id);
  if (!contract) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Kontrak: {contract.role_title ?? "-"}
        </span>
        <span className="text-xs bg-gray-100 rounded px-2 py-1">
          {contract.status}
        </span>
      </div>
      <Link href={`/contracts/${contract.id}`} className="text-sm text-blue-600">
        Lihat kontrak
      </Link>
      {contract.status === "PENDING_AGREEMENT" && !contract.talent_agreed && (
        <div className="flex gap-2 mt-2">
          <form action={agreeContract.bind(null, contract.id)}>
            <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
              Setujui Kontrak
            </button>
          </form>
          <form action={declineContract.bind(null, contract.id)}>
            <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">
              Tolak
            </button>
          </form>
        </div>
      )}
      {contract.status === "ACTIVE" && (
        <p className="text-sm text-green-700 mt-1">
          Kontrak aktif — payment disiapkan.
        </p>
      )}
    </div>
  );
})()}
```

- [ ] **Step 4: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/applications/
git commit -m "feat(contract): add contract block to my applications"
```

---

### Task 10: Build & typecheck verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: semua PASS tanpa error.

- [ ] **Step 2: E2E smoke manual (2 akun browser)**

1. Lanjutkan data smoke consent (hirer + talent sudah ada, application SELECTED + meeting COMPLETED di `Smoke Consent Opportunity`).
2. HIRER buka applicant list opportunity → klik "Buat Kontrak" → isi form → Simpan → redirect ke `/contracts/[id]` status DRAFT + `contract_number` berformat `CNTR-YYMMDD-XXXX` (cek DB).
3. Edit draft → ubah compensation → tersimpan.
4. Propose → status `PENDING_AGREEMENT`, `hirer_agreed = true` + `hirer_agreed_at` terisi, `proposed_by` = hirer.
5. TALENT buka `/applications` → blok "Kontrak: …" + link → detail → tombol Setujui/Tolak.
6. TALENT Setujui → status **ACTIVE** + `activated_at` terisi; cek DB: row `payments` (status PENDING, amount = compensation, currency IDR) + `works` (status NOT_STARTED) terbentuk.
7. Path decline: buat kontrak kedua (application lain yang sudah COMPLETED meeting) → propose → TALENT Tolak → status TERMINATED + `terminated_at` terisi; tanpa tombol lanjut (terminal).
8. Gate invalid: coba buat kontrak untuk application tanpa meeting COMPLETED → ditolak ("Meeting harus COMPLETED..."); kontrak kedua untuk application sama → ditolak ("Kontrak sudah dibuat").
9. RLS via REST: talent asing SELECT `/rest/v1/contracts` → `[]`; talent INSERT contracts → 42501; talent PATCH contract orang lain → 0 rows; admin SELECT → rows (policy; admin account tanpa kredensial → verifikasi SQL saja).
10. UI hirer: badge kontrak di applicant list (link Lihat Kontrak) tampil setelah create.

- [ ] **Step 3: Commit (jika ada perbaikan)**

```bash
git add -A
git commit -m "fix(contract): address smoke test findings"
```

---

### Task 11: Update `docs/PROGRESS.md`

- [ ] **Step 1: Update progress**

- Tambah "Module Contract" ke "Sudah Selesai" (Task 1–10).
- Decision Log tambah:
  - `2026-08-29: Contract propose = auto-agree HIRER (proposed_by + hirer_agreed); satu tombol agree TALENT cukup untuk ACTIVE`
  - `2026-08-29: Contract ACTIVE side effects: service insert payments (PENDING, amount=compensation) + works (NOT_STARTED); 23505 dianggap sukses (idempotent)`
  - `2026-08-29: Contract COMPLETED dicapai via alur Work (modul berikutnya); decline hanya dari PENDING_AGREEMENT → TERMINATED`
  - `2026-08-29: Contract gate = application SELECTED + meeting COMPLETED + getConsentDecision eligible; gate modul Work = getByApplicationId status ACTIVE`
- Status terakhir: Sprint 7 — Module Contract selesai; next: Work → Payment.

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update progress contract module"
```

---

## Self-Review Notes

- **Spec coverage:** Migration RLS + seed payments/works (Task 1), schemas tanpa field state (Task 2), service lengkap create/edit/propose/agree/decline + contract_number + side effects (Task 3), queries + gate Work (Task 4), actions (Task 5), form create/edit (Task 6), detail page + aksi (Task 7), blok hirer (Task 8), blok talent (Task 9), verification + smoke + RLS (Task 10), progress (Task 11). Acceptance criteria 1–7 spec terpetakan (AC 6 di Task 1+10, AC 7 di Task 4+7).
- **Placeholder scan:** tidak ada TBD/TODO; Task 3 service lengkap dan konsisten (`nextTalentAgreed`/`nextHirerAgreed`/`willActivate`, `updateError` di-check).
- **Type consistency:** `ServiceResult`, `CreateContractInput`, `UpdateContractInput`, `ContractRow`/`ContractDetail`, service signatures `createContract(hirerId, input)`, `propose(hirerId, contractId)`, `agree(userId, contractId)`, `decline(userId, contractId, reason)` konsisten dipakai di Task 5/6/7/8. Action `updateContractAction(_prev, formData)` (bukan `updateContract` — bentrok nama dengan service import alias) dipakai konsisten.
