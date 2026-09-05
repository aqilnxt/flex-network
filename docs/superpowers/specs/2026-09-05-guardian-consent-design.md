# Guardian Consent via Magic Link — Design Spec

Tanggal: 2026-09-05
Status: Approved design (chat, Bagian 1-3)
Klasifikasi: Architectural (aktor flow consent berubah: talent self-approve → wali via token; RLS + tabel baru + halaman publik baru)

## Konteks & Masalah

Flow consent saat ini: talent mengajukan consent lalu **menyetujui sendiri** (service approve/reject guard `talent_id !== talentId` = talent harus owner = self-approve simulasi, per SRS MVP). Platform menyasar pelajar minor (15-18 th) — consent wali self-approve adalah titik lemah trust terbesar yang tersisa setelah digital signature + email notif selesai.

## Keputusan

1. **Model: magic link email** — talent isi email wali saat request consent; sistem kirim link berisi token; wali approve/reject dari halaman publik. Zero signup wali. Identitas wali = kepemilikan email. Upgrade full GUARDIAN account ditunda (interface dirancang supaya swap mudah: resolusi terpusat di `resolveConsentByToken`).
2. **Email wali di-request-time** (bukan di profil) — per-aplikasi, alur paling sedikit berubah.
3. **DB token + expire** (bukan JWT) — tabel `consent_tokens`, one-time, expire 48 jam, token di-hash di DB.

## Flow

```
TALENT: request consent (isi email wali)
  → consents row PENDING (existing) + guardian_email
  → consent_tokens row (token_hash, expires 48h)
  → email ke wali: template "Persetujuan Wali Diperlukan" + link /consent/<raw-token>
  (via sendEmail existing — modules/notification/email.ts)

WALI: buka /consent/<token> (halaman publik, no login)
  → valid: card nama talent + detail opportunity (role, org, durasi, kompensasi)
  → tombol Setujui (btn-primary) / Tolak (btn-danger)
  → server action resolveConsentAction(token, decision)
  → consents status APPROVED/REJECTED + approved_at/rejected_at + token used_at
  → notif ke talent (CONSENT_RESOLVED, in-app + email via notify existing)

TALENT: lanjut buat kontrak — gate consent APPROVED (existing, tidak berubah)
```

Invalid/expired/used token → halaman pesan statis "Link tidak valid atau kedaluwarsa". Re-request consent yang sama = token baru (update row by consent_id, unique constraint mengganti token lama).

## Arsitektur

### Migration `025_guardian_consent.sql`

```sql
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
-- default-deny: tanpa policy client — semua akses via service layer (admin client).
```

Token: `crypto.randomBytes(32).toString("hex")` (64 char). DB simpan SHA-256 hash-nya. Raw token hanya keluar di link email. One-time via `used_at`. Expire via `expires_at` (48 jam).

### modules/consent/

**schemas.ts** — extend:
```ts
export const createConsentSchema = z.object({
  applicationId: z.string().uuid("Application tidak valid"),
  guardianEmail: z.string().email("Email wali tidak valid"),
});
```

**service.ts:**
- `requestConsent` — existing logic + insert `guardian_email` + `issueToken(consentId)`:
  - generate raw token (32-byte hex), hash SHA-256, upsert consent_tokens (consent_id unique → re-request mengganti token, reset used_at, perpanjang expires)
  - `sendEmail({ to: guardianEmail, title: "Persetujuan Wali Diperlukan", message: "Ananda <nama talent> meminta persetujuan untuk opportunity <role_title> di <org>. Buka link untuk menyetujui atau menolak.", link: /consent/<raw token> })` — fire-and-forget `.catch(() => {})` (email gagal ≠ request gagal; token tetap tersimpan)
  - nama talent + role_title + org diambil dari join existing (application → opportunity) + profiles
- `resolveConsentByToken(rawToken, decision: "APPROVED" | "REJECTED")` — baru:
  - hash raw token → **admin client** lookup consent_tokens join consents (halaman publik tanpa session)
  - guard: token ada + `used_at null` + `expires_at > now` + consent status PENDING → error message spesifik per kasus
  - update consents (status, approved_at/rejected_at) + token used_at — satu transaksi konsep (dua update berurutan; token one-time dicegah race dengan `update ... where used_at is null` guard di DB level)
  - `notify` ke talent: type `CONSENT_RESOLVED`, title "Consent Wali Disetujui" / "Consent Wali Ditolak", link `/applications`
  - logAudit action `CONSENT_GUARDIAN_APPROVED` / `CONSENT_GUARDIAN_REJECTED` (actorId null, actorType SYSTEM, metadata: consentId)
- **HAPUS** `approve`/`reject` lama (aktor talent) + fungsi getOwnedConsent helper-nya.

**actions.ts:**
- Hapus approve/reject action lama.
- Tambah `resolveConsentAction(token: string, decision: string)` — untuk halaman publik (bukan FormData form login; pakai bound args seperti signature panel pattern) → return ActionResult; redirect hasil via searchParam `?done=1` / `?error=...` (halaman public, no session).

**queries.ts:**
- `getConsentPageData(rawToken)` — admin client: join consent_tokens (by hash) → consents → application → opportunity (title, org, duration, compensation) → talent profiles (full_name). Return null + reason untuk invalid/expired/used. Hanya kolom aman untuk public render (tanpa email wali/talent).

### app/consent/[token]/page.tsx (create, public)

- No auth (token = auth). Server component.
- State render:
  - invalid/expired/used → card pesan statis "Link tidak valid atau kedaluwarsa." + satu kalimat instruksi minta talent kirim ulang.
  - valid → card "Persetujuan Wali" — nama talent (h1 kecil), detail list (Role, Organisasi, Durasi, Kompensasi), dua form (tombol Setujui btn-primary / Tolak btn-danger outline pattern).
  - `?done=1` → card sukses "Persetujuan wali tercatat. Terima kasih." (setelah resolve).
- Style: DESIGN.md — card border-line radius 16, Inter, blue action only, no auth chrome.

### app/applications/consent-request-form.tsx (modify)

- Tambah input "Email Wali" (type email, required) → `createConsentSchema` baru.

### Not touched

- Contract gate `getConsentDecision` (modules/consent/queries.ts) — baca status, tak peduli siapa yang approve. Signature service consent check juga tak berubah.
- `modules/notification/email.ts` — dipakai ulang.
- UI dashboard apapun.

## Security

- Raw token 64-char hex (256-bit entropy) — unguessable; hashed at rest.
- Halaman publik merender minimum data (nama talent, role, org, durasi, kompensasi — data yang sudah publik di halaman opportunity).
- Consent status mutasi HANYA via resolveConsentByToken dengan 4 guard (exists, unused, unexpired, PENDING); race one-time dicegah `update consent_tokens set used_at = now() where id = X and used_at is null` return affected row → baru update consents.
- Guardian email tersimpan di consents (metadata operasional — konsisten aturan "tanpa dokumen identitas guardian").
- Rate limit skip (YAGNI demo; Resend 100/hari natural limit).

## Files

- Create: `supabase/migrations/025_guardian_consent.sql`, `app/consent/[token]/page.tsx`
- Modify: `modules/consent/schemas.ts`, `modules/consent/service.ts`, `modules/consent/actions.ts`, `modules/consent/queries.ts` (getConsentPageData), `app/applications/consent-request-form.tsx`
- Hapus: fungsi approve/reject + action lama (self-approve ditutup)

## Testing

1. `npx tsc --noEmit` + `npm run build` clean.
2. `supabase db push` (025).
3. E2E: talent request consent isi email wali → DB row consents PENDING + guardian_email + consent_tokens (hash, expires) → (email mode off/on) → buka /consent/<raw token> → detail tampil → Setujui → consents APPROVED + approved_at + token used + notif talent + audit row → buka link lagi = "Link tidak valid" (used) → Tolak path → REJECTED → expired path (manipulasi expires_at via admin) → "kedaluwarsa" → contract gate terbuka setelah APPROVED (buat kontrak sukses).
4. Visual: halaman publik vs DESIGN.md.

## Out of Scope

- Full GUARDIAN account (role, dashboard, relasi persist) — interface resolve terpusat memudahkan upgrade.
- Rate limiting link request.
- Reminder email sebelum expire.
- Email wali tersimpan di profil talent (bukan per-request).
