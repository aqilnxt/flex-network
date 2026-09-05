# Flex Network

Platform experience-driven yang menghubungkan Young Talent (pelajar SMA/SMK) dengan Hirer (UMKM, startup, event organizer) untuk pengalaman kerja nyata, berakhir di **Verified Work History**.

## Fitur

- **Auth & Profile** — Supabase Auth, role TALENT/HIRER/ADMIN, profil skill & interest
- **Opportunity** — lowongan oleh Hirer, moderasi PUBLISHED oleh ADMIN
- **Matching** — rule-based, server-side, 70% skill + 30% interest (tanpa AI)
- **Application & Meeting** — apply, jadwal meeting, consent wali untuk minor
- **Digital Signature** — kontrak DRAFT → PENDING_SIGNATURE → ACTIVE; dokumen PDF kontrak + hash SHA-256, sign kedua pihak, download signed PDF (simulated; PrivyID PKI di roadmap)
- **Payment (simulasi escrow)** & **Work** — status terlacak per tahap
- **Rating dua arah** & **Verified Work History**
- **Notifikasi** — realtime badge
- **Admin & Audit** — moderasi, kelola user, audit log

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · Supabase (PostgreSQL RLS, Auth, Storage) · Zod · Modular Monolith (`modules/<module>`)

## Development

```bash
npm install
cp .env.example .env.local  # isi Supabase keys
supabase db push
npm run dev
```

## Deploy

Production: Vercel. Env vars yang dibutuhkan: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SIGNATURE_MODE` (`simulated` | `privy`, default `simulated`).

## Akun Demo (dev)

| Role | Email | Password |
|---|---|---|
| HIRER | smoke-hirer-consent@example.test | Smoke123! |
| TALENT | smoke-talent-consent@example.test | Smoke123! |
| ADMIN | admin@test.com | (lihat seed) |

Dokumentasi: `docs/BRD.md`, `docs/SRS.md`, `docs/API-SPEC.md`, progress di `docs/PROGRESS.md`, design system di `docs/DESIGN.md`.
# flex-network repo moved to https://github.com/aqilnxt/flex-network
