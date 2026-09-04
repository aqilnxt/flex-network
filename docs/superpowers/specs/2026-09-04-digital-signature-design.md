# Digital Signature — Design Spec

Tanggal: 2026-09-04
Status: Approved (user, 2026-09-04)
Klasifikasi: Architectural (brainstorming skill)

## Ringkasan

Ganti simulated agreement (talent_agreed + hirer_agreed = ACTIVE) jadi digital signature dual-mode: `SimulatedSignatureProvider` (implement sekarang, dokumen PDF + hash SHA-256) dan `PrivySignatureProvider` (stub, PrivyID API Phase 2). Abstraction: `SignatureProvider` interface, factory baca env `SIGNATURE_MODE`.

## Keputusan Terkunci

1. **Dual-mode flag** — `SIGNATURE_MODE=simulated|privy`, default `simulated`. Simulated = PDF + hash + audit trail, sah internal/dev. PrivyID = legally binding PKI, Phase 2.
2. **Status baru `PENDING_SIGNATURE`** — flow real signature: DRAFT → PENDING_SIGNATURE → ACTIVE. `PENDING_AGREEMENT` + `agree()` lama tetap utuh (jalur dev/simulated lama).
3. **Signatory 2 pihak** — TALENT + HIRER. Wali tetap pre-check di consent module (bukan signatory), consent gate reuse dari `propose()`.
4. **Template standar FN** — PDF generator hardcode boilerplate klausul standar, isi otomatis dari data contract.
5. **PDF via pdf-lib** — murni JS, ringan (vs @react-pdf/renderer). Dependency baru satu-satunya.

## Arsitektur

```
modules/signature/
  types.ts              — SignatureProvider interface + tipe shared
  provider-simulated.ts — generateDocument (pdf-lib), sign (re-hash + embed), verify noop
  provider-privy.ts     — stub PrivyID API (Phase 2)
  index.ts              — getSignatureProvider() factory (env SIGNATURE_MODE)
  service.ts            — requestSignature, signDocument, handleWebhook logic
  schemas.ts            — zod input/output
  queries.ts            — select kolom signature_*
  actions.ts            — server actions (HIRER kirim, TALENT/HIRER sign)
```

SignatureProvider interface:

```ts
type SignatureProvider = {
  id: "simulated" | "privy";
  requestSignature(contract, parties): Promise<{ externalId, docUrl }>;
  sign(payload): Promise<{ docUrl, signedBy, signedAt, hash }>;
  verifyWebhook(headers, rawBody): boolean;
};
```

Contract service tidak tahu provider aktif — semua via interface. Pola side-effect sama seperti audit/notification.

## Template Dokumen (hardcode di generator)

```
KONTRAK KERJA
Nomor: CNTR-YYMMDD-XXXX

Pihak 1: [Nama Talent] (TALENT)
Pihak 2: [Nama Hirer] (HIRER)

1. POSISI: [role_title]
2. DESKRIPSI: [description]
3. DURASI: [duration]
4. LOKASI: [location]
5. KOMPENSASI: Rp [compensation]
6. SYARAT & KETENTUAN: [terms_conditions]

--- KLAUSUL STANDAR ---
(boilerplate hardcode: hak & kewajiban, confidentiality, termination, dll)

--- VERIFIKASI DIGITAL ---
Hash Dokumen: [sha256]
Ditandatangani: [tanggal]

--- TANDA TANGAN ---
Talent: ________________ (Digital)
Hirer: ________________ (Digital)
```

Hash SHA-256 konten PDF disimpan `contracts.signed_document_hash`.

## Flow

```
DRAFT ──HIRER "Kirim ke Tanda Tangan"──▶ PENDING_SIGNATURE ──TALENT "Tanda Tangani"──▶ ACTIVE
```

### requestSignature (HIRER)

1. Validasi: status DRAFT + hirer owner + consent gate (reuse check dari `propose()` — meeting COMPLETED, consent APPROVED jika required).
2. Generate PDF (pdf-lib, template standar) → upload Supabase Storage bucket `contracts-private`.
3. Update: `status=PENDING_SIGNATURE`, `signature_mode`, `document_url`, `signature_requested_at`.
4. Notif `CONTRACT_SIGNATURE_REQUESTED` ke TALENT + audit `SIGNATURE_REQUESTED`.

### signDocument (TALENT atau HIRER)

1. Validasi: status PENDING_SIGNATURE + pihak terlibat + belum sign pihaknya.
2. Provider.sign: embed hash + tanggal + blok TANDA TANGAN ke PDF → upload signed PDF.
3. Update `talent_signed_at` / `hirer_signed_at` + `signed_document_url` + `signed_document_hash`.
4. Audit `CONTRACT_SIGNED` per signatory.
5. Kedua pihak sign → ACTIVE: auto-create payment PENDING + work NOT_STARTED (reuse logika `agree()` lama) → audit `CONTRACT_ACTIVATED` + notif.

### Webhook `/api/webhooks/privy` (Phase 2)

- POST, tanpa session Supabase — service role client.
- Validasi: HMAC-SHA256 header `X-Privy-Signature` vs raw body + `PRIVY_WEBHOOK_SECRET`, timing-safe compare. Bad signature → 401.
- Idempotent: cari contract by `external_signature_id` → update kolom sign pihak bersangkutan → trigger logika ACTIVE sama.
- Unknown event → 200 + log. Setiap event: audit `PRIVY_WEBHOOK_RECEIVED`.

## Security

- Kolom signature hanya mutasi via service layer (ownership + status check). RLS contracts tetap defense-in-depth.
- Bucket `contracts-private` private — akses via signed URL exp 1h, hanya owner contract.
- `PRIVY_WEBHOOK_SECRET` + Privy API key di `.env.local` only. Service role key hanya di webhook path.
- Log tidak berisi data sensitif — hash + contract id saja.

## Migration — `020_digital_signature.sql`

```sql
alter table public.contracts add column if not exists signature_mode text;
alter table public.contracts add column if not exists document_url text;
alter table public.contracts add column if not exists signed_document_url text;
alter table public.contracts add column if not exists signed_document_hash text;
alter table public.contracts add column if not exists signature_requested_at timestamptz;
alter table public.contracts add column if not exists talent_signed_at timestamptz;
alter table public.contracts add column if not exists hirer_signed_at timestamptz;
alter table public.contracts add column if not exists external_signature_id text;
-- status check: drop + recreate dengan 'PENDING_SIGNATURE' ditambahkan
```

No table baru. Kolom simulated lama (talent_agreed dll) tidak diubah.

## UI — Contract Detail (`app/contracts/[id]/`)

- Komponen `<SignaturePanel>`:
  - PENDING_SIGNATURE + HIRER: badge "Menunggu Tanda Tangan" (warning) + status kedua pihak.
  - TALENT/HIRER belum sign: tombol "Tanda Tangani (Simulasi)".
  - Fully signed: badge success "Telah Ditandatangani" + hash + link "Unduh Dokumen" (signed URL).
- Chip provider mode di header detail (mis. "Simulasi") — jelas ini belum legally binding penuh saat dev.
- Halaman lain tak berubah. Style ikut DESIGN.md (badge pattern existing, tombol btn-primary).

## Cost

| Item | Biaya |
|---|---|
| pdf-lib | Gratis (MIT) |
| Supabase Storage | Free s.d. 1GB — 1 PDF ≈ 50-100KB |
| Simulated provider | Rp 0 |
| PrivyID Phase 2 | Reg. bisnis ~Rp 1-3jt/th + per-dokumen mulai ±Rp 10-25rb (konfirmasi pricing resmi) |
| VIDA alt | Serupa, per-dokumen ±Rp 10rb+ |

## Out of Scope

- Legal boilerplate dinamis (user upload template sendiri) — hardcode template standar FN.
- Multiple signatories > 2 pihak.
- Advanced identity verification (KYC) — Fase 3.
- Email dari Flex Network — PrivyID yang kirim link sign (Phase 2).

## Testing

- Unit: provider-simulated (generate → hash konsisten, sign → hash berubah deterministic), service (state machine DRAFT→PENDING_SIGNATURE→ACTIVE, guard double-sign, guard pihak asing).
- Integration: migration up di dev DB, requestSignature → sign × 2 → contract ACTIVE + payment + work created.
- E2E manual: UI HIRER kirim, TALENT sign, download PDF.
