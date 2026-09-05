# Guardian Consent Magic Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti self-approve consent simulasi jadi approval wali via magic link email (token DB one-time expire 48 jam, halaman publik /consent/[token]).

**Architecture:** Extend modules/consent: requestConsent menerima guardianEmail + issue token (SHA-256 hash di DB consent_tokens, RLS default-deny), resolusi via resolveConsentByToken (admin client, halaman publik tanpa session). Fungsi approve/reject aktor talent dihapus — self-approve ditutup. Email via sendEmail existing, notif via notify existing.

**Tech Stack:** Next.js 16 App Router, React 19, TS strict, Supabase (admin + session client), Zod, crypto (Node), SHA-256.

**Spec:** `docs/superpowers/specs/2026-09-05-guardian-consent-design.md`

## Global Constraints

- Token: `crypto.randomBytes(32).toString("hex")` (64 char), DB simpan SHA-256 hash-nya, expire 48 jam, one-time via used_at.
- Race guard DB-level: `update consent_tokens set used_at = now() where id = X and used_at is null` — hanya lanjut update consents kalau ada affected row.
- Halaman publik merender hanya data aman: nama talent, role_title, org, durasi, kompensasi (tanpa email wali/talent).
- Self-approve TALENT dihapus total: service approve/reject + actions approveConsent/rejectConsent + UI tombol di app/applications/page.tsx.
- Email best-effort: `.catch(() => {})` — kegagalan email tidak gagalkan request consent (token tetap tersimpan).
- logAudit actorType SYSTEM, action `CONSENT_GUARDIAN_APPROVED` / `CONSENT_GUARDIAN_REJECTED`.
- Notif talent type `CONSENT_RESOLVED`, title "Consent Wali Disetujui" / "Consent Wali Ditolak", link `/applications`.
- getConsentDecision (queries.ts) TIDAK diubah — contract/signature gate tetap jalan.
- Commit format: `type(scope): deskripsi imperative lowercase`.
- Verify per task: `npx tsc --noEmit` exit 0 (jalankan dengan `env -u NODE_OPTIONS`).
- Working tree punya drift milik user — stage HANYA file task.

---

### Task 1: Migration `025_guardian_consent.sql`

**Files:**
- Create: `supabase/migrations/025_guardian_consent.sql`

**Interfaces:**
- Produces: kolom `consents.guardian_email text`, tabel `consent_tokens (id, consent_id unique fk, token_hash unique, expires_at, used_at, created_at)` RLS default-deny.

- [ ] **Step 1: Tulis migration**

```sql
-- 025_guardian_consent.sql
-- Guardian consent via magic link: email wali + tabel token (hashed, one-time, expire 48h).

alter table public.consents add column guardian_email text;

create table public.consent_tokens (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null unique references public.consents (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.consent_tokens enable row level security;
-- default-deny: tanpa policy — semua akses via service layer (admin client).
```

- [ ] **Step 2: Push**

Run: `supabase db push`
Expected: applied.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/025_guardian_consent.sql
git commit -m "feat(consent): migration email wali + tabel consent token"
```

---

### Task 2: Token helper + service token issue/resolve

**Files:**
- Create: `modules/consent/tokens.ts`
- Modify: `modules/consent/service.ts`
- Modify: `modules/consent/schemas.ts`

**Interfaces:**
- Consumes: `admin` dari `@/lib/supabase/admin`; `sendEmail` dari `@/modules/notification/email`; `notify` dari `@/modules/notification/service`; `logAudit` dari `@/modules/audit/service`.
- Produces:
  - `issueConsentToken(consentId: string): Promise<string>` — return RAW token (untuk link), upsert by consent_id (reset used_at, perpanjang expires).
  - `resolveConsentByToken(rawToken: string, decision: "APPROVED" | "REJECTED"): Promise<ServiceResult<null>>` — guard exists/unused/unexpired/PENDING; update consents + used_at; notify + audit.
  - `createConsentSchema` + field `guardianEmail: z.string().email("Email wali tidak valid")`.

- [ ] **Step 1: schemas.ts — extend**

```ts
export const createConsentSchema = z.object({
  applicationId: z.string().uuid("Application tidak valid"),
  guardianEmail: z.string().email("Email wali tidak valid"),
});
```
Type `CreateConsentInput` otomatis via infer.

- [ ] **Step 2: tokens.ts**

```ts
import "server-only";
import { createHash, randomBytes } from "crypto";
import { admin } from "@/lib/supabase/admin";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Upsert token per consent (unique consent_id) — re-request mengganti token lama.
export async function issueConsentToken(consentId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const { error } = await admin.from("consent_tokens").upsert(
    {
      consent_id: consentId,
      token_hash: hashToken(raw),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      used_at: null,
    },
    { onConflict: "consent_id" },
  );
  if (error) throw new Error(`Gagal membuat token: ${error.message}`);
  return raw;
}
```

- [ ] **Step 3: service.ts — requestConsent + email wali**

Di `requestConsent`, setelah insert consents sukses (sebelum return):
```ts
// simpan email wali + kirim magic link (best-effort)
await supabase
  .from("consents")
  .update({ guardian_email: input.guardianEmail })
  .eq("id", consentId);
```
CATATAN: insert consents harus diubah ke `.insert({...}).select("id").single()` untuk dapat consentId (sekarang tanpa select). Untuk nama talent + role + org: query `applications → opportunities(title)` + `profiles(full_name)` by talentId sebelum insert (join: application sudah di-load di loadConsentContext; tambahkan select `opportunity:opportunities(title)` di application query dan `getProfileName` via supabase session `profiles(full_name).eq(id, talentId)`).

Lalu (best-effort, jangan throw):
```ts
const rawToken = await issueConsentToken(consentId);
sendEmail({
  to: input.guardianEmail,
  title: "Persetujuan Wali Diperlukan",
  message: `${talentName} meminta persetujuan Anda untuk mengikuti opportunity "${opportunityTitle}". Buka tautan untuk menyetujui atau menolak. Tautan berlaku 48 jam.`,
  link: `/consent/${rawToken}`,
}).catch(() => {});
```
Import `sendEmail` dari `@/modules/notification/email` dan `issueConsentToken` dari `./tokens`.

- [ ] **Step 4: service.ts — resolveConsentByToken + hapus approve/reject**

HAPUS fungsi `approve`, `reject`, `getOwnedConsent` (self-approve path). Tambah:

```ts
export async function resolveConsentByToken(
  rawToken: string,
  decision: "APPROVED" | "REJECTED",
): Promise<ServiceResult<null>> {
  const { data: token } = await admin
    .from("consent_tokens")
    .select("id, expires_at, used_at, consent_id")
    .eq("token_hash", hashToken(rawToken))
    .maybeSingle();
  if (!token) return { data: null, error: { message: "Link tidak valid" } };
  if (token.used_at) return { data: null, error: { message: "Link sudah digunakan" } };
  if (new Date(token.expires_at) < new Date())
    return { data: null, error: { message: "Link kedaluwarsa" } };

  const { data: consent } = await admin
    .from("consents")
    .select("id, status, talent_id, application_id")
    .eq("id", token.consent_id)
    .single();
  if (!consent) return { data: null, error: { message: "Consent tidak ditemukan" } };
  if (consent.status !== "PENDING")
    return { data: null, error: { message: "Consent sudah diputuskan" } };

  const now = new Date().toISOString();
  // one-time race guard: klaim token dulu
  const { data: claimed } = await admin
    .from("consent_tokens")
    .update({ used_at: now })
    .eq("id", token.id)
    .is("used_at", null)
    .select("id")
    .single();
  if (!claimed) return { data: null, error: { message: "Link sudah digunakan" } };

  const { error: updateError } = await admin
    .from("consents")
    .update(
      decision === "APPROVED"
        ? { status: "APPROVED", approved_at: now }
        : { status: "REJECTED", rejected_at: now },
    )
    .eq("id", consent.id);
  if (updateError) return { data: null, error: { message: updateError.message } };

  notify({
    recipientId: consent.talent_id,
    type: "CONSENT_RESOLVED",
    title: decision === "APPROVED" ? "Consent Wali Disetujui" : "Consent Wali Ditolak",
    message:
      decision === "APPROVED"
        ? "Wali Anda telah menyetujui partisipasi. Silakan lanjut pembuatan kontrak."
        : "Wali Anda menolak partisipasi ini.",
    link: "/applications",
    metadata: { consentId: consent.id },
  }).catch(() => {});

  logAudit({
    actorId: null,
    actorType: "SYSTEM",
    action: decision === "APPROVED" ? "CONSENT_GUARDIAN_APPROVED" : "CONSENT_GUARDIAN_REJECTED",
    resourceType: "consent",
    resourceId: consent.id,
    metadata: { decision },
  }).catch(() => {});

  return { data: null, error: null };
}
```
Imports tambahan service.ts: `admin` dari `@/lib/supabase/admin`, `hashToken` dari `./tokens`, `notify` dari `@/modules/notification/service`, `logAudit` dari `@/modules/audit/service`.

- [ ] **Step 5: Verify + commit**

Run: `env -u NODE_OPTIONS npx tsc --noEmit` → akan error di modules/consent/actions.ts + app/applications/page.tsx + consent-request-form.tsx (approve/reject import + guardianEmail belum ada) — Task ini TIDAK memperbaikinya. Untuk tetap verifiable: perbaiki import compile minimum di task ini HANYA untuk actions.ts (hapus approve/reject action + import-nya — kontennya di Task 3) → tsc expected sisanya error di UI file → jalankan `npx tsc --noEmit 2>&1 | grep -c "error"` dan catat jumlah; error di app/applications/* akan diselesaikan Task 4. Alternatif lebih bersih: Task ini commit service+tokens+schemas saja dan MENERIMA tsc error sementara di file Task-3/4 (checkout package build tak dijalankan sampai Task 4 selesai). Pilih: jalankan tsc, error di file luar scope task diabaikan sementara (documented); Task 4 menutup semuanya.

```bash
git add modules/consent/tokens.ts modules/consent/service.ts modules/consent/schemas.ts
git commit -m "feat(consent): token wali + resolve via link, hapus self-approve"
```

---

### Task 3: Actions — hapus lama, tambah resolve

**Files:**
- Modify: `modules/consent/actions.ts`

**Interfaces:**
- Consumes: `resolveConsentByToken(rawToken, decision)` (Task 2).
- Produces: `resolveConsentAction(token: string, decision: string): Promise<void>` — server action untuk halaman publik; sukses → `redirect(/consent/<token>?done=1)`; gagal → `redirect(/consent/<token>?error=<msg>)`. `createConsent` action existing — parse TAMBAHAN `guardianEmail` dari formData.

- [ ] **Step 1: Rewrite actions.ts**

Hapus `approveConsent` + `rejectConsent` + import service-nya. `createConsent` — tambah:
```ts
const guardianEmail = formData.get("guardianEmail");
// safeParse input: { applicationId, guardianEmail: typeof guardianEmail === "string" ? guardianEmail : "" }
```
Tambah action:
```ts
export async function resolveConsentAction(token: string, decision: string): Promise<void> {
  "use server"; // sudah file-level
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    redirect(`/consent/${token}?error=Keputusan%20tidak%20valid`);
  }
  const { error } = await resolveConsentByToken(token, decision);
  if (error) {
    redirect(`/consent/${token}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/consent/${token}?done=1`);
}
```
Import `resolveConsentByToken` dari `./service`, `redirect` dari `next/navigation` (sudah ada), hapus import approve/reject service. `revalidatePath("/applications")` tidak perlu di resolve (halaman publik; talent melihat perubahan saat membuka aplikasinya).

- [ ] **Step 2: Verify**

Run: `env -u NODE_OPTIONS npx tsc --noEmit`
Expected: error tersisa HANYA di `app/applications/page.tsx` + `app/applications/consent-request-form.tsx` (import approve/reject + form field — Task 4). Catat jumlah error.

- [ ] **Step 3: Commit**

```bash
git add modules/consent/actions.ts
git commit -m "feat(consent): action resolve via token, hapus action self-approve"
```

---

### Task 4: UI — consent-request-form + applications page + halaman publik

**Files:**
- Modify: `app/applications/consent-request-form.tsx` (input Email Wali)
- Modify: `app/applications/page.tsx` (hapus tombol Setujui/Tolak simulasi → info menunggu wali)
- Create: `app/consent/[token]/page.tsx`
- Modify: `modules/consent/queries.ts` (getConsentPageData)

**Interfaces:**
- Consumes: `createConsent` action formData `applicationId` + `guardianEmail`; `resolveConsentAction(token, decision)`; `admin` client; `hashToken` dari `./tokens`.
- Produces: halaman publik `/consent/[token]` — render detail + dua form; state invalid/expired/used/done/error.

- [ ] **Step 1: queries.ts — getConsentPageData**

```ts
import { admin } from "@/lib/supabase/admin";
import { hashToken } from "./tokens";

export type ConsentPageData = {
  talentName: string;
  roleTitle: string | null;
  organization: string | null;
  duration: string | null;
  compensation: number | null;
};

// null = token invalid/used/expired. Caller menampilkan pesan generik.
export async function getConsentPageData(rawToken: string): Promise<ConsentPageData | null> {
  const { data: token } = await admin
    .from("consent_tokens")
    .select("used_at, expires_at, consent:consents(talent_id, application_id)")
    .eq("token_hash", hashToken(rawToken))
    .maybeSingle();
  if (!token || token.used_at || new Date(token.expires_at) < new Date()) return null;
  const consent = token.consent as { talent_id: string; application_id: string } | null;
  if (!consent) return null;

  const { data: app } = await admin
    .from("applications")
    .select("opportunity:opportunities(title, compensation, hirer:hirer_id(full_name))")
    .eq("id", consent.application_id)
    .single();
  const { data: talent } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", consent.talent_id)
    .single();

  const opp = app?.opportunity as
    | { title?: string | null; compensation?: number | null; hirer?: { full_name: string | null } | null }
    | null;
  return {
    talentName: talent?.full_name ?? "Talent",
    roleTitle: opp?.title ?? null,
    organization: opp?.hirer?.full_name ?? null,
    duration: null,
    compensation: opp?.compensation ?? null,
  };
}
```
CATATAN implementer: `duration` sengaja null (opportunities tak punya kolom duration — yang ada di contracts). `hirer:hirer_id(full_name)` = column-hint pattern terbukti (opportunity/queries.ts:92). Jangan render baris durasi di page kalau null.

- [ ] **Step 2: consent-request-form.tsx — tambah input**

Baca file dulu, lalu tambah di dalam form (setelah hidden applicationId):
```tsx
<div className="flex flex-col gap-1.5">
  <label htmlFor="guardianEmail" className="text-sm font-medium">
    Email Wali
  </label>
  <input
    id="guardianEmail"
    name="guardianEmail"
    type="email"
    required
    placeholder="wali@email.com"
  />
</div>
```
Sesuaikan markup dengan struktur form existing.

- [ ] **Step 3: applications/page.tsx — hapus self-approve UI**

Hapus import `approveConsent, rejectConsent` dari `@/modules/consent/actions` (baris 9). Ganti seluruh blok `{consent?.status === "PENDING" && (...)}` (baris ~124-140) menjadi:
```tsx
{consent?.status === "PENDING" && (
  <div className="text-sm">
    <p className="font-medium">Consent wali menunggu persetujuan wali.</p>
    <p className="text-ink-2">
      Link persetujuan telah dikirim ke email wali yang Anda daftarkan.
      Tautan berlaku 48 jam.
    </p>
  </div>
)}
```
Hapus kedua form tombol Setujui (Simulasi) / Tolak.

- [ ] **Step 4: app/consent/[token]/page.tsx (create)**

```tsx
import type { ReactNode } from "react";
import { resolveConsentAction } from "@/modules/consent/actions";
import { getConsentPageData } from "@/modules/consent/queries";

export default async function ConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { token } = await params;
  const { done, error } = await searchParams;

  if (done) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">Persetujuan Tercatat</h1>
        <p className="mt-2 text-sm text-ink-2">
          Terima kasih. Keputusan Anda telah disimpan dan talent telah diberi tahu.
        </p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">Link Tidak Dapat Diproses</h1>
        <p className="mt-2 text-sm text-ink-2">{error}</p>
        <p className="mt-1 text-sm text-ink-2">
          Minta talent mengirim ulang link persetujuan bila diperlukan.
        </p>
      </Shell>
    );
  }

  const data = await getConsentPageData(token);
  if (!data) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">Link Tidak Valid atau Kedaluwarsa</h1>
        <p className="mt-2 text-sm text-ink-2">
          Link persetujuan ini sudah digunakan, kedaluwarsa, atau tidak dikenal.
          Minta talent mengirim ulang link persetujuan.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold tracking-tight">Persetujuan Wali</h1>
      <p className="mt-1 text-sm text-ink-2">
        {data.talentName} meminta persetujuan Anda untuk opportunity berikut:
      </p>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Role</dt>
          <dd className="font-medium">{data.roleTitle ?? "-"}</dd>
        </div>
        {data.organization && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Organisasi</dt>
            <dd className="font-medium">{data.organization}</dd>
          </div>
        )}
        {data.compensation != null && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Kompensasi</dt>
            <dd className="font-medium">Rp {data.compensation}</dd>
          </div>
        )}
      </dl>
      <div className="mt-6 flex gap-3">
        <form action={resolveConsentAction.bind(null, token, "APPROVED")}>
          <button className="btn-primary h-11 px-5 text-sm">Setujui</button>
        </form>
        <form action={resolveConsentAction.bind(null, token, "REJECTED")}>
          <button className="btn-danger h-11 px-5 text-sm">Tolak</button>
        </form>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="card p-6">{children}</div>
    </div>
  );
}
```
btn-danger class ada di globals.css. bind pattern = startWork/propose existing.

- [ ] **Step 5: Verify + commit**

Run: `env -u NODE_OPTIONS npx tsc --noEmit` → 0 error.
Run: `env -u NODE_OPTIONS npm run build` → sukses.

```bash
git add app/applications/consent-request-form.tsx app/applications/page.tsx "app/consent" modules/consent/queries.ts
git commit -m "feat(consent): halaman persetujuan wali publik + form email wali"
```

---

### Task 5: E2E manual + docs + deploy

**Files:**
- Modify: `docs/PROGRESS.md`, `docs/FUTURE-ROADMAP.md`

**Interfaces:**
- Consumes: semua task; smoke TALENT `smoke-talent-consent@example.test` / `Smoke123!`; admin REST untuk inspeksi DB.

- [ ] **Step 1: E2E manual** (dev server `env -u NODE_OPTIONS npm run dev`)

1. Login TALENT → /applications → application SELECTED + meeting COMPLETED → ConsentRequestForm → isi email wali dummy → submit.
2. Cek DB: consents PENDING + guardian_email terisi; consent_tokens (token_hash 64-char, expires +48h, used_at null).
3. Dapatkan RAW token (email tak terkirim tanpa RESEND_API_KEY): node one-liner — randomBytes(32).hex + SHA-256 hash + upsert consent_tokens via service-role REST (ganti token_hash lama), print raw.
4. Browser TANPA login: `/consent/<raw>` → detail talent + opportunity tampil.
5. Klik Setujui → `?done=1` → "Persetujuan Tercatat".
6. Cek DB: consents APPROVED + approved_at; token used_at terisi; notifications CONSENT_RESOLVED ke talent; audit_logs CONSENT_GUARDIAN_APPROVED (actor SYSTEM).
7. Buka link lagi → "Link Tidak Valid atau Kedaluwarsa" (used).
8. Login TALENT → /applications → consent APPROVED → gate kontrak terbuka.
9. Repeat path Tolak: reset consent row ke PENDING + token baru via admin REST → link baru → Tolak → REJECTED + notif tolak.
10. Screenshot `.impeccable/review/consent-public.jpeg`.

- [ ] **Step 2: Docs**

- `docs/PROGRESS.md` — section "#### Guardian Consent via Magic Link" di Sudah Selesai + Decision Log entry: "2026-09-05: Consent wali real via magic link email (token hashed, one-time, 48h); self-approve talent dihapus; full GUARDIAN account ditunda".
- `docs/FUTURE-ROADMAP.md` — Guardian/Parent Account → `✅ Selesai` dengan catatan "2026-09-05: magic link email wali; full account role GUARDIAN (dashboard) tetap bisa jadi lanjutan".

- [ ] **Step 3: Commit + push + verify auto-deploy**

```bash
git add docs/PROGRESS.md docs/FUTURE-ROADMAP.md
git commit -m "docs(consent): progress guardian magic link"
git push origin main
```
Verify: `vercel ls --json` — deployment SHA baru muncul otomatis (git integration sudah fix); Ready + https://flex-network.vercel.app 200.

---

## Self-Review

1. **Spec coverage:** migration ✓ T1; token hash+issue+resolve+hapus self-approve ✓ T2; action resolve + hapus action lama + parse guardianEmail ✓ T3; halaman publik + form email wali + hapus UI simulasi ✓ T4; notify+audit ✓ T2; race guard `used_at is null` ✓ T2; E2E + docs + auto-deploy ✓ T5. getConsentDecision tak diubah (spec).
2. **Placeholder scan:** bersih — catatan implementer konkret (duration null karena opportunities tak punya kolom itu; hirer column-hint).
3. **Type consistency:** resolveConsentByToken(rawToken, decision) sama di T2/T3; issueConsentToken→raw string di T2; ConsentPageData konsisten T4; hashToken dipakai T2+T4; resolveConsentAction(token, decision) bind di T4 page.
```