# Email Notification + Audit Fix — Design Spec

Tanggal: 2026-09-04
Status: Approved design (chat), menunggu implement
Klasifikasi: Bounded (brainstorming skill — extend flow existing, no plan doc)

## Konteks

Notifikasi saat ini hanya in-app (`notifications` table + realtime badge). Pihak kontrak (TALENT/HIRER) tidak tahu ada action dibutuhkan kalau tidak buka app — bottleneck terbesar di flow signature/meeting/kontrak yang baru selesai. Side issue: `logAudit()` insert kena RLS admin-only, jadi audit trail signature gagal senyap (workaround sementara: admin direct-write + backfill manual).

## Keputusan

1. **Provider: Resend** — free tier 100 email/hari (3.000/bulan), SDK TypeScript, setup tercepat. Kalau limit terlampaui nanti: upgrade atau swap ke Brevo di belakang interface `sendEmail` (satu file).
2. **Scope: semua 18 tipe notif** — satu jalur di `notify()`, tanpa whitelist per tipe. Malas dan cukup: volume demo jauh di bawah 100/hari.
3. **Email best-effort** — kegagalan email tidak boleh gagalkan flow utama. `.catch` swallow, sama seperti pola notify in-app saat ini.
4. **Audit fix via RLS policy** — authenticated boleh INSERT audit_logs (append-only; tanpa policy update/delete; SELECT tetap admin-only). `logAudit()` kembali dipakai di semua path termasuk webhook.

## Arsitektur

```
notify() — modules/notification/service.ts
  ├─ insert notifications row (in-app, existing) 
  └─ sendEmail(...) — fire-and-forget, .catch swallow
        modules/notification/email.ts
          └─ Resend SDK → API
          └─ recipient email via admin client (RLS profile_private own-only — pelajaran dari signature module)
```

### `modules/notification/email.ts`

```ts
import "server-only";
import { Resend } from "resend";
import { admin } from "@/lib/supabase/admin";

type SendEmailParams = { to: string; title: string; message: string; link: string };

export async function sendEmail(p: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // mode in-app only
  const resend = new Resend(apiKey);
  // kirim, error dilempar ke caller (caller .catch)
}
```

- Template HTML inline (no template engine, no React Email — overkill untuk notif teks): header "Flex Network" + logo mark SVG data-uri, title (h1, Inter), message (p), tombol link (anchor, style btn-primary: bg #2447F9, radius 12px, putih), footer kecil. Polos, putih, blue action — konsisten DESIGN.md.
- `getRecipientEmail(userId)` via admin client dari `profile_private` — bukan session client.

### `notify()` extension

```ts
export async function notify(params: NotifyParams): Promise<void> {
  // ...insert in-app row (existing, unchanged)
  if (error) throw error;
  // email best-effort
  const email = await getRecipientEmail(params.recipientId);
  if (email) {
    sendEmail({ to: email, title: params.title, message: params.message, link: params.link })
      .catch(() => {}); // swallow — email gagal ≠ flow gagal
  }
}
```

### Webhook route revert

`app/api/webhooks/privy/route.ts` — hapus admin direct-write, kembali `logAudit({ actorId: null, ... })`. Setelah policy 023, insert sessionless (anon) tetap gagal — jadi webhook pakai **admin client + logAudit pattern**? Tidak: logAudit pakai session client. Solusi termudah: policy 023 memberi insert ke `authenticated`; webhook request tak punya session → tetap admin direct-write. **Webhook route TIDAK berubah** — admin direct-write di sana memang design yang benar (final review sudah verifikasi). Yang berubah: signature service + semua session-based caller bisa pakai `logAudit()` normal lagi.

## Migration — `023_audit_insert_rls.sql`

```sql
-- Audit append-only: semua user terauthentikasi boleh insert event audit.
-- Tanpa policy update/delete (append-only), select tetap admin-only.
drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated"
  on public.audit_logs for insert to authenticated
  with check (true);
```

Policy lama `audit_logs_insert_admin` tetap (admin via session tetap lolos keduanya).

## Env

`.env.example`:
```
# Email notifikasi (Resend) — kosong = mode in-app only
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
```

## Files

- Create: `modules/notification/email.ts`, `supabase/migrations/023_audit_insert_rls.sql`
- Modify: `modules/notification/service.ts` (extend notify), `.env.example`
- Tidak disentuh: 18 call site `notify()` (konsumen tak lihat perubahan), webhook route (admin direct-write by design), UI apapun.

## Testing

1. `npx tsc --noEmit` + `npm run build` clean.
2. `supabase db push` (023) → login smoke user → trigger action ber-notif (misal hirer propose/signature request) → cek: notifications row baru + email masuk di Resend dashboard (dev mode: kirim ke email terdaftar Resend).
3. Audit: trigger action signature → `logAudit` insert jalan (cek audit_logs row bertambah tanpa backfill).
4. Tanpa RESEND_API_KEY → flow jalan normal, no error, no email.

## Out of Scope

- Email preference per user (unsubscribe) — volume demo kecil, YAGNI.
- Template engine / React Email.
- Queue/rate-limit email.
- Webhook route refactor (admin direct-write sudah benar).
