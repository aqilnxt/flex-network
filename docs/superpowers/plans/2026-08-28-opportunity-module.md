# Opportunity Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun inti marketplace - HIRER membuat/mengelola opportunity, ADMIN memoderasi, TALENT menelusuri. Modul `modules/opportunity/` di atas skema DB yang sudah live (`001_initial_schema.sql`).

**Architecture:** UI → Server Actions → Application Service → Supabase (server client, RLS aktif). Read-side dipisah ke `queries.ts` karena browse punya banyak filter.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript strict, Supabase SSR (`@supabase/ssr`), Supabase Auth, Zod, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-28-opportunity-module-design.md`

## Global Constraints

- **PUBLISHED ditentukan oleh ADMIN** via moderasi. HIRER hanya submit (`DRAFT → PENDING_REVIEW`); HIRER juga boleh close (`PUBLISHED → CLOSED`).
- **Ikut DB aktual** (bukan API-SPEC yang bentrok):
  - `compensation` = `integer` (bukan string).
  - `cv_requirement` / `portfolio_requirement` / `interview_requirement` = `boolean` (bukan enum).
  - `opportunity_type` / `work_mode` / `compensation_type` = `text` polos; validasi enum di app-layer (Zod), **tanpa migration**.
- **Browse authenticated-only** (`requireUser()` di server component halaman browse/detail).
- **Matching di luar scope** sprint ini.
- Authorization selalu server-side; `requireUser()` / `requireRole()` sebelum mutation; ownership check `hirer_id = user.id`.
- Semua Server Action return `ActionResult<T>`; tidak melempar raw exception ke client.
- RLS aktif; gunakan server client (`lib/supabase/server.ts`), **bukan** `admin.ts`.
- Jangan log data sensitif.
- Impor alias `@/*` → root (tsconfig paths).
- No test runner terpasang; verifikasi = `npm run build` (typecheck) + `npm run dev` manual.
- `cookies()` di Next 16 harus `await` (sudah di-handle `lib/supabase/server.ts`).

## State Machine (di-enforce di service layer)

| Transisi | Dari → Ke | Actor | Action |
|---|---|---|---|
| submit | DRAFT → PENDING_REVIEW | HIRER owner | `submitReview` |
| approve | PENDING_REVIEW → PUBLISHED | ADMIN | `moderate(APPROVE_PUBLISH)` |
| request changes | PENDING_REVIEW → DRAFT | ADMIN | `moderate(REQUEST_CHANGES)` |
| close | PUBLISHED → CLOSED | HIRER owner / ADMIN | `close` / `moderate(CLOSE)` |
| delete | DRAFT → hapus | HIRER owner | `delete` |
| delete | PENDING_REVIEW / CLOSED → hapus | ADMIN | `moderate(DELETE)` |

## File Structure

| File | Tanggung jawab |
|------|----------------|
| `supabase/migrations/006_opportunity_rls.sql` | `is_admin()` helper + policy admin + policy junction tables |
| `modules/opportunity/schemas.ts` | `createOpportunitySchema`, `updateOpportunitySchema`, `moderateSchema` |
| `modules/opportunity/queries.ts` | `listPublished()`, `getOpportunityById()` |
| `modules/opportunity/service.ts` | `createOpty`, `updateOpty`, `submitForReview`, `closeOpty`, `moderateOpty`, `deleteOpty` |
| `modules/opportunity/actions.ts` | Server Actions: `create`, `update`, `submitReview`, `close`, `moderate`, `delete` |
| `app/opportunities/page.tsx` | browse/search/filter |
| `app/opportunities/[id]/page.tsx` | detail |
| `app/hirer/opportunities/page.tsx` | daftar milik hirer |
| `app/hirer/opportunities/new/page.tsx` | form create |
| `app/hirer/opportunities/[id]/edit/page.tsx` | form edit |
| `app/admin/opportunities/page.tsx` | antrean moderasi |

---

## Task 1: Migration `006_opportunity_rls.sql`

**Files:**
- Create: `supabase/migrations/006_opportunity_rls.sql`

**Interfaces:**
- Produces: helper `public.is_admin()`, policy admin additive di `opportunities` (select/update/delete), policy select/insert/delete untuk `opportunity_skills` & `opportunity_interests`. Depend oleh `queries.ts`, `service.ts` (read & moderation via server client).

**Isi:**

```sql
-- 006_opportunity_rls.sql
-- Additive RLS untuk Opportunity Module: admin moderation + junction tables.

-- Helper: true bila pemanggil adalah ADMIN.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- Admin policies (additive / permissive OR) pada opportunities.
-- ---------------------------------------------------------------------------
create policy "opportunities_select_admin"
  on public.opportunities for select to authenticated
  using (public.is_admin());

create policy "opportunities_update_admin"
  on public.opportunities for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "opportunities_delete_admin"
  on public.opportunities for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- opportunity_skills (default-deny): visibility & ownership mengikuti parent.
-- ---------------------------------------------------------------------------
create policy "opportunity_skills_select_visible"
  on public.opportunity_skills for select to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.status = 'PUBLISHED' or o.hirer_id = auth.uid() or public.is_admin())
    )
  );

create policy "opportunity_skills_insert_owner"
  on public.opportunity_skills for insert to authenticated
  with check (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  );

create policy "opportunity_skills_delete_owner_or_admin"
  on public.opportunity_skills for delete to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.hirer_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- opportunity_interests: identik dengan opportunity_skills.
-- ---------------------------------------------------------------------------
create policy "opportunity_interests_select_visible"
  on public.opportunity_interests for select to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.status = 'PUBLISHED' or o.hirer_id = auth.uid() or public.is_admin())
    )
  );

create policy "opportunity_interests_insert_owner"
  on public.opportunity_interests for insert to authenticated
  with check (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.hirer_id = auth.uid()
    )
  );

create policy "opportunity_interests_delete_owner_or_admin"
  on public.opportunity_interests for delete to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.hirer_id = auth.uid() or public.is_admin())
    )
  );
```

**Steps:**
- [ ] **Step 1:** Tulis `supabase/migrations/006_opportunity_rls.sql` (isi di atas).
- [ ] **Step 2:** Review `search_path = ''` + semua referensi `public.`/`auth.` eksplisit.
- [ ] **Step 3:** Commit `feat(db): add opportunity admin and junction RLS policies`.

---

## Task 2: Schemas - `modules/opportunity/schemas.ts`

**Files:**
- Create: `modules/opportunity/schemas.ts`

**Interfaces:**
- Consumes: `zod`.
- Produces: `createOpportunitySchema`, `updateOpportunitySchema`, `moderateSchema`, dan inferred types `CreateOpportunityInput`, `UpdateOpportunityInput`, `ModerateInput`.

**Isi:**

```ts
import { z } from "zod";

export const OPPORTUNITY_TYPES = [
  "INTERNSHIP",
  "PKL",
  "CONTRACT",
  "FREELANCE",
  "TEMPORARY_WORK",
  "DAILY_WORK",
  "EVENT_WORK",
  "PART_TIME",
] as const;

export const WORK_MODES = ["ONSITE", "REMOTE", "HYBRID"] as const;
export const COMPENSATION_TYPES = ["PAID", "UNPAID", "NEGOTIABLE"] as const;

export const createOpportunitySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(10),
  opportunityType: z.enum(OPPORTUNITY_TYPES),
  location: z.string().trim().max(200).optional(),
  workMode: z.enum(WORK_MODES).default("ONSITE"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  workingHours: z.string().trim().max(200).optional(),
  duration: z.string().trim().max(200).optional(),
  compensation: z.coerce.number().int().min(0).optional(),
  compensationType: z.enum(COMPENSATION_TYPES).default("NEGOTIABLE"),
  requirements: z.string().trim().optional(),
  responsibilities: z.string().trim().optional(),
  otherTerms: z.string().trim().optional(),
  maxTalent: z.coerce.number().int().min(1).default(1),
  applicationDeadline: z.string().min(1),
  requiresConsent: z.coerce.boolean().default(false),
  cvRequirement: z.coerce.boolean().default(false),
  portfolioRequirement: z.coerce.boolean().default(false),
  interviewRequirement: z.coerce.boolean().default(false),
  meetingMethod: z.string().trim().optional(),
  skillIds: z.array(z.string().uuid()).default([]),
  interestIds: z.array(z.string().uuid()).default([]),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export const moderateSchema = z.object({
  action: z.enum(["APPROVE_PUBLISH", "REQUEST_CHANGES", "CLOSE", "DELETE"]),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type ModerateInput = z.infer<typeof moderateSchema>;
```

> Catatan mapping FormData → schema dilakukan di `actions.ts` (lihat Task 5): angka via `z.coerce`, `skillIds`/`interestIds` dari `formData.getAll()`, checkbox via `z.coerce.boolean()` (checked = `"on"`).

**Steps:**
- [ ] **Step 1:** Tulis `modules/opportunity/schemas.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(opportunity): add zod schemas`.

---

## Task 3: Queries - `modules/opportunity/queries.ts`

**Files:**
- Create: `modules/opportunity/queries.ts`

**Interfaces:**
- Consumes: `lib/supabase/server.ts` (`createSupabaseServerClient`).
- Produces: `listPublished(filters)` dan `getOpportunityById(id)`.

**Isi:**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OpportunityFilters = {
  search?: string;
  type?: string;
  workMode?: string;
  location?: string;
  compensationType?: string;
  skillId?: string;
  interestId?: string;
  sort?: "newest" | "oldest" | "deadline";
  page?: number;
  limit?: number;
};

export async function listPublished(filters: OpportunityFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;

  let query = supabase
    .from("opportunities")
    .select(
      "*, skills:opportunity_skills(skill:skills(id, name)), interests:opportunity_interests(interest:interests(id, name))",
      { count: "exact" },
    )
    .eq("status", "PUBLISHED");

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }
  if (filters.type) query = query.eq("opportunity_type", filters.type);
  if (filters.workMode) query = query.eq("work_mode", filters.workMode);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.compensationType)
    query = query.eq("compensation_type", filters.compensationType);

  if (filters.skillId) query = query.in("id", await skillIds(filters.skillId, supabase));
  if (filters.interestId) query = query.in("id", await interestIds(filters.interestId, supabase));

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "deadline":
      query = query.order("application_deadline", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  return query;
}
```

> Catatan: helper `skillIds`/`interestIds` mengembalikan array id opportunity dari `opportunity_skills`/`opportunity_interests` (`.eq("skill_id", ...)` / `.eq("interest_id", ...)`), lalu di-`.in("id", ...)`. Ditulis inline saat implementasi; RLS select dari Task 1 mengizinkan baca row `PUBLISHED`.

```ts
export async function getOpportunityById(id: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("opportunities")
    .select(
      "*, hirer:hirer_id(id, full_name), company:hirer_id(hirer_profiles(company_name)), skills:opportunity_skills(skill:skills(id, name)), interests:opportunity_interests(interest:interests(id, name))",
    )
    .eq("id", id)
    .single();
}
```

> Visibility di-enforce oleh RLS (`opportunities_select_published_or_owner` + admin). `.single()` akan return `error` bila row tak terlihat → halaman detail render `notFound()`.

**Steps:**
- [ ] **Step 1:** Tulis `modules/opportunity/queries.ts`.
- [ ] **Step 2:** Commit `feat(opportunity): add read queries`.

---

## Task 4: Service - `modules/opportunity/service.ts`

**Files:**
- Create: `modules/opportunity/service.ts`

**Interfaces:**
- Consumes: `lib/supabase/server.ts`, `modules/opportunity/schemas.ts`.
- Produces: `createOpty`, `updateOpty`, `submitForReview`, `closeOpty`, `moderateOpty`, `deleteOpty`. Masing-masing return `{ data, error }` (objek hasil Supabase) atau object `{ error }` custom; transisi state divalidasi di sini.

**Isi (inti):**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateOpportunityInput,
  UpdateOpportunityInput,
  ModerateInput,
} from "./schemas";

export async function createOpty(hirerId: string, input: CreateOpportunityInput) {
  const supabase = await createSupabaseServerClient();

  const { skillIds, interestIds, ...rest } = input;

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      hirer_id: hirerId,
      title: rest.title,
      description: rest.description,
      opportunity_type: rest.opportunityType,
      location: rest.location,
      work_mode: rest.workMode,
      start_date: rest.startDate,
      end_date: rest.endDate,
      working_hours: rest.workingHours,
      duration: rest.duration,
      compensation: rest.compensation,
      compensation_type: rest.compensationType,
      requirements: rest.requirements,
      responsibilities: rest.responsibilities,
      max_talent: rest.maxTalent,
      application_deadline: rest.applicationDeadline,
      requires_consent: rest.requiresConsent,
      cv_requirement: rest.cvRequirement,
      portfolio_requirement: rest.portfolioRequirement,
      interview_requirement: rest.interviewRequirement,
      meeting_method: rest.meetingMethod,
      other_terms: rest.otherTerms,
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (error || !data) return { data: null, error };

  const id = data.id;
  await syncJunctions(supabase, id, skillIds, interestIds);

  return { data, error: null };
}

async function syncJunctions(
  supabase,
  opportunityId: string,
  skillIds: string[],
  interestIds: string[],
) {
  if (skillIds.length) {
    await supabase.from("opportunity_skills").insert(
      skillIds.map((skillId) => ({ opportunity_id: opportunityId, skill_id: skillId })),
    );
  }
  if (interestIds.length) {
    await supabase.from("opportunity_interests").insert(
      interestIds.map((interestId) => ({ opportunity_id: opportunityId, interest_id: interestId })),
    );
  }
}

export async function updateOpty(hirerId: string, id: string, input: UpdateOpportunityInput) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not found or not owner" } };
  }
  if (existing.status !== "DRAFT" && existing.status !== "PENDING_REVIEW") {
    return { data: null, error: { message: "Status tidak dapat diubah" } };
  }

  const { skillIds, interestIds, ...rest } = input;

  const { data, error } = await supabase
    .from("opportunities")
    .update({
      title: rest.title, description: rest.description, opportunity_type: rest.opportunityType,
      location: rest.location, work_mode: rest.workMode, start_date: rest.startDate,
      end_date: rest.endDate, working_hours: rest.workingHours, duration: rest.duration,
      compensation: rest.compensation, compensation_type: rest.compensationType,
      requirements: rest.requirements, responsibilities: rest.responsibilities,
      max_talent: rest.maxTalent, application_deadline: rest.applicationDeadline,
      requires_consent: rest.requiresConsent, cv_requirement: rest.cvRequirement,
      portfolio_requirement: rest.portfolioRequirement, interview_requirement: rest.interviewRequirement,
      meeting_method: rest.meetingMethod, other_terms: rest.otherTerms,
    })
    .eq("id", id)
    .eq("hirer_id", hirerId);

  if (error) return { data: null, error };

  if (skillIds || interestIds) {
    await supabase.from("opportunity_skills").delete().eq("opportunity_id", id);
    await supabase.from("opportunity_interests").delete().eq("opportunity_id", id);
    await syncJunctions(supabase, id, skillIds ?? [], interestIds ?? []);
  }

  return { data, error: null };
}

export async function submitForReview(hirerId: string, id: string) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id, title, description, application_deadline")
    .eq("id", id)
    .single();

  if (!existing || existing.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not found or not owner" } };
  }
  if (existing.status !== "DRAFT") {
    return { data: null, error: { message: "Hanya DRAFT yang bisa di-submit" } };
  }
  if (!existing.title || !existing.description || !existing.application_deadline) {
    return { data: null, error: { message: "Lengkapi title, description, dan deadline" } };
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update({ status: "PENDING_REVIEW", submitted_for_review_at: new Date().toISOString() })
    .eq("id", id)
    .eq("hirer_id", hirerId);

  return { data, error };
}

export async function closeOpty(actorId: string, id: string, isAdmin: boolean) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id")
    .eq("id", id)
    .single();

  if (!existing) return { data: null, error: { message: "Not found" } };
  if (!isAdmin && existing.hirer_id !== actorId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (existing.status !== "PUBLISHED") {
    return { data: null, error: { message: "Hanya PUBLISHED yang bisa di-close" } };
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update({ status: "CLOSED", closed_at: new Date().toISOString() })
    .eq("id", id);

  return { data, error };
}

export async function moderateOpty(adminId: string, id: string, input: ModerateInput) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) return { data: null, error: { message: "Not found" } };

  const now = new Date().toISOString();
  const meta = {
    moderated_by: adminId,
    moderated_at: now,
    moderation_notes: input.notes ?? null,
  };

  switch (input.action) {
    case "APPROVE_PUBLISH": {
      if (existing.status !== "PENDING_REVIEW") {
        return { data: null, error: { message: "Hanya PENDING_REVIEW yang bisa di-approve" } };
      }
      return supabase
        .from("opportunities")
        .update({ ...meta, status: "PUBLISHED", published_at: now })
        .eq("id", id);
    }
    case "REQUEST_CHANGES": {
      if (existing.status !== "PENDING_REVIEW") {
        return { data: null, error: { message: "Hanya PENDING_REVIEW yang bisa di-request changes" } };
      }
      return supabase
        .from("opportunities")
        .update({ ...meta, status: "DRAFT" })
        .eq("id", id);
    }
    case "CLOSE": {
      if (existing.status !== "PUBLISHED") {
        return { data: null, error: { message: "Hanya PUBLISHED yang bisa di-close" } };
      }
      return supabase
        .from("opportunities")
        .update({ ...meta, status: "CLOSED", closed_at: now })
        .eq("id", id);
    }
    case "DELETE": {
      if (existing.status === "PUBLISHED") {
        return { data: null, error: { message: "PUBLISHED tidak bisa di-delete; close dulu" } };
      }
      return supabase.from("opportunities").delete().eq("id", id);
    }
  }
}

export async function deleteOpty(hirerId: string, id: string) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not found or not owner" } };
  }
  if (existing.status !== "DRAFT") {
    return { data: null, error: { message: "Hanya DRAFT yang bisa di-delete" } };
  }

  return supabase.from("opportunities").delete().eq("id", id);
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/opportunity/service.ts`.
- [ ] **Step 2:** Pastikan state machine di atas sesuai tabel yang di-enforce (transisi ilegal return error).
- [ ] **Step 3:** Commit `feat(opportunity): add service mutations`.

---

## Task 5: Server Actions - `modules/opportunity/actions.ts`

**Files:**
- Create: `modules/opportunity/actions.ts`

**Interfaces:**
- Consumes: `lib/result.ts`, `modules/lib/auth.ts` (`requireUser`/`requireRole`), `modules/opportunity/schemas.ts`, `modules/opportunity/service.ts`.
- Produces: `create`, `update`, `submitReview`, `close`, `moderate`, `delete` (semua return `ActionResult`).

**Isi (inti):**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireUser, requireRole } from "@/modules/lib/auth";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  moderateSchema,
} from "./schemas";
import {
  createOpty,
  updateOpty,
  submitForReview,
  closeOpty,
  moderateOpty,
  deleteOpty,
} from "./service";

const VALIDATION_ERROR = {
  success: false as const,
  error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
};

const INTERNAL_ERROR = {
  success: false as const,
  error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server." },
};

function formString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v;
}

export async function create(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");

  const parsed = createOpportunitySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    opportunityType: formData.get("opportunityType"),
    location: formString(formData.get("location")),
    workMode: formData.get("workMode") ?? "ONSITE",
    startDate: formString(formData.get("startDate")),
    endDate: formString(formData.get("endDate")),
    workingHours: formString(formData.get("workingHours")),
    duration: formString(formData.get("duration")),
    compensation: formString(formData.get("compensation")),
    compensationType: formData.get("compensationType") ?? "NEGOTIABLE",
    requirements: formString(formData.get("requirements")),
    responsibilities: formString(formData.get("responsibilities")),
    otherTerms: formString(formData.get("otherTerms")),
    maxTalent: formData.get("maxTalent") ?? "1",
    applicationDeadline: formData.get("applicationDeadline"),
    requiresConsent: formData.get("requiresConsent"),
    cvRequirement: formData.get("cvRequirement"),
    portfolioRequirement: formData.get("portfolioRequirement"),
    interviewRequirement: formData.get("interviewRequirement"),
    meetingMethod: formString(formData.get("meetingMethod")),
    skillIds: formData.getAll("skillIds"),
    interestIds: formData.getAll("interestIds"),
  });

  if (!parsed.success) return VALIDATION_ERROR;

  const { data, error } = await createOpty(user.id, parsed.data);
  if (error) return INTERNAL_ERROR;

  revalidatePath("/hirer/opportunities");
  redirect(`/hirer/opportunities/${data.id}/edit`);
}

export async function update(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");
  // parsing identik dengan create (partial)
  const parsed = updateOpportunitySchema.safeParse({ /* sama */ });
  if (!parsed.success) return VALIDATION_ERROR;

  const { error } = await updateOpty(user.id, id, parsed.data);
  if (error) return INTERNAL_ERROR;

  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}

export async function submitReview(id: string): Promise<ActionResult> {
  const user = await requireRole("HIRER");
  const { error } = await submitForReview(user.id, id);
  if (error) return { success: false, error: { code: "STATE_ERROR", message: error.message } };
  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}

export async function close(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await closeOpty(user.id, id, user.role === "ADMIN");
  if (error) return { success: false, error: { code: "STATE_ERROR", message: error.message } };
  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}

export async function moderate(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = moderateSchema.safeParse({
    action: formData.get("action"),
    notes: formString(formData.get("notes")),
  });
  if (!parsed.success) return VALIDATION_ERROR;

  const { error } = await moderateOpty(user.id, id, parsed.data);
  if (error) return { success: false, error: { code: "STATE_ERROR", message: error.message } };

  revalidatePath("/admin/opportunities");
  return { success: true, data: null };
}

export async function deleteOpportunity(id: string): Promise<ActionResult> {
  const user = await requireRole("HIRER");
  const { error } = await deleteOpty(user.id, id);
  if (error) return { success: false, error: { code: "STATE_ERROR", message: error.message } };
  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/opportunity/actions.ts`. Lengkapi parsing `update` (partial dari nilai form) secara eksplisit.
- [ ] **Step 2:** Commit `feat(opportunity): add server actions`.

---

## Task 6: Browse page - `app/opportunities/page.tsx`

**Files:**
- Create: `app/opportunities/page.tsx`

**Interfaces:**
- Consumes: `modules/opportunity/queries.ts` (`listPublished`), `modules/lib/auth.ts` (`requireUser`).

**Isi (inti):** server component; `await requireUser()` lalu `await listPublished(filters)` (baca `searchParams` untuk filter). Render grid kartu opportunity (title, work_mode, location, compensation, compensation_type, deadline) + form filter sederhana (GET search params).

```tsx
import { requireUser } from "@/modules/lib/auth";
import { listPublished } from "@/modules/opportunity/queries";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const type = typeof params.type === "string" ? params.type : undefined;
  const workMode = typeof params.workMode === "string" ? params.workMode : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  const { data, count, error } = await listPublished({ search, type, workMode });

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Opportunities</h1>
      {/* form filter + grid data?.map(...) */}
    </div>
  );
}
```

**Steps:**
- [ ] **Step 1:** Tulis `app/opportunities/page.tsx` (filter + list).
- [ ] **Step 2:** Commit `feat(opportunity): add browse page`.

---

## Task 7: Detail page - `app/opportunities/[id]/page.tsx`

**Files:**
- Create: `app/opportunities/[id]/page.tsx`

**Interfaces:**
- Consumes: `modules/opportunity/queries.ts` (`getOpportunityById`), `modules/lib/auth.ts` (`requireUser`), `next/navigation` (`notFound`).

**Isi:** server component; `await requireUser()`; `const { data, error } = await getOpportunityById(params.id)`; bila `error || !data` → `notFound()`; render lengkap (title, description, meta, compensation, requirements, responsibilities, company hirer, skills, interests).

**Steps:**
- [ ] **Step 1:** Tulis `app/opportunities/[id]/page.tsx`.
- [ ] **Step 2:** Commit `feat(opportunity): add detail page`.

---

## Task 8: Hirer list - `app/hirer/opportunities/page.tsx`

**Files:**
- Create: `app/hirer/opportunities/page.tsx`

**Interfaces:**
- Consumes: `lib/supabase/server.ts`, `modules/lib/auth.ts` (`requireRole`).

**Isi:** server component; `await requireRole("HIRER")`; fetch `opportunities` `.eq("hirer_id", user.id)` (semua status) via supabase; list dengan status badge + aksi (submit-review dari list sederhana, edit, close, delete). Tambah tombol "Create".

**Steps:**
- [ ] **Step 1:** Tulis `app/hirer/opportunities/page.tsx`.
- [ ] **Step 2:** Commit `feat(opportunity): add hirer list page`.

---

## Task 9: Hirer create form - `app/hirer/opportunities/new/page.tsx`

**Files:**
- Create: `app/hirer/opportunities/new/page.tsx`
- Create: `app/hirer/opportunities/opportunity-form.tsx`

**Interfaces:**
- Consumes: `modules/opportunity/actions.ts` (`create`), `modules/lib/auth.ts` (`requireRole`).

**Isi:** server component `requireRole("HIRER")` me-render `OpportunityForm` (client component `useActionState(create)`); form field lengkap sesuai schema (title, description, type, location, workMode, date, compensation, requirement booleans, deadline, skillIds/interestIds - untuk sprint ini skill/interest lewat input id manual atau select master-data secukupnya).

**Steps:**
- [ ] **Step 1:** Tulis `opportunity-form.tsx` (client, dipakai new & edit).
- [ ] **Step 2:** Tulis `new/page.tsx`.
- [ ] **Step 3:** Commit `feat(opportunity): add hirer create form`.

---

## Task 10: Hirer edit form - `app/hirer/opportunities/[id]/edit/page.tsx`

**Files:**
- Create: `app/hirer/opportunities/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `lib/supabase/server.ts`, `modules/lib/auth.ts` (`requireRole`), `modules/opportunity/actions.ts` (`update`).

**Isi:** server component `requireRole("HIRER")`; fetch opportunity by id (cek `hirer_id === user.id`, else `notFound()`); render `OpportunityForm` dengan default value + aksi `update` bound ke `id`.

**Steps:**
- [ ] **Step 1:** Tulis `app/hirer/opportunities/[id]/edit/page.tsx`.
- [ ] **Step 2:** Commit `feat(opportunity): add hirer edit form`.

---

## Task 11: Admin moderation page - `app/admin/opportunities/page.tsx`

**Files:**
- Create: `app/admin/opportunities/page.tsx`

**Interfaces:**
- Consumes: `lib/supabase/server.ts`, `modules/lib/auth.ts` (`requireRole`), `modules/opportunity/actions.ts` (`moderate`).

**Isi:** server component `requireRole("ADMIN")`; fetch `opportunities` `.eq("status", "PENDING_REVIEW")` (RLS admin izinkan); list antrean dengan detail singkat + form per-item (`moderate` via `useActionState`, field `action` = approve/request-changes/close/delete + `notes`).

**Steps:**
- [ ] **Step 1:** Tulis `app/admin/opportunities/page.tsx`.
- [ ] **Step 2:** Commit `feat(opportunity): add admin moderation page`.

---

## Task 12: Verification - build & typecheck

**Files:**
- (none)

**Steps:**
- [ ] **Step 1:** Run `npm run build`.
- [ ] **Step 2:** Pastikan TypeScript lulus tanpa error.
- [ ] **Step 3:** Fix semua error type/import bila ada.
- [ ] **Step 4:** Commit perbaikan (jika ada) `fix: resolve build issues`.

---

## Testing Note

Tidak ada test runner terpasang. Verifikasi via `npm run build` + `npm run dev` manual:

1. HIRER create → status DRAFT → edit → submit-review → PENDING_REVIEW.
2. ADMIN buka `/admin/opportunities` → approve → PUBLISHED; request-changes → kembali DRAFT; close; delete.
3. HIRER owner close opportunity PUBLISHED.
4. TALENT browse `/opportunities` (search/filter) + view detail PUBLISHED.
5. Status/ownership ilegal ditolak (mis. HIRER update opportunity milik orang lain, submit non-DRAFT, approve non-PENDING_REVIEW).
6. Junction `opportunity_skills`/`opportunity_interests` terbaca di detail (RLS select bekerja).

> Catatan: `moderated_by`` closed_at`/`published_at`/`submitted_for_review_at` diverifikasi terisi pada transisi terkait.
