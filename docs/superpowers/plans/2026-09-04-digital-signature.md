# Digital Signature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Contract agreement berubah dari simulated agreement ke dual-mode digital signature (SimulatedSignatureProvider sekarang, PrivySignatureProvider stub Phase 2) dengan dokumen PDF + hash SHA-256.

**Architecture:** Modul baru `modules/signature/` dengan `SignatureProvider` interface; factory baca env `SIGNATURE_MODE`. Flow baru: DRAFT → PENDING_SIGNATURE → ACTIVE. Contract service tidak tahu provider aktif. PDF via pdf-lib + template standar hardcode. Storage bucket Supabase private + signed URL.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Supabase (DB + Storage), Zod, pdf-lib.

**Spec:** `docs/superpowers/specs/2026-09-04-digital-signature-design.md`

## Global Constraints

- `SIGNATURE_MODE=simulated|privy`, default `simulated` (env, never hardcode di logic).
- Status baru: `PENDING_SIGNATURE`. CHECK constraint: `DRAFT, PENDING_AGREEMENT, PENDING_SIGNATURE, ACTIVE, COMPLETED, TERMINATED`.
- Flow lama (`PENDING_AGREEMENT` + `agree()`) TIDAK diubah — jalur dev tetap jalan.
- Signatory: TALENT + HIRER saja. Wali = consent gate (existing), bukan signatory.
- Server-side only: semua signature logic di server actions/service. No client secret.
- Kolom signature hanya mutasi via `modules/signature/service.ts` (ownership + status check).
- Audit via `modules/audit/service.ts` `logAudit()`: `SIGNATURE_REQUESTED`, `CONTRACT_SIGNED`, `CONTRACT_ACTIVATED`, `PRIVY_WEBHOOK_RECEIVED` (Phase 2).
- Notif via `modules/notification/service.ts` `notify()`.
- No test framework di project — verify per task: `npx tsc --noEmit` + `npm run build` + manual flow. TDD penuh out of scope (infra test belum ada; menambahnya = task terpisah).
- Commit convention: `type(scope): deskripsi imperative lowercase` per `docs/GIT_COMMIT.md`.

---

### Task 1: Migration `020_digital_signature.sql`

**Files:**
- Create: `supabase/migrations/020_digital_signature.sql`
- Modify: `.env.example` (tambah `SIGNATURE_MODE=simulated`)

**Interfaces:**
- Produces: kolom DB `contracts.signature_mode`, `document_url`, `signed_document_url`, `signed_document_hash`, `signature_requested_at`, `talent_signed_at`, `hirer_signed_at`, `external_signature_id`; status enum + `PENDING_SIGNATURE`; bucket `contracts-private`.

- [ ] **Step 1: Tulis migration**

```sql
-- 020_digital_signature.sql
-- Digital signature: kolom dokumen + status PENDING_SIGNATURE + bucket storage

alter table public.contracts add column if not exists signature_mode text;
alter table public.contracts add column if not exists document_url text;
alter table public.contracts add column if not exists signed_document_url text;
alter table public.contracts add column if not exists signed_document_hash text;
alter table public.contracts add column if not exists signature_requested_at timestamptz;
alter table public.contracts add column if not exists talent_signed_at timestamptz;
alter table public.contracts add column if not exists hirer_signed_at timestamptz;
alter table public.contracts add column if not exists external_signature_id text;

-- status check: tambah PENDING_SIGNATURE
alter table public.contracts drop constraint contracts_status_check;
alter table public.contracts add constraint contracts_status_check
  check (status in ('DRAFT', 'PENDING_AGREEMENT', 'PENDING_SIGNATURE', 'ACTIVE', 'COMPLETED', 'TERMINATED'));

-- bucket private untuk dokumen kontrak
insert into storage.buckets (id, name, public)
values ('contracts-private', 'contracts-private', false)
on conflict (id) do nothing;
```

- [ ] **Step 2: Push migration**

Run: `supabase db push`
Expected: sukses, tabel contracts punya kolom baru, bucket ada.

- [ ] **Step 3: Update .env.example**

```
SIGNATURE_MODE=simulated
# Phase 2:
# PRIVY_API_KEY=
# PRIVY_WEBHOOK_SECRET=
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit` (pastikan tak ada regression)

```bash
git add supabase/migrations/020_digital_signature.sql .env.example
git commit -m "feat(signature): migration kolom signature + status pending_signature"
```

---

### Task 2: pdf-lib + template generator

**Files:**
- Create: `modules/signature/types.ts`
- Create: `modules/signature/document-generator.ts`
- Modify: `package.json` (dep baru)

**Interfaces:**
- Produces: `generateContractDocument(contract: DocumentContractData): Promise<{ bytes: Uint8Array; hash: string }>` — PDF unsigned + SHA-256 hex konten.
- Produces (types.ts):
```ts
export type SignatureProviderId = "simulated" | "privy";
export type DocumentContractData = {
  contractNumber: string;
  roleTitle: string | null;
  description: string | null;
  responsibilities: string | null;
  duration: string | null;
  location: string | null;
  compensation: number | null;
  termsConditions: string | null;
  talentName: string;
  hirerName: string;
};
export type SignatureProvider = {
  id: SignatureProviderId;
  requestSignature(contractId: string, data: DocumentContractData, talentEmail: string, hirerEmail: string): Promise<{ externalId: string | null; docUrl: string }>;
  signDocument(contractId: string, existingDocBytes: Uint8Array, signedBy: "talent" | "hirer", signerName: string): Promise<{ docUrl: string; hash: string; signedAt: string }>;
  verifyWebhook(headers: Record<string, string>, rawBody: string): boolean;
};
```

- [ ] **Step 1: Install pdf-lib**

Run: `npm install pdf-lib`

- [ ] **Step 2: Tulis `types.ts`** (persis interface di atas, plus `export type ServiceResult<T> = { data: T | null; error: { message: string } | null }` reuse pattern service lain).

- [ ] **Step 3: Tulis `document-generator.ts`**

Generator pakai pdf-lib `PDFDocument.create()` + `StandardFonts.Helvetica`. Layout template standar FN (spec):

```ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "crypto";

const BOILERPLATE = [
  "KLAUSUL STANDAR:",
  "1. Talent wajib melaksanakan tanggung jawab sesuai posisi dengan itikad baik.",
  "2. Kedua pihak wajib menjaga kerahasiaan informasi yang dipertukarkan selama kerja sama.",
  "3. Pembayaran kompensasi dilakukan via mekanisme platform (simulasi escrow).",
  "4. Kontrak dapat diakhiri lebih awal oleh salah satu pihak dengan pemberitahuan 7 hari.",
  "5. Sengketa diselesaikan secara musyawarah, gagal maka menempuh hukum yang berlaku di Indonesia.",
];

export async function generateContractDocument(
  data: DocumentContractData,
): Promise<{ bytes: Uint8Array; hash: string }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595.28, 841.89]); // A4
  let y = 800;
  const write = (text: string, size = 10, useBold = false) => {
    if (y < 60) { page = doc.addPage([595.28, 841.89]); y = 800; }
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color: rgb(0.05, 0.04, 0.03) });
    y -= size + 8;
  };
  const field = (label: string, value: string | null) => write(`${label}: ${value ?? "-"}`);

  write("KONTRAK KERJA", 16, true);
  field("Nomor", data.contractNumber);
  write("");
  field("Pihak 1 (TALENT)", data.talentName);
  field("Pihak 2 (HIRER)", data.hirerName);
  write("");
  write("1. POSISI", 11, true); field("Posisi", data.roleTitle);
  write("2. DESKRIPSI", 11, true); field("Deskripsi", data.description);
  field("Tanggung Jawab", data.responsibilities);
  write("3. DURASI", 11, true); field("Durasi", data.duration);
  write("4. LOKASI", 11, true); field("Lokasi", data.location);
  write("5. KOMPENSASI", 11, true);
  write(`Kompensasi: Rp ${data.compensation ?? 0}`);
  write("6. SYARAT & KETENTUAN", 11, true);
  write(data.termsConditions ?? "-");
  write("");
  for (const line of BOILERPLATE) write(line);
  write("");
  write("Dokumen ini ditandatangani secara elektronik melalui Flex Network.", 9);

  const bytes = await doc.save();
  const hash = createHash("sha256").update(bytes).digest("hex");
  return { bytes, hash };
}

export async function appendSignatureBlock(
  existingBytes: Uint8Array,
  hash: string,
  signatures: { talent: { name: string; at: string } | null; hirer: { name: string; at: string } | null },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(existingBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]);
  let y = 780;
  const write = (text: string, size = 10, useBold = false) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font });
    y -= size + 8;
  };
  write("VERIFIKASI DIGITAL", 13, true);
  write(`Hash Dokumen: ${hash}`);
  write("");
  write("TANDA TANGAN", 13, true);
  write(signatures.talent ? `Talent: ${signatures.talent.name} — (Digital) — ${signatures.talent.at}` : "Talent: ________________");
  write(signatures.hirer ? `Hirer: ${signatures.hirer.name} — (Digital) — ${signatures.hirer.at}` : "Hirer: ________________");
  return doc.save();
}
```

Catatan implementer: `y -= size + 8` sederhana cukup untuk dokumen satu-dua halaman. Wrap teks panjang: potong `termsConditions` per ±90 karakter per baris sebelum `write` (loop sederhana).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no error.

- [ ] **Step 5: Commit**

```bash
git add modules/signature/types.ts modules/signature/document-generator.ts package.json package-lock.json
git commit -m "feat(signature): pdf template generator + provider types"
```

---

### Task 3: SimulatedSignatureProvider + factory

**Files:**
- Create: `modules/signature/provider-simulated.ts`
- Create: `modules/signature/provider-privy.ts` (stub)
- Create: `modules/signature/index.ts`
- Create: `lib/supabase/storage.ts`

**Interfaces:**
- Consumes: `generateContractDocument`, `appendSignatureBlock`, `SignatureProvider` (Task 2).
- Produces: `getSignatureProvider(): SignatureProvider`; storage helper `uploadPrivateDoc(path: string, bytes: Uint8Array): Promise<string>` (return path; URL dibuat via `getSignedDocUrl(path)`).

- [ ] **Step 1: Tulis `lib/supabase/storage.ts`**

```ts
import { createSupabaseServerClient } from "./server";

const BUCKET = "contracts-private";

export async function uploadPrivateDoc(path: string, bytes: Uint8Array): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  return path;
}

export async function getSignedDocUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (!data) throw new Error("Gagal membuat signed URL");
  return data.signedUrl;
}

export async function downloadPrivateDoc(path: string): Promise<Uint8Array> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Download gagal: ${error?.message ?? "not found"}`);
  return new Uint8Array(await data.arrayBuffer());
}
```

- [ ] **Step 2: Tulis `provider-simulated.ts`**

```ts
import { appendSignatureBlock, generateContractDocument } from "./document-generator";
import { downloadPrivateDoc, uploadPrivateDoc } from "@/lib/supabase/storage";
import type { DocumentContractData, SignatureProvider } from "./types";

export const simulatedProvider: SignatureProvider = {
  id: "simulated",
  async requestSignature(contractId, data) {
    const { bytes, hash } = await generateContractDocument(data);
    const path = `contracts/${contractId}/unsigned.pdf`;
    await uploadPrivateDoc(path, bytes);
    return { externalId: `SIM-${hash.slice(0, 12)}`, docUrl: path };
  },
  async signDocument(contractId, _existingBytes, signedBy, signerName) {
    const unsignedPath = `contracts/${contractId}/unsigned.pdf`;
    const existing = await downloadPrivateDoc(unsignedPath);
    // ponytail: sign flow full — baca kolom signature dari DB lewat service,
    // provider terima signature state via param yang disiapkan service.
    const signedAt = new Date().toISOString();
    const { hash } = await rehash(existing);
    const signedBytes = await appendSignatureBlock(existing, hash, {
      talent: signedBy === "talent" ? { name: signerName, at: signedAt } : null,
      hirer: signedBy === "hirer" ? { name: signerName, at: signedAt } : null,
    });
    const signedPath = `contracts/${contractId}/signed.pdf`;
    await uploadPrivateDoc(signedPath, signedBytes);
    const finalHash = await hashBytes(signedBytes);
    return { docUrl: signedPath, hash: finalHash, signedAt };
  },
  verifyWebhook() {
    return true; // simulated: tidak ada webhook eksternal
  },
};

async function rehash(bytes: Uint8Array) {
  const { createHash } = await import("crypto");
  return { hash: createHash("sha256").update(bytes).digest("hex") };
}
async function hashBytes(bytes: Uint8Array) {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(bytes).digest("hex");
}
```

Catatan implementer: signature state kedua pihak HARUS diteruskan service (baca `talent_signed_at`/`hirer_signed_at` dari DB) supaya blok TANDA TANGAN menampilkan semua pihak yang sudah sign — refine `signDocument` signature: `signDocument(contractId, signedBy, signerName, priorSignatures)` dan provider rakit ulang PDF unsigned + semua signature. `_existingBytes` param dibuang; provider download sendiri dari storage. Hapus helper duplikat `rehash`/`hashBytes` jadi satu `hashBytes`.

- [ ] **Step 3: Tulis `provider-privy.ts` stub**

```ts
import type { DocumentContractData, SignatureProvider } from "./types";

export const privyProvider: SignatureProvider = {
  id: "privy",
  async requestSignature() {
    throw new Error("PrivyID provider belum dikonfigurasi (Phase 2). Set SIGNATURE_MODE=simulated.");
  },
  async signDocument() {
    throw new Error("PrivyID provider belum dikonfigurasi (Phase 2).");
  },
  verifyWebhook() {
    return false;
  },
};
export type { DocumentContractData };
```

- [ ] **Step 4: Tulis `index.ts` factory**

```ts
import { simulatedProvider } from "./provider-simulated";
import { privyProvider } from "./provider-privy";
import type { SignatureProvider } from "./types";

export function getSignatureProvider(): SignatureProvider {
  const mode = process.env.SIGNATURE_MODE ?? "simulated";
  return mode === "privy" ? privyProvider : simulatedProvider;
}
export type { SignatureProvider } from "./types";
```

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit` → no error.

```bash
git add modules/signature/provider-simulated.ts modules/signature/provider-privy.ts modules/signature/index.ts lib/supabase/storage.ts
git commit -m "feat(signature): signature provider abstraction + storage helper"
```

---

### Task 4: Service layer — requestSignature + signDocument

**Files:**
- Create: `modules/signature/service.ts`
- Modify: `modules/contract/queries.ts` (tambah select kolom signature + nama talent/hirer)

**Interfaces:**
- Consumes: `getSignatureProvider()`, storage helpers, `notify()`, `logAudit()`, consent gate (pattern `getConsentDecision` dari contract service).
- Produces:
```ts
requestSignature(hirerId: string, contractId: string): Promise<ServiceResult<{ contractId: string }>>
signDocument(userId: string, contractId: string): Promise<ServiceResult<{ contractId: string }>>
getSignatureInfo(contractId: string, userId: string): Promise<ServiceResult<{ mode: string; status: string; documentUrl: string | null; signedDocumentUrl: string | null; hash: string | null; talentSignedAt: string | null; hirerSignedAt: string | null; downloadUrl: string | null }>>
```

- [ ] **Step 1: Extend contract queries**

Di `modules/contract/queries.ts`, tambahkan ke select string: `signature_mode, document_url, signed_document_url, signed_document_hash, signature_requested_at, talent_signed_at, hirer_signed_at` dan type `ContractDetail` + field null-safe. Tambah query nama pihak: join `profiles!contracts_talent_id_fkey(full_name)` & `profiles!contracts_hirer_id_fkey(full_name)` (cek nama FK constraint di migration 001; jika beda, sesuaikan).

- [ ] **Step 2: Tulis `service.ts` — requestSignature**

Pola guard copy dari `propose()` (contract service): load contract (hirer owner), status DRAFT, consent gate reuse (`getConsentDecision`), meeting COMPLETED. Lalu:

```ts
const provider = getSignatureProvider();
const result = await provider.requestSignature(contract.id, {
  contractNumber: contract.contract_number,
  roleTitle: contract.role_title, description: contract.description,
  responsibilities: contract.responsibilities, duration: contract.duration,
  location: contract.location, compensation: contract.compensation,
  termsConditions: contract.terms_conditions,
  talentName, hirerName,
}, talentEmail, hirerEmail);
await supabase.from("contracts").update({
  status: "PENDING_SIGNATURE",
  signature_mode: provider.id,
  document_url: result.docUrl,
  signature_requested_at: now,
}).eq("id", contractId);
```
Lalu `notify()` (type `CONTRACT_SIGNATURE_REQUESTED`, title "Permintaan Tanda Tangan", link `/contracts/${id}`) ke TALENT + `logAudit({ actorId: hirerId, action: "SIGNATURE_REQUESTED", resourceType: "contract", resourceId: contractId, metadata: { provider: provider.id } })`.

- [ ] **Step 3: Tulis `service.ts` — signDocument**

Guard: loadOwnedContract pattern (copy dari contract service), status PENDING_SIGNATURE, pihak belum sign (`talent_signed_at`/`hirer_signed_at` masih null untuk userId). Lalu provider.signDocument dengan priorSignatures dari DB → update kolom sign pihak + `signed_document_url` + `signed_document_hash` → `logAudit CONTRACT_SIGNED`. Kalau setelah update kedua pihak sudah sign:

```ts
const { error: actErr } = await supabase.from("contracts")
  .update({ status: "ACTIVE", activated_at: now }).eq("id", contractId);
// auto-create payment PENDING + work NOT_STARTED — copy persis blok willActivate dari agree() lama (modules/contract/service.ts:313-337)
```
Plus `logAudit CONTRACT_ACTIVATED` + `notify CONTRACT_ACTIVE` ke kedua pihak.

- [ ] **Step 4: Tulis `service.ts` — getSignatureInfo**

Select kolom signature + ownership check (loadOwnedContract pattern). `downloadUrl` = `getSignedDocUrl(signedDocumentUrl)` kalau ada, else null.

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit && npm run build` → sukses.

```bash
git add modules/signature/service.ts modules/contract/queries.ts
git commit -m "feat(signature): service request/sign/info + contract queries"
```

---

### Task 5: Server actions

**Files:**
- Create: `modules/signature/actions.ts`
- Create: `modules/signature/schemas.ts`

**Interfaces:**
- Consumes: `requestSignature`, `signDocument`, `getSignatureInfo` (Task 4), `requireUser`/`requireRole` dari `modules/lib/auth.ts`.
- Produces: server actions `requestSignatureAction(formData)`, `signDocumentAction(formData)`, dipakai UI Task 6. Return `ActionResult` pattern (`lib/result.ts`).

- [ ] **Step 1: Tulis `schemas.ts`**

```ts
import { z } from "zod";
export const signatureContractSchema = z.object({
  contractId: z.string().uuid(),
});
```

- [ ] **Step 2: Tulis `actions.ts`** — pattern copy dari `modules/consent/actions.ts` (requireUser, revalidatePath, redirect):

```ts
"use server";
import { requireUser } from "@/modules/lib/auth";
import { requestSignature, signDocument } from "./service";
import { signatureContractSchema } from "./schemas";

export async function requestSignatureAction(formData: FormData) {
  const user = await requireUser();
  const parsed = signatureContractSchema.safeParse({ contractId: formData.get("contractId") });
  if (!parsed.success) return { code: "VALIDATION_ERROR", message: "Data tidak valid" } as const;
  const result = await requestSignature(user.id, parsed.data.contractId);
  if (result.error) return { code: "SIGNATURE_ERROR", message: result.error.message } as const;
  revalidatePath(`/contracts/${parsed.data.contractId}`);
  return { code: "OK" } as const;
}
// signDocumentAction sama pola → signDocument(user.id, contractId)
```
Include `redirectPath` handling sama seperti consent actions kalau ada.

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit` → sukses.

```bash
git add modules/signature/actions.ts modules/signature/schemas.ts
git commit -m "feat(signature): server actions kirim + tanda tangan"
```

---

### Task 6: UI — SignaturePanel di contract detail

**Files:**
- Create: `app/contracts/[id]/signature-panel.tsx`
- Modify: `app/contracts/[id]/page.tsx`

**Interfaces:**
- Consumes: `getSignatureInfo` (server, langsung di page), actions Task 5, badge/button pattern DESIGN.md (`badge`, `btn-primary` classes di globals.css).

- [ ] **Step 1: Tulis `signature-panel.tsx`**

Server component + form action (pattern existing `startWork` form di page). Props: `{ info, contractId, viewerRole: "talent"|"hirer"|"other", viewerId }`. Render:

- `status === "PENDING_SIGNATURE"`: badge warning "Menunggu Tanda Tangan" + dua baris: `Talent: {talentSignedAt ? "✔ ditandatangani" : "belum"}` / `Hirer: ...` + chip `Simulasi` (badge class). Kalau viewer pihak yang belum sign → tombol `btn-primary` "Tanda Tangani (Simulasi)" (form signDocumentAction).
- `status === "ACTIVE"` + `signedDocumentUrl`: badge success "Telah Ditandatangani" (bg `#EAFBF1` text `#15803D` — pattern VERIFIED existing) + hash terpotong 16 char + link "Unduh Dokumen" (downloadUrl, styled seperti link login existing).
- `status === "DRAFT"` + viewer hirer: tombol `btn-primary` "Kirim ke Tanda Tangan (Simulasi)" (form requestSignatureAction) — menampilkan consent gate error dari service kalau gagal.

- [ ] **Step 2: Wire di page.tsx**

Import panel + panggil `getSignatureInfo(contract.id, user.id)` (server). Render `<SignaturePanel>` setelah blok kontrak fields, sebelum blok work. Jangan sentuh logic work/payment lama. Tombol agree/decline lama (`PENDING_AGREEMENT` path) TETAP ada — kondisi render: agree/decline hanya saat `status === "PENDING_AGREEMENT"`, signature panel saat DRAFT/PENDING_SIGNATURE/ACTIVE-signed.

- [ ] **Step 3: Verify visual + flow manual**

Run: `npm run build && npm run start` → buka contract detail.
Manual: DRAFT (hirer) → klik kirim → PENDING_SIGNATURE (badge) → talent sign → hirer sign → ACTIVE + badge Telah Ditandatangani + download PDF jalan. Cek: payment + work tercreate (DB), notif masuk, audit_logs ada SIGNATURE_REQUESTED + CONTRACT_SIGNED ×2 + CONTRACT_ACTIVATED.

- [ ] **Step 4: Commit**

```bash
git add app/contracts/[id]/signature-panel.tsx app/contracts/[id]/page.tsx
git commit -m "feat(signature): ui signature panel di contract detail"
```

---

### Task 7: Webhook endpoint stub + docs

**Files:**
- Create: `app/api/webhooks/privy/route.ts`
- Modify: `docs/PROGRESS.md`, `docs/FUTURE-ROADMAP.md`

**Interfaces:**
- Consumes: pattern service role client `createSupabaseAdminClient` (lib/supabase/admin.ts), `verifyWebhook` provider, audit.

- [ ] **Step 1: Tulis route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSignatureProvider } from "@/modules/signature";
import { logAudit } from "@/modules/audit/service";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const provider = getSignatureProvider();
  const headers = Object.fromEntries(req.headers.entries());
  if (!provider.verifyWebhook(headers, rawBody)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  // ponytail: Phase 2 — parse event PrivyID, cari contract by external_signature_id,
  // update kolom sign pihak, trigger logika ACTIVE sama dengan service.signDocument.
  // Simulated mode: webhook tidak dipakai (verifyWebhook selalu false utk privy stub).
  await logAudit({ actorId: null, actorType: "system", action: "PRIVY_WEBHOOK_RECEIVED", resourceType: "webhook", metadata: { body: rawBody.slice(0, 500) } });
  return NextResponse.json({ ok: true });
}
```
Catatan: `logAudit` signature param mungkin beda (`actor_type` via param object) — cek `modules/audit/service.ts` dan sesuaikan call.

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit && npm run build` → sukses.

```bash
git add app/api/webhooks/privy/route.ts
git commit -m "feat(signature): privy webhook endpoint stub"
```

- [ ] **Step 3: Update docs**

`docs/PROGRESS.md`: pindah task ke Sudah Selesai (migration, provider abstraction, service, actions, UI, webhook stub) + Decision Log entry: "2026-09-04: Digital signature dual-mode (simulated default, PrivyID Phase 2); status PENDING_SIGNATURE; signatory TALENT+HIRER; PDF via pdf-lib + template standar FN".
`docs/FUTURE-ROADMAP.md`: tambah item PrivyID integration Phase 2 (status ⏳ Belum) — jangan ubah jadi ✅.

```bash
git add docs/PROGRESS.md docs/FUTURE-ROADMAP.md
git commit -m "docs(signature): progress + roadmap update"
```

---

## Self-Review

1. **Spec coverage:** migration ✓ (T1), provider+factory ✓ (T3), template+hash ✓ (T2), flow request/sign/ACTIVE+payment+work ✓ (T4), UI ✓ (T6), webhook+security stub ✓ (T7), audit+notif ✓ (T4/T6), fallback simulated ✓ (agree() lama tak tersentuh), consent gate ✓ (T4 reuse), signed URL download ✓ (T4/T6). Gap: email talent/hirer di requestSignature param di-take dari profiles — implementer ambil di service (join profiles), disebut di T4 Step 2.
2. **Placeholder scan:** tidak ada TBD/TODO — stub privy memang throw by design (Phase 2, documented).
3. **Type consistency:** `SignatureProvider.signDocument` dirubah di T3 catatan (contractId, signedBy, signerName, priorSignatures) — T4 service ikuti signature final itu. `ServiceResult` diulang di types.ts supaya modul mandiri.
