# Contract Module — Design Spec

> Tanggal: 2026-08-29
> Klasifikasi: ARCHITECTURAL (brainstorming)
> Status: APPROVED (user, 2026-08-29)

## 1. Tujuan

Membangun modul Contract: HIRER membuat kontrak (DRAFT) untuk application SELECTED yang sudah lolos gate Meeting COMPLETED + Consent eligible, lalu propose (PENDING_AGREEMENT), kedua pihak agree → ACTIVE, atau decline → TERMINATED. Saat ACTIVE, service membuat row `payments` (PENDING) + `works` (NOT_STARTED) sebagai seed modul berikutnya.

Modul `modules/contract/` di atas skema DB yang sudah live (`001_initial_schema.sql`, tabel `contracts` — tanpa perubahan skema). RLS granular baru di migration `012`.

## 2. Scope

**Di dalam:**
- Lifecycle `DRAFT → PENDING_AGREEMENT → ACTIVE`, plus `PENDING_AGREEMENT → TERMINATED` (decline).
- `COMPLETED` ada di CHECK DB tapi **tidak ada transisi menuju COMPLETED di modul ini** — status itu dicapai lewat alur Work (hirer confirm completion), modul terpisah.
- Create (HIRER), edit DRAFT (HIRER), propose, agree (kedua pihak), decline.
- Side effects ACTIVE: insert `payments` (PENDING, amount = contract.compensation) + `works` (NOT_STARTED).
- UI: form buat (HIRER), detail contract + aksi (kedua pihak), blok ringkas di My Applications (TALENT), badge/link di applicant list (HIRER).

**Di luar (YAGNI / modul lain):**
- Payment simulation (modul Payment berikutnya).
- Work state transitions (modul Work).
- Rating & Work History.
- Notification & audit log (modulnya belum ada — side effect ini ditunda, dicatat di Decision Log).
- Edit kontrak setelah DRAFT (API-SPEC 11.4 hanya izinkan edit DRAFT — konsisten).

## 3. Eligibility Gate (create contract)

Kontrak hanya bisa dibuat (HIRER owner opportunity) jika SEMUA terpenuhi:

1. Application = `SELECTED`
2. Meeting = `COMPLETED` (via `meetings.getByApplicationId` — gate modul Meeting)
3. Consent eligible: `getConsentDecision(applicationId)` → `!required || status === 'APPROVED'` (gate modul Consent)
4. Belum ada contract untuk application (unique `application_id` — service cek dulu, DB melindungi)

Evaluasi gate server-side di service (`createContract`), sebelum INSERT. RLS insert policy = defense-in-depth (poin 5).

## 4. Contract Lifecycle

| Dari | Ke | Aktor | Efek |
|---|---|---|---|
| — | DRAFT | HIRER owner | create; gate eligibility |
| DRAFT | DRAFT (edit fields) | HIRER owner | update field konten |
| DRAFT | PENDING_AGREEMENT | HIRER owner | `proposed_at`, `proposed_by`, **auto-agree HIRER** (`hirer_agreed=true`, `hirer_agreed_at`) |
| PENDING_AGREEMENT | ACTIVE | TALENT terakhir | `talent_agreed=true` + `talent_agreed_at` → karena hirer sudah agree saat propose → `activated_at`, **insert payments + works** |
| PENDING_AGREEMENT | ACTIVE | HIRER terakhir* | sama seperti di atas, mirror (talent agree duluan) |
| PENDING_AGREEMENT | TERMINATED | HIRER / TALENT | `terminated_at`, `decline_reason` |

\* Urutan agree fleksibel: siapa pun yang agree terakhir memicu ACTIVE; service cek kedua flag setelah update.

**Terminal:** `ACTIVE` (modul ini), `TERMINATED`. Tidak ada transisi keluar dari keduanya di modul Contract. `DRAFT` tidak bisa decline (HIRER hapus? tidak — tidak ada delete contract; YAGNI, tapi DRAFT bisa diedit terus atau ditinggal).

**Auto-agree HIRER saat propose:** HIRER yang men-propose draft-nya sendiri dianggap setuju (`hirer_agreed=true`). Ditandai eksplisit karena API-SPEC 11.5 tidak menyebutnya, tapi tanpa ini kontrak tidak pernah bisa ACTIVE via satu tombol agree TALENT (HIRER harus klik agree dua kali). Keputusan: propose = setuju.

## 5. RLS (migration `012_contract_rls.sql`)

Baseline 003: RLS enabled, default-deny, tanpa policy. Helper `is_admin()` ada (006).

- **SELECT** involved/admin: `talent_id = auth.uid() OR hirer_id = auth.uid() OR is_admin()`
- **INSERT** hirer owner + gate defense-in-depth: exists application SELECTED + meeting COMPLETED + `hirer_id = auth.uid()`
- **UPDATE** involved party: `using (talent_id = auth.uid() or hirer_id = auth.uid()) with check (sama)` — transisi status di-enforce service, RLS cukup membatasi ke pihak terlibat.
- Tidak ada DELETE policy (`on delete cascade` dari applications cukup; tidak ada use case delete).

Row `payments`/`works` yang dibuat service contract: service berjalan sebagai HIRER (auth user) — payments/works RLS default-deny tanpa policy → INSERT akan gagal. Solusi: migration `012` juga menambah policy INSERT pada `payments` dan `works` yang mengizinkan hirer/talent involved saat contract baru ACTIVE (defense-in-depth: contract harus ACTIVE). Modul Payment/Work nanti menambah policy granular miliknya; modul Contract hanya butuh INSERT seed.

## 6. Schemas (`modules/contract/schemas.ts`)

- `createContractSchema`: `applicationId` (uuid), `roleTitle` (min 3), `description` (opsional), `responsibilities` (opsional), `duration` (opsional), `location` (opsional), `compensation` (int ≥ 0, opsional), `termsConditions` (opsional). Tanpa field `guardian*`/identitas. `proposed_by`, `status`, agreement fields TIDAK menerima input client.
- `updateContractSchema`: field konten opsional (roleTitle, description, responsibilities, duration, location, compensation, termsConditions) — dipakai edit DRAFT.
- `declineContractSchema`: `reason` (min 3, opsional? — API-SPEC: store decline_reason; buat opsional tanpa panjang minimum, default null).

## 7. Service (`modules/contract/service.ts`)

Type `ServiceResult<T>` sama dengan modul lain.

- `createContract(hirerId, input)`:
  1. Load application (+opportunity_id, hirer_id) — harus SELECTED, `opportunity.hirer_id === hirerId` (ownership).
  2. Meeting COMPLETED: query `meetings` by application (reuse pola `modules/meeting/queries.getByApplicationId` — query langsung, bukan import lintas modul service).
  3. Consent gate: reuse logika `getConsentDecision` — **import dari `modules/consent/queries`** (read-only queries aman dipakai lintas modul; pattern: `matching/badge.ts` sudah diimport lintas modul).
  4. Cek belum ada contract (application_id) → error "Kontrak sudah dibuat".
  5. INSERT `contracts` status DRAFT, `contract_number = CNTR-{yymmdd}-{random4}` (server-side; random4 = 4 char A-Z0-9, collision ditangani unique application_id bukan number).
- `updateContract(hirerId, contractId, input)`: hanya status DRAFT + hirer owner.
- `propose(hirerId, contractId)`: DRAFT → PENDING_AGREEMENT; set `proposed_at`, `proposed_by`, auto-agree HIRER (`hirer_agreed`, `hirer_agreed_at`).
- `agree(userId, contractId)`: load contract; user harus talent_id ATAU hirer_id; status PENDING_AGREEMENT; set field agree miliknya (idempotent → error "Sudah setuju" jika sudah true); jika kedua flag true → ACTIVE + `activated_at` + **insert payments** (amount=compensation, status PENDING) + **insert works** (status NOT_STARTED); error dari insert payment/work = fatal (contract sudah ACTIVE tapi seed gagal → surface error, jangan silent; unique constraint mencegah duplikat, 23505 dianggap sukses idempotent).
- `decline(userId, contractId, reason)`: PENDING_AGREEMENT → TERMINATED; `terminated_at`, `decline_reason`; aktor talent/hirer involved.

Transisi tidak valid → error message jelas (state machine eksplisit per aksi).

## 8. Queries (`modules/contract/queries.ts`)

- `getById(contractId)` → row | null (render detail).
- `getByApplicationId(applicationId)` → row | null (**gate modul Work/Rating nanti** + render inline).
- `listForTalent(talentId)`, `listForHirer(hirerId)` — list dengan join opportunity (title).
- `ContractRow` type eksplisit (semua kolom relevan).

## 9. Server Actions (`modules/contract/actions.ts`)

- `createContract(_prev, formData)` → `ActionResult` (useActionState; redirect ke `/contracts/[id]`? — redirect di client setelah sukses via state, atau `redirect()` server-side; pola form create opportunity: return ActionResult + client redirect. Konsisten: form-based state → return ActionResult, client `router.push`.)
- `updateContractAction(contractId, formData)` void + redirect (fire-and-forget).
- `proposeContract(contractId)` void + redirect.
- `agreeContract(contractId)` void + redirect.
- `declineContract(contractId, formData)` void + redirect (decline_reason dari formData? — sederhana: tanpa input reason di UI MVP; kolom null. API menerima reason, UI skip → `declineContract(contractId)` void).

Guard: `requireRole` sesuai aktor + service ownership check.

## 10. UI

- **Hirer applicant list** (`app/hirer/opportunities/[id]/applications/page.tsx`): untuk application SELECTED yang belum punya contract → tombol "Buat Kontrak" → form inline (role title, compensation, dst.) → redirect detail contract. Jika contract sudah ada → link "Lihat Kontrak".
- **Detail contract** (`app/contracts/[id]/page.tsx`): semua field + status + agreement state; tombol kondisional:
  - HIRER: Edit (DRAFT, ke form edit), Propose (DRAFT), Agree (PENDING_AGREEMENT & !hirer_agreed), Decline (PENDING_AGREEMENT).
  - TALENT: Agree / Decline (PENDING_AGREEMENT & !talent_agreed).
  - ACTIVE: badge ACTIVE + info payment/work menyusul.
- **My Applications** (TALENT): blok contract inline (status + link detail) bila ada.
- Tidak ada halaman list /contracts terpisah (YAGNI — akses via application/hirer list; bisa ditambah belakangan).

## 11. Data Privacy & Security

- Authorization server-side di service (ownership + gate), RLS defense-in-depth.
- Simulated agreement — tidak ada signature, tidak ada dokumen, tidak ada data identitas.
- Contract memuat data bisnis standar (compensation, terms) — visible hanya involved + admin.

## 12. Verifikasi

`npx tsc --noEmit`, `npm run lint`, `npm run build` + E2E smoke (2 akun browser):
create → edit → propose (hirer_agreed auto) → agree talent → ACTIVE + payments(PENDING) + works(NOT_STARTED) terbentuk; decline path → TERMINATED; gate: create sebelum meeting COMPLETED → ditolak; create saat consent PENDING/MISSING → ditolak; double-create → ditolak; RLS REST: talent tidak bisa INSERT/PATCH field non-agreement.

## 13. Acceptance Criteria

1. HIRER bisa buat kontrak hanya untuk application SELECTED + meeting COMPLETED + consent eligible.
2. Propose → PENDING_AGREEMENT + hirer_agreed otomatis true.
3. Agree kedua pihak → ACTIVE + `payments` PENDING + `works` NOT_STARTED (amount = compensation).
4. Decline dari PENDING_AGREEMENT → TERMINATED (terminal).
5. Edit hanya DRAFT, oleh HIRER owner.
6. RLS: non-involved tidak lihat row; talent tidak bisa INSERT; admin bisa SELECT.
7. `getByApplicationId` siap dipakai gate modul Work (dokumentasi eksplisit).

## 14. Kontrak Lintas Modul (untuk modul berikutnya)

- **Work module gate:** `getByApplicationId(applicationId)` → harus ada contract ACTIVE sebelum work boleh mulai; `works` row sudah dibuat seed oleh contract service.
- **Payment module gate:** row payment dibuat oleh contract service saat ACTIVE; modul payment handle SIMULATED_PAID → RELEASED.
- **Rating gate:** contract COMPLETED + work COMPLETED (sprint berikutnya).
