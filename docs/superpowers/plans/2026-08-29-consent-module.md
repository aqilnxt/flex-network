# Consent Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TALENT (simulated consent flow) mengajukan lalu menyetujui / menolak parent/guardian consent untuk application yang sudah SELECTED + meeting COMPLETED, dengan requirement dievaluasi server-side dan RLS involved-parties.

**Architecture:** Modular monolith pattern yang sama dengan modul Meeting: `modules/consent/` (schemas → queries → service → actions) di atas tabel `consents` yang sudah live. Row consent hanya dibuat saat required (lazy eksplisit); `NOT_REQUIRED` dan `MISSING` murni derived. RLS policy baru di migration `011`. Contract gate (`getConsentDecision`) didokumentasikan untuk modul Contract berikutnya.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (server client + RLS), Zod 4, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-08-29-consent-module-design.md`

## Global Constraints

- Status canonical consent: `NOT_REQUIRED / PENDING / APPROVED / REJECTED` (CHECK constraint DB, jangan diubah). `NOT_REQUIRED` dan `MISSING` derived, tidak pernah tersimpan (spec: Consent Decision).
- Row consent hanya dibuat saat required (lazy eksplisit). Requirement: `opportunity.requires_consent = true OR profiles.is_minor = true` — evaluasi server-side (API-SPEC 10.1).
- Create PENDING hanya untuk application `SELECTED` + meeting `COMPLETED` + belum ada row + TALENT owner (API-SPEC 10.3).
- `APPROVED` dan `REJECTED` terminal — tidak ada transisi keluar; `consent_required = false` tidak pernah bisa di-approve/reject.
- **Guardian data dilarang keras:** schema tidak menerima `guardianName`, `guardianContact`, `guardianEmail`, `guardianAccountId`, `identityDocument`, `identityNumber`, dokumen KTP/KK/Akta. Tidak ada guardian account/login/dashboard.
- `is_minor` dibaca apa adanya dari `profiles.is_minor` (defer pengisian; jangan tambah logika pengisian di modul ini).
- Validasi semua input via Zod di server; `requireRole("TALENT")` + ownership check sebelum setiap mutation; HIRER read-only.
- Tidak ada halaman consent terpisah — info inline.
- Verifikasi project: `npx tsc --noEmit`, `npm run lint`, `npm run build` (tidak ada test framework).
- Commit format: `type(scope): deskripsi imperative lowercase` (lihat `/GIT_COMMIT.md`).

---

### Task 1: Migration `011_consent_rls.sql` + push

**Files:**
- Create: `supabase/migrations/011_consent_rls.sql`

**Interfaces:**
- Consumes: tabel `consents` (001), tabel `meetings` (001), helper `is_admin()` (006).
- Produces: RLS aktif granular pada `consents` — SELECT involved/admin, INSERT/UPDATE talent owner.

- [ ] **Step 1: Tulis migration**

```sql
-- 011_consent_rls.sql — granular policies untuk consents
-- Baseline 003: RLS enabled, default-deny, tanpa policy.

-- SELECT: talent pemilik consent, hirer owner opportunity, admin
create policy "consents_select_involved"
  on public.consents for select to authenticated
  using (
    talent_id = auth.uid()
    or exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
    or is_admin()
  );

-- INSERT: talent owner; application SELECTED + meeting COMPLETED (defense-in-depth; service cek dulu)
create policy "consents_insert_talent"
  on public.consents for insert to authenticated
  with check (
    talent_id = auth.uid()
    and exists (
      select 1 from public.applications a
      join public.meetings m on m.application_id = a.id
      where a.id = application_id
        and a.status = 'SELECTED'
        and m.status = 'COMPLETED'
    )
  );

-- UPDATE: talent owner saja (transisi approve/reject); hirer tidak pernah update
create policy "consents_update_talent"
  on public.consents for update to authenticated
  using (talent_id = auth.uid())
  with check (talent_id = auth.uid());
```

Catatan: tidak ada policy DELETE (tidak ada use case delete consent; `on delete cascade` dari applications cukup).

- [ ] **Step 2: Push ke Supabase**

Run: `supabase db push`
Expected: migration applied.

- [ ] **Step 3: Verifikasi policy**

Run: `supabase db query --linked "select policyname, cmd from pg_policies where tablename = 'consents';"`
Expected: 3 rows (`consents_select_involved`, `consents_insert_talent`, `consents_update_talent`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/011_consent_rls.sql
git commit -m "feat(db): add consents rls policies"
```

---

### Task 2: Schemas `modules/consent/schemas.ts`

**Files:**
- Create: `modules/consent/schemas.ts`

**Interfaces:**
- Produces: `createConsentSchema`, `CreateConsentInput` (= `z.infer`).

- [ ] **Step 1: Tulis schema**

```ts
import { z } from "zod";

export const createConsentSchema = z.object({
  applicationId: z.string().uuid("Application tidak valid"),
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
```

Catatan: sengaja minimal (API-SPEC 22.6). Zod strip membuang field tak dikenal — guardian data tidak pernah masuk meski di-inject client. DILARANG menambah field `guardian*` / `identity*`.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/consent/schemas.ts
git commit -m "feat(consent): add create consent schema"
```

---

### Task 3: Service `modules/consent/service.ts`

**Files:**
- Create: `modules/consent/service.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient`, `CreateConsentInput`.
- Produces:
  - `type ServiceResult<T> = { data: T | null; error: { message: string } | null }`
  - `requestConsent(talentId: string, input: CreateConsentInput): Promise<ServiceResult<{ applicationId: string }>>`
  - `approve(talentId: string, consentId: string): Promise<ServiceResult<{ applicationId: string }>>`
  - `reject(talentId: string, consentId: string): Promise<ServiceResult<{ applicationId: string }>>`

- [ ] **Step 1: Tulis service**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateConsentInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

async function loadConsentContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  talentId: string,
  applicationId: string,
): Promise<ServiceResult<{ opportunityId: string; requiredReason: string }>> {
  const { data: application } = await supabase
    .from("applications")
    .select("id, status, talent_id, opportunity_id")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return { data: null, error: { message: "Application tidak ditemukan" } };
  }
  if (application.talent_id !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (application.status !== "SELECTED") {
    return {
      data: null,
      error: { message: "Consent hanya bisa diajukan untuk application SELECTED" },
    };
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("status")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!meeting || meeting.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Meeting harus COMPLETED sebelum consent bisa diajukan" },
    };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, requires_consent")
    .eq("id", application.opportunity_id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_minor")
    .eq("id", talentId)
    .single();

  const requiresOpportunity = opportunity?.requires_consent === true;
  const isMinor = profile?.is_minor === true;

  if (!requiresOpportunity && !isMinor) {
    return {
      data: null,
      error: { message: "Consent tidak diperlukan untuk application ini" },
    };
  }

  const reasons = [
    requiresOpportunity ? "Opportunity requires consent" : null,
    isMinor ? "Talent is minor" : null,
  ].filter((r): r is string => r !== null);

  return {
    data: {
      opportunityId: application.opportunity_id,
      requiredReason: reasons.join("; "),
    },
    error: null,
  };
}

export async function requestConsent(
  talentId: string,
  input: CreateConsentInput,
): Promise<ServiceResult<{ applicationId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: ctxError } = await loadConsentContext(
    supabase,
    talentId,
    input.applicationId,
  );
  if (ctxError || !ctx) return { data: null, error: ctxError };

  const { data: existing } = await supabase
    .from("consents")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();

  if (existing) {
    return { data: null, error: { message: "Consent sudah diajukan" } };
  }

  const { error } = await supabase.from("consents").insert({
    application_id: input.applicationId,
    talent_id: talentId,
    opportunity_id: ctx.opportunityId,
    consent_required: true,
    required_reason: ctx.requiredReason,
    status: "PENDING",
    requested_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Consent sudah diajukan" } };
    }
    return { data: null, error: { message: error.message } };
  }

  return { data: { applicationId: input.applicationId }, error: null };
}

async function getOwnedConsent(
  talentId: string,
  consentId: string,
): Promise<
  ServiceResult<{
    id: string;
    status: string;
    consentRequired: boolean;
    applicationId: string;
  }>
> {
  const supabase = await createSupabaseServerClient();

  const { data: consent } = await supabase
    .from("consents")
    .select("id, status, consent_required, talent_id, application_id")
    .eq("id", consentId)
    .single();

  if (!consent) {
    return { data: null, error: { message: "Consent tidak ditemukan" } };
  }
  if (consent.talent_id !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }

  return {
    data: {
      id: consent.id,
      status: consent.status,
      consentRequired: consent.consent_required,
      applicationId: consent.application_id,
    },
    error: null,
  };
}

export async function approve(
  talentId: string,
  consentId: string,
): Promise<ServiceResult<{ applicationId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: consent, error: ownedError } = await getOwnedConsent(consentId, talentId);
  if (ownedError || !consent) return { data: null, error: ownedError };

  if (!consent.consentRequired) {
    return {
      data: null,
      error: { message: "Consent tidak wajib untuk application ini" },
    };
  }
  if (consent.status !== "PENDING") {
    return { data: null, error: { message: "Hanya PENDING yang bisa disetujui" } };
  }

  const { error } = await supabase
    .from("consents")
    .update({ status: "APPROVED", approved_at: new Date().toISOString() })
    .eq("id", consentId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { applicationId: consent.applicationId }, error: null };
}

export async function reject(
  talentId: string,
  consentId: string,
): Promise<ServiceResult<{ applicationId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: consent, error: ownedError } = await getOwnedConsent(consentId, talentId);
  if (ownedError || !consent) return { data: null, error: ownedError };

  if (!consent.consentRequired) {
    return {
      data: null,
      error: { message: "Consent tidak wajib untuk application ini" },
    };
  }
  if (consent.status !== "PENDING") {
    return { data: null, error: { message: "Hanya PENDING yang bisa ditolak" } };
  }

  const { error } = await supabase
    .from("consents")
    .update({ status: "REJECTED", rejected_at: new Date().toISOString() })
    .eq("id", consentId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { applicationId: consent.applicationId }, error: null };
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/consent/service.ts
git commit -m "feat(consent): add consent service with state machine"
```

---

### Task 4: Queries `modules/consent/queries.ts`

**Files:**
- Create: `modules/consent/queries.ts`

**Interfaces:**
- Produces:
  - `type ConsentStatus = "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED" | "MISSING"`
  - `type ConsentRow = { id, application_id, talent_id, opportunity_id, consent_required, required_reason, status, requested_at, approved_at, rejected_at }`
  - `getByApplicationId(applicationId: string): Promise<ConsentRow | null>` — contract gate + inline render.
  - `listForApplications(applicationIds: string[]): Promise<Map<string, ConsentRow>>` — batch render tanpa N+1.
  - `getRequirementMap(applicationIds: string[]): Promise<Map<string, { required: boolean; reason: string | null }>>` — evaluasi server-side `opportunity.requires_consent || profiles.is_minor`.
  - `getConsentDecision(applicationId: string): Promise<ConsentDecision>` — `ConsentDecision = { required: boolean; status: ConsentStatus }`; **single call contract gate modul Contract**: eligible iff `!required || status === "APPROVED"`; blocked untuk `MISSING`, `PENDING`, `REJECTED`.

- [ ] **Step 1: Tulis queries**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConsentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MISSING";

export type ConsentRow = {
  id: string;
  application_id: string;
  talent_id: string;
  opportunity_id: string;
  consent_required: boolean;
  required_reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_REQUIRED";
  requested_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
};

export type ConsentDecision = {
  required: boolean;
  status: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED" | "MISSING";
};

const CONSENT_COLUMNS =
  "id, application_id, talent_id, opportunity_id, consent_required, required_reason, status, requested_at, approved_at, rejected_at";

export async function getByApplicationId(
  applicationId: string,
): Promise<ConsentRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("consents")
    .select(CONSENT_COLUMNS)
    .eq("application_id", applicationId)
    .maybeSingle();
  return (data as unknown as ConsentRow) ?? null;
}

export async function listForApplications(
  applicationIds: string[],
): Promise<Map<string, ConsentRow>> {
  const map = new Map<string, ConsentRow>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("consents")
    .select(CONSENT_COLUMNS)
    .in("application_id", applicationIds);

  for (const c of (data as unknown as ConsentRow[]) ?? []) {
    map.set(c.application_id, c);
  }
  return map;
}

export async function getRequirementMap(
  applicationIds: string[],
): Promise<Map<string, { required: boolean; reason: string | null }>> {
  const map = new Map<string, { required: boolean; reason: string | null }>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, talent:profiles!inner(is_minor), opportunity:opportunities!inner(requires_consent)",
    )
    .in("id", applicationIds);

  const rows =
    (data as unknown as {
      id: string;
      talent: { is_minor: boolean } | null;
      opportunity: { requires_consent: boolean } | null;
    }[]) ?? [];

  for (const row of rows) {
    const requiresOpportunity = row.opportunity?.requires_consent === true;
    const isMinor = row.talent?.is_minor === true;
    const required = requiresOpportunity || isMinor;
    const reasons = [
      requiresOpportunity ? "Opportunity requires consent" : null,
      isMinor ? "Talent is minor" : null,
    ].filter((r): r is string => r !== null);
    map.set(row.id, {
      required,
      reason: required ? reasons.join("; ") : null,
    });
  }
  return map;
}

export async function getConsentDecision(
  applicationId: string,
): Promise<ConsentDecision> {
  const requirement = (await getRequirementMap([applicationId])).get(
    applicationId,
  );
  const required = requirement?.required ?? false;

  if (!required) {
    return { required: false, status: "NOT_REQUIRED" };
  }

  const row = await getByApplicationId(applicationId);
  return { required: true, status: row?.status ?? "MISSING" };
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/consent/queries.ts
git commit -m "feat(consent): add consent queries with contract gate"
```

---

### Task 5: Server Actions `modules/consent/actions.ts`

**Files:**
- Create: `modules/consent/actions.ts`

**Interfaces:**
- Consumes: `createConsentSchema` (Task 2), `requestConsent/approve/reject` service (Task 3), `requireRole("TALENT")` dari `@/modules/lib/auth`, `ActionResult` dari `@/lib/result`.
- Produces:
  - `createConsent(_prev: ActionResult | null, formData: FormData): Promise<ActionResult>` (useActionState)
  - `approveConsent(consentId: string): Promise<void>`
  - `rejectConsent(consentId: string): Promise<void>`

- [ ] **Step 1: Tulis actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireRole } from "@/modules/lib/auth";
import { createConsentSchema } from "./schemas";
import {
  requestConsent as requestConsentService,
  approve as approveConsentService,
  reject as rejectConsentService,
} from "./service";

export async function createConsent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("TALENT");

  const applicationId = formData.get("applicationId");
  const parsed = createConsentSchema.safeParse({
    applicationId: typeof applicationId === "string" ? applicationId : "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Data yang dikirim tidak valid.",
      },
    };
  }

  const { error } = await requestConsentService(user.id, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "CONSENT_ERROR", message: error.message },
    };
  }

  revalidatePath("/applications");
  return { success: true, data: null };
}

export async function approveConsent(consentId: string): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await approveConsentService(user.id, consentId);
  if (error) return;
  revalidatePath("/applications");
  redirect("/applications");
}

export async function rejectConsent(consentId: string): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await rejectConsentService(user.id, consentId);
  if (error) return;
  revalidatePath("/applications");
  redirect("/applications");
}
```

Catatan: `createConsent` berbasis state return `ActionResult` (pola `scheduleMeeting`); `approveConsent`/`rejectConsent` fire-and-forget `void` + `redirect()` balik ke `/applications` (keputusan 2026-08-29).

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/consent/actions.ts
git commit -m "feat(consent): add consent server actions"
```

---

### Task 6: Form request consent (client component)

**Files:**
- Create: `app/applications/consent-request-form.tsx`

**Interfaces:**
- Consumes: `createConsent` action (Task 5).
- Produces: `<ConsentRequestForm applicationId={string} />` — dipakai Task 7.

- [ ] **Step 1: Tulis form**

```tsx
"use client";

import { useActionState } from "react";
import { createConsent } from "@/modules/consent/actions";

export function ConsentRequestForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createConsent, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <p className="text-sm font-medium">Consent Wali (Simulasi)</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <p className="text-sm text-gray-600">
        Opportunity ini atau status akun Anda mewajibkan persetujuan
        orang tua/wali. Deklarasi bersifat simulasi — tidak ada data wali
        yang dikumpulkan.
      </p>
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-1 self-start disabled:opacity-50"
      >
        {pending ? "Mengajukan..." : "Ajukan Consent"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/applications/consent-request-form.tsx
git commit -m "feat(consent): add consent request form"
```

---

### Task 7: Halaman My Applications (TALENT) — blok consent + aksi

**Files:**
- Modify: `app/applications/page.tsx`

**Interfaces:**
- Consumes: `listForTalent` (existing), `listForApplications` meeting (existing, variabel `meetings`, per item `meeting`), `listForApplications as listConsentsForApplications` + `getRequirementMap` (Task 4), `approveConsent`/`rejectConsent` (Task 5), `ConsentRequestForm` (Task 6 form).
- Produces: blok consent dengan aksi request/approve/reject per application.

- [ ] **Step 1: Tambah import**

```tsx
import {
  listForApplications as listConsentsForApplications,
  getRequirementMap,
} from "@/modules/consent/queries";
import { approveConsent, rejectConsent } from "@/modules/consent/actions";
import { ConsentRequestForm } from "./consent-request-form";
```

- [ ] **Step 2: Batch fetch setelah fetch meetings**

```tsx
const appIds = (applications ?? []).map((a) => a.id);
const meetings = await listForApplications(appIds); // meeting module, sudah ada
const consents = await listConsentsForApplications(appIds);
const requirements = await getRequirementMap(appIds);
```

- [ ] **Step 3: Render blok consent di dalam tiap card, setelah blok meeting**

```tsx
{(() => {
  const requirement = requirements.get(a.id);
  if (!requirement?.required || a.status !== "SELECTED") return null;
  const consent = consents.get(a.id);
  const consentStatus: string = consent?.status ?? "MISSING";
  return (
    <div className="mt-3 border-t pt-3">
      {consentStatus === "MISSING" &&
        (meeting?.status === "COMPLETED" ? (
          <ConsentRequestForm applicationId={a.id} />
        ) : (
          <p className="text-sm text-gray-600">
            Consent wali diperlukan untuk melanjutkan — selesaikan meeting
            terlebih dahulu.
          </p>
        ))}
      {consent?.status === "PENDING" && (
        <div className="text-sm">
          <p className="font-medium">
            Consent wali menunggu persetujuan (simulasi).
          </p>
          <p className="text-gray-600">
            Dengan menyetujui, Anda menyatakan persetujuan wali atas
            partisipasi ini. Tidak ada data wali yang dikumpulkan.
          </p>
          <div className="flex gap-2 mt-2">
            <form action={approveConsent.bind(null, consent.id)}>
              <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                Setujui (Simulasi)
              </button>
            </form>
            <form action={rejectConsent.bind(null, consent.id)}>
              <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">
                Tolak
              </button>
            </form>
          </div>
        </div>
      )}
      {(consent?.status === "APPROVED" || consent?.status === "REJECTED") && (
        <p className="text-sm">
          Consent wali:{" "}
          <span className="text-xs bg-gray-100 rounded px-2 py-1">
            {consent.status}
          </span>
        </p>
      )}
    </div>
  );
})()}
```

Catatan: variabel `meeting` sudah ada di scope map callback (blok meeting Task 8 meeting module). Tidak render apa pun saat tidak required (NOT_REQUIRED = senyap). Tanpa tombol untuk APPROVED/REJECTED (terminal).

- [ ] **Step 4: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/applications/
git commit -m "feat(consent): add consent block to my applications"
```

---

### Task 8: Applicant list (HIRER) — badge consent read-only

**Files:**
- Modify: `app/hirer/opportunities/[id]/applications/page.tsx`

**Interfaces:**
- Consumes: `listForApplications as listConsentsForApplications` (Task 4).
- Produces: badge consent read-only per application.

- [ ] **Step 1: Tambah import**

```tsx
import { listForApplications as listConsentsForApplications } from "@/modules/consent/queries";
```

- [ ] **Step 2: Batch fetch setelah fetch meetings**

```tsx
const consents = await listConsentsForApplications(
  (applications ?? []).map((a) => a.id),
);
```

- [ ] **Step 3: Render badge setelah blok meeting (IIFE kedua)**

```tsx
{(() => {
  const consent = consents.get(a.id);
  if (!consent) return null;
  return (
    <div className="mt-3 border-t pt-3 text-sm">
      Consent wali:{" "}
      <span className="text-xs bg-gray-100 rounded px-2 py-1">
        {consent.status}
      </span>
      {consent.status === "PENDING" && (
        <span className="text-gray-500"> — menunggu talent</span>
      )}
    </div>
  );
})()}
```

Catatan: tanpa row → tanpa badge (talent belum request atau not required). HIRER tidak boleh lihat `requires_consent` opportunity-nya sendiri maupun minor-status talent — tidak diekspos. Tidak ada tombol aksi (HIRER read-only).

- [ ] **Step 3b: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "app/hirer/opportunities/[id]/applications/page.tsx"
git commit -m "feat(consent): show consent badge on applicant list"
```

---

### Task 9: Build & typecheck verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: semua PASS tanpa error.

- [ ] **Step 2: E2E smoke manual (2 akun browser)**

1. HIRER set `requires_consent = true` pada opportunity uji via SQL: `supabase db query --linked "update opportunities set requires_consent = true where id = '<id-opportunity>';"`
2. TALENT apply → HIRER review → select → schedule meeting → Tandai Selesai.
3. TALENT buka `/applications` → blok "Consent Wali (Simulasi)" muncul dengan tombol Ajukan.
4. Ajukan → row `PENDING` + `requested_at` terisi (cek DB); tombol berubah jadi Setujui/Tolak.
5. Ajukan kedua kali → ditolak ("Consent sudah diajukan").
6. Setujui → badge `APPROVED`, `approved_at` terisi, tombol hilang (terminal).
7. Path REJECTED: ulangi flow dengan application kedua (opportunity lain yang requires_consent) → Tolak → badge `REJECTED`, `rejected_at` terisi, tanpa aksi.
8. Opportunity tanpa `requires_consent` + talent bukan minor → tidak ada blok consent (NOT_REQUIRED senyap).
9. RLS: HIRER coba PATCH `consents` via REST → ditolak; TALENT lain tidak melihat row (204 + 0 rows); admin bisa SELECT.
10. Path invalid: request consent sebelum meeting COMPLETED → ditolak ("Meeting harus COMPLETED..."); request untuk application tidak required → ditolak ("Consent tidak diperlukan...").

- [ ] **Step 3: Commit (jika ada perbaikan)**

```bash
git add -A
git commit -m "fix(consent): address smoke test findings"
```

---

### Task 10: Update `docs/PROGRESS.md`

- [ ] **Step 1: Update progress**

- Tambah "Module Consent" ke "Sudah Selesai" (Task 1–9).
- Decision Log tambah:
  - `2026-08-29: Consent lazy eksplisit — row hanya saat required; NOT_REQUIRED & MISSING derived, tanpa row`
  - `2026-08-29: Consent APPROVED & REJECTED terminal; aktor TALENT (simulated declaration); is_minor dibaca apa adanya (defer pengisian)`
  - `2026-08-29: Contract gate = getConsentDecision (eligible iff !required || APPROVED), di-enforce modul Contract`
- Status terakhir: Sprint 6 — Module Consent selesai; next: Contract → Payment.

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update progress consent module"
```

---

## Self-Review Notes

- **Spec coverage:** Migration RLS (Task 1), schemas minimal tanpa guardian field (Task 2), service state machine + requirement server-side (Task 3), queries + `getConsentDecision` contract gate (Task 4), actions (Task 5), form request (Task 6), UI talent approve/reject (Task 7), hirer badge read-only (Task 8), verification + smoke + RLS (Task 9), progress (Task 10). Acceptance criteria 1–7 spec terpetakan. Prohibisi guardian data tercakup: schema minimal (Task 2) + tidak ada field guardian di service (Task 3) dan UI (Task 6/7).
- **Placeholder scan:** tidak ada TBD/TODO; semua step berisi kode konkret.
- **Type consistency:** `ConsentRow`/`ConsentStatus`/`ConsentDecision` konsisten spec ↔ Task 4 ↔ Task 5/6/7/8. Service signature `requestConsent(talentId, input)`, `approve(talentId, consentId)`, `reject(talentId, consentId)` dipakai sama di Task 5. `createConsent(_prev, formData)` match `useActionState(createConsent, null)` di Task 6. `approveConsent.bind(null, consent.id)` match signature `approveConsent(consentId)`.
