# Application Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul Application — TALENT apply ke opportunity PUBLISHED, HIRER melihat pelamar lalu me-review/memilih/menolak.

**Architecture:** UI → Server Actions → Application Service → Supabase (server client, RLS aktif). Read-side di `queries.ts`. Konsisten dengan `modules/auth`, `modules/profile`, `modules/opportunity`.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript strict, Supabase SSR, Supabase Auth, Zod, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-28-application-module-design.md`

## Global Constraints

- **Reject** dari `APPLIED` **atau** `UNDER_REVIEW`; **select** hanya dari `UNDER_REVIEW`.
- **Notification & audit → defer** (jangan tulis ke `notifications`/`audit_logs`).
- **`max_talent` di-enforce saat select** (block bila `SELECTED count >= max_talent`).
- **Reject reason TIDAK disimpan** (tabel `applications` tanpa kolom reason).
- Authorization selalu server-side; `requireUser()`/`requireRole()` sebelum mutation; ownership check `hirer_id = auth.uid()` / `talent_id = auth.uid()`.
- Semua Server Action return `ActionResult<T>` (atau `void` untuk fire-and-forget mutation, konsisten opportunity module).
- RLS aktif; gunakan server client (`lib/supabase/server.ts`), bukan `admin.ts`.
- Impor alias `@/*` → root.
- No test runner; verifikasi = `npm run build` + `npm run dev` manual.

## State Machine (di-enforce service layer)

| Transisi | Syarat | Aktor |
|---|---|---|
| `— → APPLIED` | opportunity `PUBLISHED`, deadline belum lewat, belum duplikat | TALENT |
| `APPLIED → UNDER_REVIEW` | hirer owner opportunity | HIRER |
| `UNDER_REVIEW → SELECTED` | hirer owner + `SELECTED count < max_talent` | HIRER |
| `APPLIED / UNDER_REVIEW → REJECTED` | hirer owner | HIRER |

## File Structure

| File | Tanggung jawab |
|------|----------------|
| `supabase/migrations/007_application_rls.sql` | policy update untuk HIRER |
| `modules/application/schemas.ts` | `createApplicationSchema` |
| `modules/application/queries.ts` | `listForTalent`, `listForOpportunity`, `getApplicationStatus` |
| `modules/application/service.ts` | `apply`, `review`, `select`, `reject` |
| `modules/application/actions.ts` | Server Actions |
| `app/applications/page.tsx` | My Applications (TALENT) |
| `app/opportunities/[id]/page.tsx` | tambah form Apply (modify) |
| `app/opportunities/[id]/apply-form.tsx` | client component Apply (create) |
| `app/hirer/opportunities/[id]/applications/page.tsx` | applicant list (HIRER) |
| `app/hirer/opportunities/page.tsx` | tambah link "Lihat Applicant" (modify) |

---

## Task 1: Migration `007_application_rls.sql`

**Files:**
- Create: `supabase/migrations/007_application_rls.sql`

**Interfaces:**
- Produces: policy `applications_update_hirer`. Dipakai `service.ts` (hirer update status) via server client.

**Isi:**

```sql
-- 007_application_rls.sql
-- Additive RLS untuk Application Module: hirer dapat update application pada
-- opportunity miliknya.

create policy "applications_update_hirer"
  on public.applications for update to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  );
```

**Steps:**
- [ ] **Step 1:** Tulis `supabase/migrations/007_application_rls.sql` (isi di atas).
- [ ] **Step 2:** Push `supabase db push`.
- [ ] **Step 3:** Commit `feat(db): add application hirer update RLS policy`.

---

## Task 2: Schemas — `modules/application/schemas.ts`

**Files:**
- Create: `modules/application/schemas.ts`

**Interfaces:**
- Produces: `createApplicationSchema` + `CreateApplicationInput`.

```ts
import { z } from "zod";

export const createApplicationSchema = z.object({
  opportunityId: z.string().uuid(),
  message: z.string().trim().max(1000).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/application/schemas.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(application): add zod schema`.

---

## Task 3: Queries — `modules/application/queries.ts`

**Files:**
- Create: `modules/application/queries.ts`

**Interfaces:**
- Consumes: `lib/supabase/server.ts`.
- Produces: `listForTalent(talentId)`, `listForOpportunity(opportunityId, hirerId)`, `getApplicationStatus(talentId, opportunityId)`.

**Isi:**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listForTalent(talentId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("applications")
    .select(
      "id, status, applied_at, message, opportunity:opportunity_id(id, title, status, work_mode, location)",
    )
    .eq("talent_id", talentId)
    .order("applied_at", { ascending: false });
}

export async function listForOpportunity(opportunityId: string, hirerId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, hirer_id, max_talent, title")
    .eq("id", opportunityId)
    .single();

  if (!opportunity || opportunity.hirer_id !== hirerId) {
    return {
      applications: [],
      maxTalent: 1,
      selectedCount: 0,
      error: { message: "Not found or not owner" },
    };
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, message, applied_at, talent:talent_id(id, full_name)")
    .eq("opportunity_id", opportunityId)
    .order("applied_at", { ascending: true });

  const { count: selectedCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", opportunityId)
    .eq("status", "SELECTED");

  return {
    applications: applications ?? [],
    maxTalent: opportunity.max_talent ?? 1,
    selectedCount: selectedCount ?? 0,
    error: null,
  };
}

export async function getApplicationStatus(talentId: string, opportunityId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("applications")
    .select("id, status")
    .eq("talent_id", talentId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  return data ?? null;
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/application/queries.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(application): add read queries`.

---

## Task 4: Service — `modules/application/service.ts`

**Files:**
- Create: `modules/application/service.ts`

**Interfaces:**
- Consumes: `lib/supabase/server.ts`, `modules/application/schemas.ts` (`CreateApplicationInput`).
- Produces: `apply`, `review`, `select`, `reject` (semua return `{ data, error }` dengan `error: { message: string } | null`).

**Isi:**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateApplicationInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

export async function apply(
  talentId: string,
  input: CreateApplicationInput,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, status, application_deadline")
    .eq("id", input.opportunityId)
    .single();

  if (!opportunity) {
    return { data: null, error: { message: "Opportunity tidak ditemukan" } };
  }
  if (opportunity.status !== "PUBLISHED") {
    return { data: null, error: { message: "Opportunity tidak tersedia untuk dilamar" } };
  }
  if (
    opportunity.application_deadline &&
    new Date(opportunity.application_deadline).getTime() < Date.now()
  ) {
    return { data: null, error: { message: "Deadline aplikasi sudah lewat" } };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      talent_id: talentId,
      opportunity_id: input.opportunityId,
      message: input.message ?? null,
      status: "APPLIED",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Kamu sudah apply ke opportunity ini" } };
    }
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

async function getOwnedApplication(
  hirerId: string,
  id: string,
): Promise<ServiceResult<{ id: string; status: string; opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, opportunity_id")
    .eq("id", id)
    .single();

  if (!application) {
    return { data: null, error: { message: "Application tidak ditemukan" } };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, hirer_id")
    .eq("id", application.opportunity_id)
    .single();

  if (!opportunity || opportunity.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }

  return {
    data: {
      id: application.id,
      status: application.status,
      opportunityId: application.opportunity_id,
    },
    error: null,
  };
}

export async function review(hirerId: string, id: string): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();
  const { data: app, error: ownedError } = await getOwnedApplication(hirerId, id);
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "APPLIED") {
    return { data: null, error: { message: "Hanya APPLIED yang bisa di-review" } };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "UNDER_REVIEW", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return { data: null, error: error ? { message: error.message } : null };
}

export async function select(hirerId: string, id: string): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();
  const { data: app, error: ownedError } = await getOwnedApplication(hirerId, id);
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "UNDER_REVIEW") {
    return { data: null, error: { message: "Hanya UNDER_REVIEW yang bisa di-select" } };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("max_talent")
    .eq("id", app.opportunityId)
    .single();

  const maxTalent = opportunity?.max_talent ?? 1;

  const { count: selectedCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", app.opportunityId)
    .eq("status", "SELECTED");

  if ((selectedCount ?? 0) >= maxTalent) {
    return { data: null, error: { message: "Kuota talent sudah penuh" } };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "SELECTED", selected_at: new Date().toISOString() })
    .eq("id", id);

  return { data: null, error: error ? { message: error.message } : null };
}

export async function reject(hirerId: string, id: string): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();
  const { data: app, error: ownedError } = await getOwnedApplication(hirerId, id);
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "APPLIED" && app.status !== "UNDER_REVIEW") {
    return { data: null, error: { message: "Status tidak bisa di-reject" } };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "REJECTED", rejected_at: new Date().toISOString() })
    .eq("id", id);

  return { data: null, error: error ? { message: error.message } : null };
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/application/service.ts` (isi di atas).
- [ ] **Step 2:** Pastikan state machine sesuai tabel (transisi ilegal return error).
- [ ] **Step 3:** Commit `feat(application): add service mutations`.

---

## Task 5: Server Actions — `modules/application/actions.ts`

**Files:**
- Create: `modules/application/actions.ts`

**Interfaces:**
- Consumes: `lib/result.ts` (`ActionResult`), `modules/lib/auth.ts` (`requireRole`), `modules/application/schemas.ts`, `modules/application/service.ts`.
- Produces: `apply(_prev, formData) => ActionResult`; `reviewApplication(id)`, `selectApplication(id)`, `rejectApplication(id) => Promise<void>`.

```ts
"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/result";
import { requireRole } from "@/modules/lib/auth";
import { createApplicationSchema } from "./schemas";
import { apply as applyService, review, select, reject } from "./service";

function formString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v;
}

export async function apply(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("TALENT");

  const parsed = createApplicationSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    message: formString(formData.get("message")),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
    };
  }

  const { error } = await applyService(user.id, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "APPLICATION_ERROR", message: error.message },
    };
  }

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/applications");
  return { success: true, data: null };
}

export async function reviewApplication(id: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await review(user.id, id);
  if (error) return;
  revalidatePath("/hirer/opportunities", "layout");
}

export async function selectApplication(id: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await select(user.id, id);
  if (error) return;
  revalidatePath("/hirer/opportunities", "layout");
}

export async function rejectApplication(id: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await reject(user.id, id);
  if (error) return;
  revalidatePath("/hirer/opportunities", "layout");
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/application/actions.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(application): add server actions`.

---

## Task 6: My Applications page — `app/applications/page.tsx`

**Files:**
- Create: `app/applications/page.tsx`

**Interfaces:**
- Consumes: `modules/lib/auth.ts` (`requireRole`), `modules/application/queries.ts` (`listForTalent`).

**Isi:**

```tsx
import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { listForTalent } from "@/modules/application/queries";

export default async function MyApplicationsPage() {
  const user = await requireRole("TALENT");
  const { data: applications } = await listForTalent(user.id);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Aplikasi Saya</h1>

      {(applications ?? []).length === 0 && (
        <p className="text-gray-500">Belum ada aplikasi.</p>
      )}

      <div className="flex flex-col gap-3">
        {(applications ?? []).map((a) => (
          <div key={a.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <Link
                href={`/opportunities/${a.opportunity?.id}`}
                className="font-semibold hover:underline"
              >
                {a.opportunity?.title ?? "-"}
              </Link>
              <p className="text-sm text-gray-600">
                {a.opportunity?.work_mode ?? "-"} · {a.opportunity?.location ?? "-"}
              </p>
            </div>
            <span className="text-xs bg-gray-100 rounded px-2 py-1">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

> Catatan: kolom `opportunity` adalah hasil embed `opportunity:opportunity_id(...)`; hasilnya object `{ id, title, status, work_mode, location }`. Gunakan `a.opportunity?.id` untuk link (kolom `opportunity_id` tidak ikut ter-select karena Task 3 memakai daftar kolom eksplisit).

**Steps:**
- [ ] **Step 1:** Tulis `app/applications/page.tsx` (isi di atas).
- [ ] **Step 2:** Commit `feat(application): add my applications page`.

---

## Task 7: Apply form on detail — modify `app/opportunities/[id]/page.tsx` + create `apply-form.tsx`

**Files:**
- Modify: `app/opportunities/[id]/page.tsx`
- Create: `app/opportunities/[id]/apply-form.tsx`

**Interfaces:**
- Consumes: `modules/application/actions.ts` (`apply`), `modules/application/queries.ts` (`getApplicationStatus`), `modules/lib/auth.ts` (`requireUser`).

**Isi `apply-form.tsx` (client):**

```tsx
"use client";

import { useActionState } from "react";
import { apply } from "@/modules/application/actions";

export function ApplyForm({
  opportunityId,
  existingStatus,
}: {
  opportunityId: string;
  existingStatus: string | null;
}) {
  const [state, action, pending] = useActionState(apply, null);

  if (existingStatus) {
    return (
      <p className="mt-6 border-t pt-4 text-sm text-gray-600">
        Status aplikasi kamu: <span className="font-semibold">{existingStatus}</span>
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 border-t pt-4 flex flex-col gap-3">
      <h2 className="font-semibold">Lamar Opportunity Ini</h2>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <textarea
        name="message"
        placeholder="Pesan ke hirer (opsional)"
        className="border rounded px-3 py-2"
        maxLength={1000}
      />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Apply"}
      </button>
    </form>
  );
}
```

**Modifikasi `page.tsx`** — ubah bagian awal menjadi:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { getOpportunityById } from "@/modules/opportunity/queries";
import { getApplicationStatus } from "@/modules/application/queries";
import { ApplyForm } from "./apply-form";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const { data, error } = await getOpportunityById(id);

  if (error || !data) notFound();

  const application =
    user.role === "TALENT"
      ? await getApplicationStatus(user.id, id)
      : null;
```

Lalu tambahkan di bagian bawah (sebelum penutup `</div>`), setelah blok deadline:

```tsx
      {user.role === "TALENT" && (
        <ApplyForm opportunityId={id} existingStatus={application?.status ?? null} />
      )}
```

**Steps:**
- [ ] **Step 1:** Tulis `app/opportunities/[id]/apply-form.tsx`.
- [ ] **Step 2:** Modifikasi `app/opportunities/[id]/page.tsx` (capture `user`, `application`, render `ApplyForm`).
- [ ] **Step 3:** Commit `feat(application): add apply form on opportunity detail`.

---

## Task 8: Applicant list — `app/hirer/opportunities/[id]/applications/page.tsx`

**Files:**
- Create: `app/hirer/opportunities/[id]/applications/page.tsx`

**Interfaces:**
- Consumes: `modules/lib/auth.ts` (`requireRole`), `modules/application/queries.ts` (`listForOpportunity`), `modules/application/actions.ts` (`reviewApplication`, `selectApplication`, `rejectApplication`), `next/navigation` (`notFound`).

**Isi:**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import { listForOpportunity } from "@/modules/application/queries";
import {
  reviewApplication,
  selectApplication,
  rejectApplication,
} from "@/modules/application/actions";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("HIRER");
  const { id } = await params;

  const { applications, maxTalent, selectedCount, error } = await listForOpportunity(
    id,
    user.id,
  );

  if (error) notFound();

  const isFull = selectedCount >= maxTalent;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/hirer/opportunities" className="text-blue-600 text-sm">
        ← Kembali
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">Pelamar</h1>
      <p className="text-sm text-gray-600 mb-4">
        Terpilih {selectedCount} / {maxTalent}
        {isFull && <span className="text-amber-600"> — kuota penuh</span>}
      </p>

      {(applications ?? []).length === 0 && (
        <p className="text-gray-500">Belum ada pelamar.</p>
      )}

      <div className="flex flex-col gap-3">
        {applications.map((a) => (
          <div key={a.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{a.talent?.full_name ?? "Talent"}</p>
              <span className="text-xs bg-gray-100 rounded px-2 py-1">{a.status}</span>
            </div>
            {a.message && (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{a.message}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              {a.status === "APPLIED" && (
                <>
                  <form action={reviewApplication.bind(null, a.id)}>
                    <button className="bg-blue-600 text-white rounded px-3 py-1">
                      Review
                    </button>
                  </form>
                  <form action={rejectApplication.bind(null, a.id)}>
                    <button className="bg-red-600 text-white rounded px-3 py-1">
                      Reject
                    </button>
                  </form>
                </>
              )}
              {a.status === "UNDER_REVIEW" && (
                <>
                  <form action={selectApplication.bind(null, a.id)}>
                    <button
                      disabled={isFull}
                      className="bg-green-600 text-white rounded px-3 py-1 disabled:opacity-50"
                    >
                      Select
                    </button>
                  </form>
                  <form action={rejectApplication.bind(null, a.id)}>
                    <button className="bg-red-600 text-white rounded px-3 py-1">
                      Reject
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Steps:**
- [ ] **Step 1:** Tulis `app/hirer/opportunities/[id]/applications/page.tsx` (isi di atas).
- [ ] **Step 2:** Commit `feat(application): add applicant list page`.

---

## Task 9: Link "Lihat Applicant" — modify `app/hirer/opportunities/page.tsx`

**Files:**
- Modify: `app/hirer/opportunities/page.tsx`

**Isi:** tambahkan link "Lihat Applicant" pada tiap kartu opportunity (dekat tombol action yang sudah ada). Contoh penambahan di blok aksi (setelah `Edit` / di bawah status):

```tsx
<Link
  href={`/hirer/opportunities/${o.id}/applications`}
  className="bg-gray-200 rounded px-3 py-1"
>
  Lihat Applicant
</Link>
```

Tambahkan link ini untuk SEMUA status (bukan hanya DRAFT). Letakkan di baris aksi yang sama.

**Steps:**
- [ ] **Step 1:** Modifikasi `app/hirer/opportunities/page.tsx` (tambah link "Lihat Applicant").
- [ ] **Step 2:** Commit `feat(application): add applicant link in hirer list`.

---

## Task 10: Verification — build & typecheck

**Files:**
- (none)

**Steps:**
- [ ] **Step 1:** Run `npm run build`.
- [ ] **Step 2:** Pastikan TypeScript lulus tanpa error.
- [ ] **Step 3:** Fix semua error type/import bila ada.
- [ ] **Step 4:** Commit perbaikan `fix: resolve build issues` (jika ada).

---

## Testing Note

Tidak ada test runner terpasang. Verifikasi via `npm run build` + `npm run dev` manual:

1. TALENT apply ke opportunity PUBLISHED → muncul `APPLIED` di `/applications`; tombol Apply berubah jadi status.
2. Apply ulang ke opportunity sama → ditolak (duplikat).
3. Apply ke opportunity non-PUBLISHED / deadline lewat → ditolak.
4. HIRER buka `/hirer/opportunities/:id/applications` → lihat pelamar; Review → Select (dengan kuota `max_talent`) / Reject.
5. Reject langsung dari APPLIED.
6. Select diblokir saat `selectedCount >= max_talent` (tombol disabled + service return "Kuota penuh").
7. Non-owner (talent lain / hirer lain) tidak bisa melihat/mengubah application (RLS + ownership check).
8. `npm run build` lulus tanpa error TypeScript.
