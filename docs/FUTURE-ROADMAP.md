# Flex Network — Future Development Roadmap

> AI: Update status fitur di bawah ini SETELAH fitur selesai di-implementasi & di-test. Status: `⏳ Belum` | `🔄 Sedang` | `✅ Selesai`

| Fitur | Status | Catatan |
|-------|--------|---------|
| Real Payment Gateway (Midtrans/Xendit) | ⏳ Belum | |
| Email Notification | ✅ Selesai | 2026-09-05: Resend best-effort via notify(), toggle via RESEND_API_KEY, template HTML inline |
| Digital Signature | ✅ Selesai | 2026-09-04: dual-mode (SimulatedSignatureProvider aktif, PrivyID stub), PDF + hash SHA-256, status PENDING_SIGNATURE, E2E tested + deployed |
| Integrasi PrivyID (e-signature PKI legally binding) | ⏳ Belum | Phase 2 — provider stub + webhook `/api/webhooks/privy` sudah siap |
| Portfolio Upload (Storage) | ✅ Selesai | 2026-09-05: scope jadi link URL (portfolio_url/cv_url) + halaman publik /profiles/[id]; file upload Storage ditunda |
| Advanced Matching (AI/ML) | ⏳ Belum | |
| Guardian/Parent Account | ✅ Selesai | 2026-09-05: magic link email wali (token hashed one-time 48h, halaman publik /consent/[token]); full account role GUARDIAN (dashboard) tetap opsi lanjutan |
| School Integration | ⏳ Belum | |
| Dispute & Refund System | ⏳ Belum | |
| Identity Verification (e-KYC) | ⏳ Belum | |
| In-Platform Video Meeting | ⏳ Belum | |
| Advanced Analytics | ⏳ Belum | |
| Automated Moderation (AI) | ⏳ Belum | |
| Redis Caching | ⏳ Belum | |
| Read Replicas | ⏳ Belum | |
| Canary Deployment | ⏳ Belum | |
| Observability (Sentry/ELK) | ⏳ Belum | |

**Aturan:**
- Status diubah jadi `✅ Selesai` hanya setelah fitur benar-benar selesai (build + test + deploy ke production/preview).
- Jangan ubah status tanpa konfirmasi user, kecuali user minta auto-update.