# Meeting Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HIRER menjadwalkan meeting untuk application SELECTED, mengelola transisi SCHEDULED → COMPLETED/CANCELLED, dengan RLS involved-parties dan UI inline di applicant list + my applications.

**Architecture:** Modular monolith pattern yang sama dengan modul Application: `modules/meeting/` (schemas → queries → service → actions) di atas tabel `meetings` yang sudah live. RLS policy baru di migration `010`. Contract gate didokumentasikan untuk modul Contract berikutnya.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (server client + RLS), Zod 4, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-08-29-meeting-module-design.md`

## Global Constraints

- Status canonical meeting: `SCHEDULED → COMPLETED / CANCELLED`; CANCELLED & COMPLETED terminal (APPENDIX A.14).
- Schedule hanya dari application `SELECTED`, oleh HIRER owner opportunity (API-SPEC 9.2).
- 1 meeting per application — `UNIQUE(application_id)` sudah ada di DB, jangan diubah.
- Validasi semua input via Zod di server; date/time future check server-side.
- `requireRole("HIRER")` + ownership check (`opportunity.hirer_id = auth.uid()`) sebelum setiap mutation.
- Tidak ada edit/reschedule meeting di sprint ini.
- Tidak ada halaman detail meeting terpisah — info inline.
- Verifikasi project: `npx tsc --noEmit`, `npm run lint`, `npm run build` (tidak ada test framework).
- Commit format: `type(scope): deskripsi imperative lowercase` (lihat `/GIT_COMMIT.md`).

---

### Task 1: Migration `010_meeting_rls.sql` + push

**Files:**
- Create: `supabase/migrations/010_meeting_rls.sql`

**Interfaces:**
- Consumes: tabel `meetings` (001), helper `is_admin()` (006), `opportunities.hirer_id`.
- Produces: RLS aktif granular pada `meetings` — SELECT involved/admin, INSERT/UPDATE hirer owner.

- [ ] **Step 1: Tulis migration**

```sql
-- 010_meeting_rls.sql — granular policies untuk meetings
-- Baseline 003: RLS enabled, default-deny, tanpa policy.

-- SELECT: hirer owner opportunity, talent pemilik application, admin
create policy "meetings_select_involved"
  on public.meetings for select to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id
        and (o.hirer_id = auth.uid() or a.talent_id = auth.uid())
    )
    or is_admin()
  );

-- INSERT: hirer owner; application harus SELECTED (defense-in-depth)
create policy "meetings_insert_hirer"
  on public.meetings for insert to authenticated
  with check (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id
        and o.hirer_id = auth.uid()
        and a.status = 'SELECTED'
    )
  );

-- UPDATE: hirer owner (transisi complete/cancel)
create policy "meetings_update_hirer"
  on public.meetings for update to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = application_id and o.hirer_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Push ke Supabase**

Run: `supabase db push`
Expected: migration applied.

- [ ] **Step 3: Verifikasi policy**

Run: `supabase db query --linked "select policyname, cmd from pg_policies where tablename = 'meetings';"`
Expected: 3 rows (`meetings_select_involved`, `meetings_insert_hirer`, `meetings_update_hirer`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/010_meeting_rls.sql
git commit -m "feat(db): add meetings rls policies"
```

---

### Task 2: Schemas `modules/meeting/schemas.ts`

**Files:**
- Create: `modules/meeting/schemas.ts`

**Interfaces:**
- Produces: `scheduleMeetingSchema`, `ScheduleMeetingInput` (= `z.infer`).

- [ ] **Step 1: Tulis schema**

```ts
import { z } from "zod";

export const scheduleMeetingSchema = z
  .object({
    applicationId: z.string().uuid(),
    meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
    meetingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam tidak valid"),
    meetingLink: z
      .string()
      .trim()
      .url("Link tidak valid")
      .max(500)
      .optional()
      .or(z.literal("")),
    meetingMethod: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (v) => new Date(`${v.meetingDate}T${v.meetingTime}:00`).getTime() > Date.now(),
    { message: "Tanggal & jam meeting harus di masa depan", path: ["meetingDate"] },
  );

export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/meeting/schemas.ts
git commit -m "feat(meeting): add schedule meeting schema"
```

---

### Task 3: Service `modules/meeting/service.ts`

**Files:**
- Create: `modules/meeting/service.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient`, `ScheduleMeetingInput`.
- Produces:
  - `type ServiceResult<T> = { data: T | null; error: { message: string } | null }`
  - `schedule(hirerId: string, input: ScheduleMeetingInput): Promise<ServiceResult<{ opportunityId: string }>>`
  - `complete(hirerId: string, meetingId: string): Promise<ServiceResult<{ opportunityId: string }>>`
  - `cancel(hirerId: string, meetingId: string): Promise<ServiceResult<{ opportunityId: string }>>`

- [ ] **Step 1: Tulis service**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ScheduleMeetingInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

async function getOwnedApplication(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  hirerId: string,
  applicationId: string,
): Promise<ServiceResult<{ id: string; status: string; opportunityId: string }>> {
  const { data: application } = await supabase
    .from("applications")
    .select("id, status, opportunity_id")
    .eq("id", applicationId)
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

export async function schedule(
  hirerId: string,
  input: ScheduleMeetingInput,
): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: app, error: ownedError } = await getOwnedApplication(
    supabase,
    hirerId,
    input.applicationId,
  );
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "SELECTED") {
    return {
      data: null,
      error: { message: "Meeting hanya bisa dijadwalkan untuk application SELECTED" },
    };
  }

  const { data: existing } = await supabase
    .from("meetings")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();

  if (existing) {
    return { data: null, error: { message: "Meeting sudah dijadwalkan" } };
  }

  const { error } = await supabase.from("meetings").insert({
    application_id: input.applicationId,
    meeting_date: input.meetingDate,
    meeting_time: input.meetingTime,
    meeting_link: input.meetingLink || null,
    meeting_method: input.meetingMethod || null,
    notes: input.notes ?? null,
    status: "SCHEDULED",
  });

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Meeting sudah dijadwalkan" } };
    }
    return { data: null, error: { message: error.message } };
  }

  return { data: { opportunityId: app.opportunityId }, error: null };
}

async function getOwnedMeeting(
  hirerId: string,
  meetingId: string,
): Promise<
  ServiceResult<{ id: string; status: string; opportunityId: string }>
> {
  const supabase = await createSupabaseServerClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, status, application_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) {
    return { data: null, error: { message: "Meeting tidak ditemukan" } };
  }

  return getOwnedApplication(supabase, hirerId, meeting.application_id);
}

export async function complete(
  hirerId: string,
  meetingId: string,
): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: meeting, error: ownedError } = await getOwnedMeeting(hirerId, meetingId);
  if (ownedError || !meeting) return { data: null, error: ownedError };
  if (meeting.status !== "SCHEDULED") {
    return { data: null, error: { message: "Hanya SCHEDULED yang bisa diselesaikan" } };
  }

  const { error } = await supabase
    .from("meetings")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", meetingId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { opportunityId: meeting.opportunityId }, error: null };
}

export async function cancel(
  hirerId: string,
  meetingId: string,
): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: meeting, error: ownedError } = await getOwnedMeeting(hirerId, meetingId);
  if (ownedError || !meeting) return { data: null, error: ownedError };
  if (meeting.status !== "SCHEDULED") {
    return { data: null, error: { message: "Hanya SCHEDULED yang bisa dibatalkan" } };
  }

  const { error } = await supabase
    .from("meetings")
    .update({ status: "CANCELLED" })
    .eq("id", meetingId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { opportunityId: meeting.opportunityId }, error: null };
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/meeting/service.ts
git commit -m "feat(meeting): add meeting service with state machine"
```

---

### Task 4: Queries `modules/meeting/queries.ts`

**Files:**
- Create: `modules/meeting/queries.ts`

**Interfaces:**
- Produces:
  - `type MeetingRow = { id, application_id, meeting_date, meeting_time, meeting_link, meeting_method, notes, status, completed_at }`
  - `getByApplicationId(applicationId: string): Promise<MeetingRow | null>` — contract gate + inline render.
  - `listForApplications(applicationIds: string[]): Promise<Map<string, MeetingRow>>` — batch render tanpa N+1.

- [ ] **Step 1: Tulis queries**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MeetingRow = {
  id: string;
  application_id: string;
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_link: string | null;
  meeting_method: string | null;
  notes: string | null;
  status: string;
  completed_at: string | null;
};

export async function getByApplicationId(
  applicationId: string,
): Promise<MeetingRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("meetings")
    .select(
      "id, application_id, meeting_date, meeting_time, meeting_link, meeting_method, notes, status, completed_at",
    )
    .eq("application_id", applicationId)
    .maybeSingle();
  return (data as unknown as MeetingRow) ?? null;
}

export async function listForApplications(
  applicationIds: string[],
): Promise<Map<string, MeetingRow>> {
  const map = new Map<string, MeetingRow>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("meetings")
    .select(
      "id, application_id, meeting_date, meeting_time, meeting_link, meeting_method, notes, status, completed_at",
    )
    .in("application_id", applicationIds);

  for (const m of (data as unknown as MeetingRow[]) ?? []) {
    map.set(m.application_id, m);
  }
  return map;
}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/meeting/queries.ts
git commit -m "feat(meeting): add meeting queries"
```

---

### Task 5: Server Actions `modules/meeting/actions.ts`

**Files:**
- Create: `modules/meeting/actions.ts`

**Interfaces:**
- Consumes: `scheduleMeetingSchema`, `schedule/complete/cancel` service, `requireRole("HIRER")`, `ActionResult`.
- Produces:
  - `scheduleMeeting(_prev: ActionResult | null, formData: FormData): Promise<ActionResult>` (useActionState)
  - `completeMeeting(meetingId: string, opportunityId: string): Promise<void>`
  - `cancelMeeting(meetingId: string, opportunityId: string): Promise<void>`

- [ ] **Step 1: Tulis actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireRole } from "@/modules/lib/auth";
import { scheduleMeetingSchema } from "./schemas";
import { schedule as scheduleService, complete, cancel } from "./service";

function formString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v;
}

export async function scheduleMeeting(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");

  const applicationId = formData.get("applicationId");
  const opportunityId = formData.get("opportunityId");

  const parsed = scheduleMeetingSchema.safeParse({
    applicationId: typeof applicationId === "string" ? applicationId : "",
    meetingDate: formData.get("meetingDate"),
    meetingTime: formData.get("meetingTime"),
    meetingLink: formData.get("meetingLink") ?? "",
    meetingMethod: formString(formData.get("meetingMethod")),
    notes: formString(formData.get("notes")),
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

  const { error } = await scheduleService(user.id, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "MEETING_ERROR", message: error.message },
    };
  }

  revalidatePath(`/hirer/opportunities/${opportunityId}/applications`);
  revalidatePath("/applications");
  return { success: true, data: null };
}

export async function completeMeeting(
  meetingId: string,
  opportunityId: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await complete(user.id, meetingId);
  if (error) return;
  revalidatePath(`/hirer/opportunities/${opportunityId}/applications`);
  revalidatePath("/applications");
  redirect(`/hirer/opportunities/${opportunityId}/applications`);
}

export async function cancelMeeting(
  meetingId: string,
  opportunityId: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await cancel(user.id, meetingId);
  if (error) return;
  revalidatePath(`/hirer/opportunities/${opportunityId}/applications`);
  revalidatePath("/applications");
  redirect(`/hirer/opportunities/${opportunityId}/applications`);
}
```

Catatan: import `schedule as scheduleService, complete, cancel` dari `./service`. `opportunityId` dibawa via arg (plain form action `bind`) supaya `redirect()` deterministik tanpa query tambahan.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/meeting/actions.ts
git commit -m "feat(meeting): add meeting server actions"
```

---

### Task 6: Form jadwal (client component)

**Files:**
- Create: `app/hirer/opportunities/[id]/applications/schedule-meeting-form.tsx`

**Interfaces:**
- Consumes: `scheduleMeeting` action (Task 5).
- Produces: `<ScheduleMeetingForm applicationId={string} opportunityId={string} />` — dipakai Task 7.

- [ ] **Step 1: Tulis form**

```tsx
"use client";

import { useActionState } from "react";
import { scheduleMeeting } from "@/modules/meeting/actions";

export function ScheduleMeetingForm({
  applicationId,
  opportunityId,
}: {
  applicationId: string;
  opportunityId: string;
}) {
  const [state, action, pending] = useActionState(scheduleMeeting, null);

  return (
    <form action={action} className="mt-3 border-t pt-3 flex flex-col gap-2">
      <p className="text-sm font-medium">Jadwalkan Meeting</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          name="meetingDate"
          required
          className="border rounded px-3 py-1"
        />
        <input
          type="time"
          name="meetingTime"
          required
          className="border rounded px-3 py-1"
        />
        <input
          name="meetingMethod"
          placeholder="Metode (mis. Google Meet)"
          maxLength={100}
          className="border rounded px-3 py-1"
        />
      </div>
      <input
        name="meetingLink"
        placeholder="Link meeting (opsional)"
        className="border rounded px-3 py-1"
      />
      <textarea
        name="notes"
        placeholder="Catatan (opsional)"
        maxLength={1000}
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
        {pending ? "Menjadwalkan..." : "Jadwalkan"}
      </button>
    </form>
  );
}
```

Catatan: validasi future date server-side (schema refine); atribut `min` HTML tidak dipakai sebagai satu-satunya guard.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/hirer/opportunities/\[id\]/applications/schedule-meeting-form.tsx
git commit -m "feat(meeting): add schedule meeting form"
```

---

### Task 7: Applicant list — render meeting + aksi

**Files:**
- Modify: `app/hirer/opportunities/[id]/applications/page.tsx`

**Interfaces:**
- Consumes: `listForApplications`, `getByApplicationId` tidak perlu (batch via list), `completeMeeting`/`cancelMeeting` (Task 5), `ScheduleMeetingForm` (Task 6).
- Produces: UI aksi meeting per application.

- [ ] **Step 1: Tambah import**

```tsx
import { listForApplications } from "@/modules/meeting/queries";
import { completeMeeting, cancelMeeting } from "@/modules/meeting/actions";
import { ScheduleMeetingForm } from "./schedule-meeting-form";
```

- [ ] **Step 2: Batch fetch meetings setelah `listForOpportunity`**

```tsx
const meetings = await listForApplications(
  (applications ?? []).map((a) => a.id),
);
```

- [ ] **Step 3: Render blok meeting di dalam tiap card, setelah blok aksi review/select/reject**

```tsx
{(() => {
  const meeting = meetings.get(a.id);
  if (a.status !== "SELECTED" && !meeting) return null;
  return (
    <div className="mt-3 border-t pt-3">
      {!meeting && a.status === "SELECTED" && (
        <ScheduleMeetingForm applicationId={a.id} opportunityId={id} />
      )}
      {meeting && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Meeting: {meeting.meeting_date ?? "-"} {meeting.meeting_time ?? ""}
            </span>
            <span className="text-xs bg-gray-100 rounded px-2 py-1">
              {meeting.status}
            </span>
          </div>
          {meeting.meeting_method && (
            <p className="text-sm text-gray-600">Metode: {meeting.meeting_method}</p>
          )}
          {meeting.meeting_link && (
            <a
              href={meeting.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 break-all"
            >
              {meeting.meeting_link}
            </a>
          )}
          {meeting.notes && (
            <p className="text-sm text-gray-600 mt-1">{meeting.notes}</p>
          )}
          {meeting.status === "SCHEDULED" && (
            <div className="flex gap-2 mt-2">
              <form action={completeMeeting.bind(null, meeting.id, id)}>
                <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                  Tandai Selesai
                </button>
              </form>
              <form action={cancelMeeting.bind(null, meeting.id, id)}>
                <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">
                  Batalkan
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
})()}
```

Catatan implementasi: variabel di JSX memakai `meetings` sebagai nama `Map` (rename dari contoh `listForApplications(...)` return). Jangan render form jadwal bila meeting sudah ada (APA PUN statusnya).

- [ ] **Step 4: Verifikasi typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/hirer/opportunities/[id]/applications/"
git commit -m "feat(meeting): add schedule form and meeting actions to applicant list"
```

---

### Task 8: Halaman My Applications (TALENT) — blok meeting read-only

**Files:**
- Modify: `app/applications/page.tsx`

**Interfaces:**
- Consumes: `listForTalent` (existing), `listForApplications` (Task 4).
- Produces: info meeting inline per application.

- [ ] **Step 1: Batch fetch + render**

Setelah `listForTalent(user.id)`, fetch meetings untuk semua application id lalu render blok di bawah status tiap item:

```tsx
const meetingMap = await listForApplications(applications.map((a) => a.id));
```

Per item (hanya bila `meetingMap.get(a.id)` ada):

```tsx
{meeting && (
  <div className="mt-2 border rounded p-3 bg-gray-50 text-sm">
    <p className="font-medium">
      Meeting {meeting.status} — {meeting.meeting_date ?? "-"}{" "}
      {meeting.meeting_time ?? ""}
    </p>
    {meeting.meeting_method && <p className="text-sm text-gray-600">Metode: {meeting.meeting_method}</p>}
    {meeting.meeting_link && (
      <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 break-all">
        {meeting.meeting_link}
      </a>
    )}
  </div>
)}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/applications/page.tsx
git commit -m "feat(meeting): show meeting info on my applications"
```

---

### Task 9: Build & typecheck verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: semua PASS tanpa error.

- [ ] **Step 2: E2E smoke manual (2 akun browser)**

1. HIRER select application → form jadwal muncul di applicant list.
2. Schedule dengan tanggal lewat → ditolak ("harus di masa depan").
3. Schedule valid → muncul info SCHEDULED + tombol Tandai Selesai/Batalkan.
4. Schedule kedua kali → ditolak ("Meeting sudah dijadwalkan").
5. TALENT buka `/applications` → lihat info meeting (tanpa tombol aksi).
6. Tandai Selesai → status COMPLETED + `completed_at` terisi (cek DB).
7. Akun HIRER lain coba akses meeting opportunity lain → tidak terlihat/tolak (RLS).
8. Cancel path: buat application SELECTED lain → schedule → Batalkan → badge CANCELLED, tanpa aksi.

- [ ] **Step 3: Commit (jika ada perbaikan)**

```bash
git add -A
git commit -m "fix(meeting): address smoke test findings"
```

---

### Task 10: Update `docs/PROGRESS.md`

- [ ] **Step 1: Update progress**

- Pindahkan "Module Meeting" ke "Sudah Selesai" (Task 1–9).
- Decision Log tambah: `2026-08-29: Meeting CANCELLED terminal, tanpa edit/reschedule (YAGNI); contract gate = getByApplicationId, di-enforce modul Contract`.
- Status terakhir: Sprint 5 — Meeting Module selesai.

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update progress meeting module"
```

---

## Self-Review Notes

- **Spec coverage:** Migration RLS (Task 1), schemas (2), service state machine (3), queries + contract gate (4), actions (5), UI applicant list (6), UI talent (8), verification (9). Semua acceptance criteria terpetakan.
- **Placeholder scan:** tidak ada TBD/TODO; semua step berisi kode konkret.
- **Type consistency:** `MeetingRow` dipakai konsisten di Task 4/5/6/8; `completeMeeting(meetingId, opportunityId)` signature sama di Task 5 & 6; service `ServiceResult` shape konsisten dengan modul application.
