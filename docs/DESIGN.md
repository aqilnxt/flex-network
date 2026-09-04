# Dokumentasi UI/UX — Flex Network

**Versi:** 1.0 — FINAL & LOCKED
**Status:** MVP Demo Baseline
**Stack:** Next.js 16 App Router + Tailwind CSS 4 + Supabase + Vercel
**Referensi:** BRD Final, SRS Final v1.2, TDD v1.0, DESIGN.md, PRODUCT.md

---

# A. Design System (Ringkas)

## 1. Introduction

### Tujuan Design System

Konsistensi visual dan perilaku di seluruh role (TALENT / HIRER / ADMIN). Mempercepat development modular monolith — satu source of truth untuk token, komponen, dan pattern. Menjaga trust: status, badge, dan empty/error state harus terbaca sama di 23 route.

### Prinsip Desain

- **Clean, Modern, Approachable** — white is the space, blue is the brand and action (DESIGN.md).
- **Experience-Driven** — UI mengarahkan ke output Verified Work History, bukan sekadar job board.
- **Deterministik & Accessible** — rule tanpa AI, kontras WCAG AA, keyboard-first.
- **Fast** — minimal motion, Tailwind utility, no heavy image.

### Scope Platform

**Web only (MVP).** Responsive: mobile 360px, tablet 768px, desktop 1280px (max-w 6xl). Tidak ada native app di MVP.

---

## 2. Foundations

### Color

| Token                  | Hex                        | Penggunaan                                           |
| ---------------------- | -------------------------- | ---------------------------------------------------- |
| `--color-primary`      | `#2447F9` Royal Blue       | CTA, link, badge strong match, focus ring, selection |
| `--color-primary-dark` | `#1A36CC`                  | Hover primary                                        |
| `--color-accent`       | `#459CE8` Light Blue       | Progress interest 30%, secondary accent              |
| `bg`                   | `#FFFFFF`                  | Card, page base                                      |
| `--color-tint`         | `#F3F6FF`                  | Section `cara-kerja`, subtle card bg, progress track |
| `--color-tint-2`       | `#F7F8FC`                  | Auth page bg, dashed empty state                     |
| `--color-line`         | `#E4E8F7`                  | Border card/input/table                              |
| `--color-ink`          | `#0D0907`                  | Heading, body                                        |
| `--color-ink-2`        | `#34364A`                  | Secondary text, description                          |
| `--color-success`      | `#22C55E` / `#15803D` text | VERIFIED, ACTIVE, confirmed                          |
| `--color-warning`      | `#F59E0B` / `#B45309` text | PENDING, escrow                                      |
| `--color-error`        | `#EF4444` / `#B91C1C` text | Error alert `#FEF2F2`, REJECTED                      |
| `selection`            | `#2447F9` on `#FFFFFF`     | `::selection` themed                                 |

Semantic selalu pakai tint foreground, bukan gray di atas warna (craft-floor: contrast).

### Typography

- **Family:** `Inter` via `next/font` (`--font-inter`), fallback ui-sans-serif. Mono `--font-geist-mono` untuk `tabular-nums`.
- **Weight:** 400 Body, 500 Nav, 600 Button/badge, 700 Heading, 800 Hero.
- **Scale:** Hero `3.4rem / 1.06 / -0.03em` desktop, `5xl` tablet, `4xl` mobile. H1 `2xl bold tracking-tight`, H2 `3xl/4xl extrabold -0.02em`, H3 `xl/2xl`. Body `15px/18px`, caption `xs/sm`, button `15px semibold`.
- **Rules:** `text-wrap: balance` untuk h1-h3, `max 65-75ch` body, tracking floor `-0.04em`, `truncate` untuk judul card.

### Spacing & Layout

- **Scale:** 4, 8, 16, 24, 32, 48, 64 (DESIGN.md).
- **Grid:** 12-col `max-w-6xl mx-auto px-6`. Hero `lg:grid-cols-12` 7/5, features `lg:grid-cols-12` 7 featured + 5 stack. Operate pages `p-8 max-w-4xl/5xl` single column.
- **Gutter/margin:** `gap-14` hero, `gap-6` card grid, `gap-4` form, `p-8` card, `py-20 lg:py-28` section.
- **Breakpoint:** `sm 640`, `md 768` (nav collapse), `lg 1024` (hero 12-col), `xl 1280`.

### Iconography

- **Library:** Inline SVG authoring (no emoji, no icon font). 5 ikon landing: `ShieldIcon` (verified), `TargetIcon` (match), `RouteIcon` (alur), `StarIcon` (rating), `LogoMark` (brand). Stroke `1.7`, size `h-6 w-6` section, `h-3.5 w-3.5` badge.
- **Rules:** Satu stroke weight konsisten, `aria-hidden`, `currentColor`.

### Elevation & Effects

- **Radius:** Card `1rem` (`rounded-2xl` landing, `card` Operate), button `0.75rem` (`rounded-xl` / `btn-*`), badge `9999px`, input `0.75rem`, focus ring `4px`.
- **Shadow:** Offset lembut. Card-hover `0 12px 28px -16px rgba(13,9,7,.16)` + `border-primary/40`. Hero card `0 24px 48px -24px rgba(13,9,7,.18)`. CTA `0 8px 20px -8px rgba(36,71,249,.55)`. Zero-offset halo dilarang.
- **Border:** `1px solid var(--color-line)` untuk card/input. Elevation pakai border atau shadow, bukan keduanya (ghost card).

### Motion & Animation (Opsional)

- **Duration/easing:** `rise 0.7s cubic-bezier(0.16,1,0.3,1)` forwards, delay `0.08/0.16/0.24/0.34s` (`rise-2..5`). `transition 0.15s ease` untuk button/border.
- **Prinsip:** Satu authored moment (hero stagger), bukan entrance per section. `prefers-reduced-motion` mematikan animasi. Tidak ada animasi hanya agar terlihat polish.

---

## 3. Components (Yang Dipakai di Demo)

| Komponen                      | Varian                                                                                                                                                | State                                                                                                            | Behavior                                                                  | Contoh Demo                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Button**                    | `btn-primary` (Royal Blue), `btn-success` (green), `btn-danger` (red), `btn ghost` (`border-line bg-white`)                                           | default, hover (`primary-dark`), focus-visible (2px primary ring), disabled `opacity-55`, pending `Memproses...` | `inline-flex center`, `h-11/12`, `font-semibold`                          | Login `Masuk`, Register `Daftar`, Apply, Agree, Suspend           |
| **Input / Select / Textarea** | text, email, password, search, textarea (2000 char)                                                                                                   | default, focus (ring), disabled, placeholder `#5B5E73`                                                           | `border-line rounded-[0.75rem] bg-white px-3.5 py-2 text-[15px] text-ink` | `opportunities` filter, `report-form` reason, `rating` reviewText |
| **Card**                      | `card` (`border-line bg-white rounded-2xl p-5-7`), `card-hover`                                                                                       | default, hover (border primary/40 + shadow)                                                                      | `flex flex-col`                                                           | Opportunity browse, work-history, dashboard stat                  |
| **Badge**                     | `badge` (`border-line bg-tint rounded-full px-2.5 text-xs semibold ink-2`), status color (PENDING yellow, VERIFIED green, REJECTED red, ACTIVE green) | —                                                                                                                | `inline-flex gap-1`                                                       | `a.status`, `verification_status`, `classification`               |
| **Table**                     | header `bg-tint-2 text-ink-2`, row `hover:bg-tint`, `overflow-x-auto`                                                                                 | —                                                                                                                | `border-collapse text-sm`                                                 | Admin users, audit logs                                           |
| **Alert**                     | error `bg-[#FEF2F2] text-[#B91C1C] rounded-lg`, success `bg-[#EAFBF1] text-[#15803D]`                                                                 | —                                                                                                                | `role=alert`                                                              | `useActionState` error di login/register/apply                    |
| **Empty State**               | dashed `border-dashed border-line bg-tint-2 px-5 py-8 text-center text-ink-2 rounded-xl`                                                              | —                                                                                                                | —                                                                         | `Belum ada opportunity`, `Belum ada riwayat kerja`                |
| **Progress**                  | `h-2 bg-tint rounded-full` + `bg-primary` / `bg-accent` fill                                                                                          | —                                                                                                                | `width %` via match score                                                 | Matching skill 70% / interest 30%                                 |
| **Nav/Header**                | `h-16 border-b border-line max-w-6xl`                                                                                                                 | default, hover `text-ink`, hidden `md:flex`                                                                      | `flex justify-between`                                                    | Landing header, dashboard nav                                     |

State lengkap hover/disabled/loading/error/empty sudah ada. `card-hover` untuk browse, `badge` untuk status deterministik.

---

## 4. Patterns (Yang Relevan)

**Form Pattern:** Single field + inline validation (Zod di `modules/*/schemas.ts`). Server Action `useActionState` (`login`, `register`, `submitRating`, `suspendUserAction`). Error di bawah form (`role=alert`, `#FEF2F2`). Select pakai `defaultValue` + `required`. Textarea `maxLength 2000`.

**List & Table Pattern:** Card grid `grid-cols-1 sm:2 lg:3 gap-4` (opportunities) atau vertical stack `flex-col gap-4` (applications, notifications). Filter via `method=get` (search, type, workMode) — tanpa JS. Pagination query param `?page` (matching). Table untuk admin (users, audit, reports) dengan `overflow-x-auto`.

**Empty State Pattern:** Border dashed `tint-2` + copy spesifik + CTA implisit (mis. `Belum ada aplikasi - temukan opportunity`). Muncul saat `array.length===0 && !error`.

**Error State Pattern:** Global `error` dari query (`Gagal memuat opportunity` di `bg-[#FEF2F2]`). Inline field error via Zod `VALIDATION_ERROR`. Business error `code/message` dari `lib/result.ts`.

**Loading Pattern:** Button `disabled` + label `Memproses...` (`pending`). Tidak ada skeleton di MVP (server component langsung render). Future: skeleton untuk browse jika lambat.

**Navigation Pattern:** Top nav `Cara Kerja` anchor + `Opportunity` + auth link. Dashboard role-based (`/dashboard` redirect ke `/dashboard/talent|hirer|admin`). Breadcrumb `Link ← Kembali` di detail. Tab tidak dipakai — YAGNI.

**Feedback Pattern:** Inline `alert` untuk error, badge `VERIFIED` untuk success permanen, `text-[#15803D]` untuk `Kontrak aktif`, `text-[#B45309]` untuk `Menunggu konfirmasi hirer`. Toast tidak dipakai — inline message cukup.

---

## 5. Accessibility (A11y) - High-Level

**Standar:** WCAG 2.1 AA (prinsip: Perceivable, Operable, Understandable, Robust).

**Kontras Warna Minimum:** Body `#0D0907` on `#FFFFFF` 19:1, `text-ink-2 #34364A` on `#FFFFFF` 11:1, `text-ink-2` on `bg-tint #F3F6FF` ~9:1. Large text `#2447F9` on white 6.5:1 (>3:1). Placeholder `#5B5E73` on white 7:1 (>4.5:1).

**Focus Indicator:** Global `:focus-visible { outline: 2px solid #2447F9; outline-offset: 2px; border-radius: 4px }`. Terlihat di keyboard tab.

**Keyboard Navigation:** Semua control `button`, `a`, `input`, `select` native tab order. `Link` Next.js preserve. Tidak ada trap.

**Screen Reader:** `aria-hidden` untuk separator dot dan ikon dekoratif. `aria-label` untuk filter `Cari judul atau deskripsi`. `role=alert` untuk error. Ikon punya `aria-hidden`, badge punya text. Heading hierarchy h1 → h2 → h3.

---

## 6. Content & Copy (High-Level)

**Tone & Voice:** Profesional, Approachable, Modern, Inklusif (PRODUCT.md). Bahasa Indonesia untuk app, Inggris untuk landing hero opsional. Konsisten `TALENT / HIRER / ADMIN` uppercase untuk role sistem.

**Pattern Microcopy:**

- Button: verb + object — `Masuk`, `Daftar`, `Filter`, `Setujui Kontrak`, `Mulai Kerja`, `Tandai Selesai`, `Kirim Rating`, `Suspend / Reactivate`, `Resolve / Reject`.
- Error: `Gagal memuat opportunity.`, `Alasan minimal 10 karakter`, `At least one target required` → diterjemahkan `Pilih minimal satu target`.
- Empty: `Belum ada opportunity yang cocok`, `Belum ada riwayat kerja yang terverifikasi`, `No submitted reports found.` → konsisten `Belum ada ...`.
- Confirmation: Tidak ada modal — action langsung via form (`Terapkan`, `Setujui (Simulasi)`). Decline butuh `decline_reason`.

**Glosarium Konsisten:** Opportunity (bukan lowongan), Application (lamaran), Matching (kecocokan), Verified Work History (riwayat terverifikasi), Consent (persetujuan wali simulasi), Contract (kontrak simulasi), Payment simulated (escrow simulasi), Rating dua arah, Report.

---

# B. UX Documentation

## 1. User Research Summary (Jika Ada)

**Metode Riset (MVP):** Desk research BRD + SRS final (locked). Asumsi berbasis problem statement lomba — tidak ada interview/survey formal sebelum demo. Validasi via smoke test internal 8 akun (talent, hirer, admin).

**Insight Utama:**

- Talent SMA/SMK butuh bukti kerja pertama yang dapat dibagikan (portfolio).
- Hirer UMKM butuh talent cepat tanpa proses rekrutmen berat, tapi butuh trust (meeting + contract).
- Lowongan tersebar, tidak terkurasi skill/interest.

**Pain Point & Opportunity:**

- Akses opportunity → solusi discovery + matching 70/30 deterministik.
- Ketidakjelasan minat → solusi interest match + verified history sebagai feedback loop.
- Keraguan hirer → solusi moderation admin + rating dua arah + audit log.

## 2. User Persona

### Persona 1 — TALENT: Dita (17, SMK TKJ)

- **Goals & Motivasi:** Dapat pengalaman project desain, membangun riwayat pertama, eksplorasi karier sebelum kuliah/kerja.
- **Pain Point:** Tidak punya CV, bingung cari magang yang menerima pelajar, takut ditipu.
- **Scenario:** Daftar sebagai TALENT → lengkapi skill `Desain Grafis` + interest `Event` → lihat `matching/recommendations` 82% STRONG_MATCH → apply → meeting scheduled → consent APPROVED (simulasi) → contract ACTIVE → work IN_PROGRESS → rating 5 → work_history VERIFIED muncul di profil publik.

### Persona 2 — HIRER: Pak Budi (UMKM Kopi Sore)

- **Goals:** Butuh 2 talent untuk handle sosmed 1 bulan, budget terbatas, butuh cepat.
- **Pain Point:** Posting lowongan tidak ada filter skill, seleksi manual lama.
- **Scenario:** Daftar HIRER → buat opportunity `Social Media Assistant` (requires_consent false, skill Figma) → submit → ADMIN approve → lihat applicant list → select TALENT → schedule meeting → create contract → payment SIMULATED_PAID → confirm work COMPLETED → rating hirer → release payment.

### Persona 3 — ADMIN: Sinta (Moderator)

- **Goals:** Jaga kualitas opportunity, tangani report, audit tindakan.
- **Pain Point:** Butuh overview cepat + trail audit.
- **Scenario:** Buka `/admin` (stats) → moderasi queue `/admin/opportunities` → suspend user bermasalah `/admin/users` → resolve report `/admin/reports` → cek `/admin/audit`.

## 3. User Journey Map (High-Level)

| Tahap           | Aware                    | Consider                  | Use (Core Flow)                                                                      | Retain                                            |
| --------------- | ------------------------ | ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **Action**      | Landing → CTA Daftar     | Lengkapi profil/skill     | Opportunity → Match → Apply → Meeting → Consent → Contract → Payment → Work → Rating | Verified Work History → share profil → re-apply   |
| **Thought**     | Apakah ini legit?        | Skill ku cocok?           | Apakah hirer serius?                                                                 | Bukti ini berguna untuk seleksi berikutnya?       |
| **Emotion**     | Penasaran                | Antusias                  | Cemas → yakin (meeting)                                                              | Bangga                                            |
| **Pain**        | Banyak job board generik | Tidak ada filter interest | Takut ghosting                                                                       | Riwayat tidak terverifikasi                       |
| **Opportunity** | Hero proof card VERIFIED | Skor 70/30 transparan     | Status badge + meeting link + consent simulasi                                       | Publik `profiles/[id]/work-history` VERIFIED-only |

## 4. User Flow

**Onboarding:**
`Register (role TALENT/HIRER) → Login → /dashboard → /profile (full_name, bio, location, skill/interest) → /opportunities (browse) atau /hirer/opportunities/new`

**Core Action — Talent Apply to Verified:**
`Browse /opportunities?search&type&workMode → Detail /opportunities/[id] (match badge) → ApplyForm (existingStatus check) → /applications (status APPLIED) → Hirer select → Meeting SCHEDULED (link/method) → Meeting COMPLETED → Consent PENDING → approveConsent → Contract PENDING_AGREEMENT → agreeContract → Contract ACTIVE (payment PENDING, work NOT_STARTED) → startWork → IN_PROGRESS → completeWork → COMPLETED awaiting hirer_confirm → hirer confirmWork → Payment SIMULATED_PAID → releasePayment → RELEASED → Contract COMPLETED → submitRating (score 1-5) → kedua rating lengkap → work_history VERIFIED`

**Hirer Create to Release:**
`Create opportunity (DRAFT) → submitForReview → PENDING_REVIEW → Admin moderate APPROVE_PUBLISH → PUBLISHED → list applications → select → schedule meeting → complete meeting → create contract → propose → talent agree → ACTIVE → simulate payment → confirm work → release`

**Error/Recovery:**

- Apply duplikat → `unique (talent_id, opportunity_id)` → error `Sudah melamar`.
- Past meeting date → `scheduleMeetingSchema` refine भविष्य → error inline.
- Gate fail (meeting not COMPLETED untuk consent, consent not APPROVED untuk contract) → derived `MISSING/NOT_REQUIRED` + UI pesan `Selesaikan meeting terlebih dahulu`.
- RLS fail → REST 0 rows / 42501, UI tidak bocorkan alasan (defense-in-depth).

**Decision Point:** `requires_consent` boolean di opportunity → branch consent lazy (row hanya jika required). `max_talent` gate di select → check `selected count < max`.

## 5. Wireframes (Low-Fidelity)

> Sketch fokus struktur, bukan visual. Semua wireframe ada di implementasi `app/` — lihat file untuk hi-fi.

- **Landing:** Header 6xl h-16 (logo + nav + Masuk/Daftar) | Hero 12-col 7 teks (h1, p 15 kata, 2 CTA, 4 dot) + 5 card VERIFIED | Features 12-col 7 featured + 5 stack 2 | CTA bg-primary centered | Footer 2-col.
- **Login/Register:** `bg-tint-2 center` → `card max-w-sm p-8` (h1, p, form gap-4, alert, btn h-11, link bawah).
- **Opportunities Browse:** `p-8 max-w-5xl` h1 + filter row (search input + 2 select + btn) + grid 1/2/3 card hover + empty dashed.
- **Opportunity Detail:** `max-w-3xl` back link + h1 + meta pills `bg-gray-100` → ganti `badge bg-tint` + match card `bg-tint-2 border-line` + detail + skills/interests pills + deadline + ApplyForm.
- **Applications (Talent):** `max-w-3xl flex-col gap-4` card per application: header title+status badge, meeting box `bg-tint-2`, consent block `border-t`, contract block, work block, payment block, rating form.
- **Hirer Applications:** Similar + schedule form + meeting info + work confirm button.
- **Contract Detail:** `max-w-2xl` contract card + work/payment/rating blocks + action row (Edit/Propose/Agree/Decline).
- **Admin Dashboard:** `max-w-4xl` 5 stat card `grid 1/3`, 4 nav link `grid 2/4 hover:bg-tint`.
- **Admin Users/Reports/Audit:** `max-w-4xl/6xl/7xl` table/card list, action forms per row.

Annotation: semua Operate page `p-8`, heading `tracking-tight`, badge `tabular-nums`.

## 6. Prototype

- **Link:** Tidak ada Figma interaktif di MVP — prototype = deployed app.
- **Deploy:** `https://flex-network-1jnffz4fl-aqilnxt-4374s-projects.vercel.app` (alias `flex-network-aqilnxt-4374s-projects.vercel.app`), Vercel Preview on push.
- **Scope yang bisa dicoba:** Full business flow Register → Work History (13 sprint), plus Admin. Akun test: `hirer@test.com / Hirer#2026Test`, `admin@test.com / Admin#2026Test`, `talent@test.com`.
- **Catatan untuk stakeholder & dev:** Semua mutation via Server Action, RLS defense-in-depth, audit log best-effort `.catch(()=>{})`. Ikon inline SVG, no photo (DESIGN.md Imagery).

## 7. Usability Test Plan & Result (Opsional — MVP Smoke)

**Tujuan:** Verifikasi core flow tanpa error RLS/UI.

**Scenario & Task:**

1. Talent register → lengkapi skill → browse → apply (check duplikat).
2. Hirer create opportunity → submit → admin approve → talent match badge muncul.
3. Select → schedule meeting (past date harus fail) → complete → consent approve → contract agree → payment simulate → work complete → rating dua arah → work_history VERIFIED.
4. Admin suspend user → cek audit log.

**Metrik (smoke):** 12 sprint × build ok, `next build` 23/23 pages Ready, `detect.mjs` 0 em-dash, `[]` theme drift, `npx tsc --noEmit` pass. RLS REST talent non-owner 204 0 rows, anon [].

**Insight & Rekomendasi:**

- Gate Verifikasi: is_minor di `talent_profiles` bukan `profiles` → fix queries (Decision Log 2026-08-29).
- Meeting `getOwnedMeeting` cek `meetings.status` bukan `application.status` → fix.
- Work duplikat block di `applications/page.tsx` → cleanup saat rating.
- Next: Notification realtime + Report form → sudah dikerjakan (sprint 12-13).

---

# C. UI Specification (Screen-by-Screen - Fokus Demo)

## Screen 1: LANDING (`/`)

**Overview:** Tujuan persuasion — Talent/Hirer memutuskan Daftar. Role: public (anon). Figma: no frame — code is source.

**Layout:** Header border-b, hero 12-col, features `bg-tint`, CTA `bg-primary`, footer `border-t`. Responsive: hero stack mobile.

**Components:** LogoMark, header nav, `btn-primary` + `btn ghost`, hero card `rounded-2xl shadow`, feature card `border-line bg-white p-7`, progress `h-2 bg-tint`.

**Interactions:** `href="#cara-kerja"` anchor, `Link /register`, `Link /opportunities`. Rise animation sekali.

**Validation:** Tidak ada form.

**Empty States:** Tidak ada.

**Data:** `historyRows` mock 3 item hardcode.

**Notes:** `Imagery` icon-only (5 SVG). Subtext 15 kata (<20) pass hero discipline. Em-dash 0.

---

## Screen 2: LOGIN (`/login`)

**Overview:** Masuk untuk melanjutkan. Role: public. Guard: jika sudah login redirect `/dashboard`.

**Layout:** `flex flex-1 items-center justify-center bg-tint-2 px-6 py-16` → `card w-full max-w-sm p-8`.

**Components:** Input email/password, `btn-primary h-11 w-full`, alert `bg-[#FEF2F2]`, link `text-primary`.

**Interactions:** `useActionState(login)` → `modules/auth/actions.ts` → `supabase.auth.signInWithPassword`. Pending `Memproses...`. Error `role=alert`.

**Validation:** email required type email, password required. Zod `loginSchema`.

**Empty:** —

**Data:** Auth via Supabase.

**Notes:** AutoComplete email/current-password. Focus ring primary.

---

## Screen 3: REGISTER (`/register`)

**Overview:** Mulai bangun riwayat terverifikasi. Public.

**Layout:** Sama `max-w-sm p-8`, `py-12` (4 field).

**Components:** Input fullName, email, password `minLength 8`, select role TALENT/HIRER `default TALENT`, button, alert.

**Interactions:** `useActionState(register)` → `handle_new_user()` trigger buat `profiles` + `talent/hirer profile`. Pilih role menentukan dashboard redirect.

**Validation:** Zod `registerSchema` (fullName, email, password 8 char, role).

**Notes:** Email confirmation tidak wajib (langsung login) — Decision Log 2026-08-29.

---

## Screen 4: PROFILE (`/profile`)

**Overview:** Informasi dasar akun. Role: authenticated (`requireUser`).

**Layout:** `p-8 max-w-lg` h1 + p `text-ink-2` + `card mt-6 p-6` berisi `ProfileForm`.

**Components:** `ProfileForm` (client), input full_name, phone (profile_private), bio, location, `btn-primary`.

**Interactions:** Server fetch `profiles` + `profile_private` via `createSupabaseServerClient`. Submit → `modules/profile/actions.ts` update + skill/interest CRUD.

**Data:** `profiles`, `profile_private`, `talent_profiles`/`hirer_profiles`.

**Notes:** RLS owner-scoped (008). Tanpa GET /skills master dulu.

---

## Screen 5: OPPORTUNITIES BROWSE (`/opportunities`)

**Overview:** Temukan pengalaman kerja nyata. Role: authenticated.

**Layout:** `p-8 max-w-5xl` h1 + p + filter row `flex-wrap gap-2.5` + grid `1/2/3 gap-4` card hover + empty dashed.

**Components:** `card card-hover p-5`, `badge` classification, form filter (search, type `OPPORTUNITY_TYPES`, workMode `WORK_MODES`), `btn-primary h-10`.

**Interactions:** `method=get` filter → `listPublished({search,type,workMode})`. Talent: `getMatchScoresForTalent` → badge `STRONG/GOOD/WEAK/NO` + `finalMatchScore 0%`.

**Validation:** Query param optional.

**Empty:** `Belum ada opportunity yang cocok`.

**Data:** `opportunities` (RLS `is_admin` + junction), `getRecommendations` scoring server-side 70/30.

**Notes:** Match reuse `scoreOpportunity` deterministic. Pagination `page/limit 12`.

---

## Screen 6: OPPORTUNITY DETAIL (`/opportunities/[id]`)

**Overview:** Lihat detail + kecocokan + lamar. Role: authenticated.

**Layout:** `p-8 max-w-3xl` back `← Kembali` + h1 `3xl` + meta + match card `bg-tint-2 border-line` + pills + detail + ApplyForm.

**Components:** `badge`, progress `bg-gray-200` → should be `bg-tint`, `ApplyForm`.

**Interactions:** `getOpportunityById(id)` + `getApplicationStatus(user.id,id)` + `getMatchScoresForTalent`. `ApplyForm` cek `existingStatus` → disable jika sudah apply.

**Data:** `opportunities`, `opportunity_skills/interests`, `applications`.

**Notes:** GRANT fix 009 (anon/authenticated/service_role). Polished dari `bg-gray-*` ke token.

---

## Screen 7: MY APPLICATIONS (`/applications`)

**Overview:** Aplikasi Saya — hub Talent untuk semua stage. Role: `requireRole TALENT`.

**Layout:** `p-8 max-w-3xl flex-col gap-4` 1 card per application, tiap card 6 block `border-t border-line pt-4`.

**Components:** `card p-5`, `badge` status (APPLIED/UNDER_REVIEW/SELECTED/REJECTED), meeting box `bg-tint-2 rounded-xl`, `btn-success/danger`, `ConsentRequestForm`, rating form `select + input`.

**Interactions:** Fetch `listForTalent` + `listForApplications` (meeting, consents, contracts, works, payments, ratings) batch. Action: `approveConsent`, `rejectConsent`, `agreeContract`, `declineContract`, `startWork`, `completeWork`, `submitRating` — semua bind `contract.id` + `redirectTo`.

**Validation:** Consent gate `getRequirementMap` (is_minor di talent_profiles) + `getConsentDecision eligible iff !required || APPROVED`. Contract gate meeting COMPLETED.

**Empty:** `Belum ada aplikasi`.

**Data:** 6 query batch.

**Notes:** Cleanup duplikat Work block (2026-08-31). Payment read-only talent, Work transition TALENT only.

---

## Screen 8: HIRER APPLICATIONS (`/hirer/opportunities/[id]/applications`)

**Overview:** Daftar pelamar untuk seleksi. Role: HIRER owner.

**Layout:** `p-8 max-w-3xl` h1 + status + create contract form + applicant list card.

**Components:** Card per applicant `border rounded p-4`, badge status, meeting form `schedule-meeting-form.tsx` (`meetingDate`, `meetingTime`, `meetingLink`), work confirm `confirmWork`.

**Interactions:** `listForOpportunity`, `getByApplicationId` gate, `schedule/complete/cancel` meeting (CANCELLED terminal, no reschedule).

**Notes:** RLS `hirer+SELECTED` insert, `hirer` update. Smoke E2E lulus.

---

## Screen 9: CONTRACT DETAIL (`/contracts/[id]`)

**Overview:** Kontrak simulasi + work/payment/rating. Role: involved (talent/hirer).

**Layout:** `p-8 max-w-2xl` back + h1 + meta badge + 4 block `border rounded p-4 flex flex-col gap-2`.

**Components:** Detail block, Work block (`NOT_STARTED → IN_PROGRESS → COMPLETED` + `hirer_confirmed`), Payment block (`PENDING → SIMULATED_PAID → RELEASED` + side effect COMPLETED), Rating block (immutable, UNIQUE `work_id,rater_id,type`), action row `Edit/Propose/Agree/Decline`.

**Interactions:** `getById`, `getByContractId` gate Work/Payment/Rating, `propose/agree/decline` (propose auto-agree hirer), `simulatePayment/releasePayment` (hirer), `start/complete/confirmWork`, `submitRating`.

**Notes:** ACTIVE side effects insert payments/works idempotent 23505. RLS involved/admin + anti-spoof rater_id.

---

## Screen 10: WORK HISTORY (`/work-history` + `/profiles/[id]/work-history`)

**Overview:** Private dashboard Talent (semua) vs publik VERIFIED-only. Scope sprint 11.

**Layout:** `p-8 max-w-4xl` h1 `Riwayat Kerja Kamu` + card list `card p-6 flex flex-col gap-2`.

**Components:** Card `title`, duration, compensation `Rp toLocaleString id-ID`, badge `verification_status` (PENDING yellow, VERIFIED green, REJECTED red), `verified_at` date.

**Data:** `work_history` — upsert via Rating side effect (kedua rating lengkap → VERIFIED). RLS `anon` SELECT where `verification_status=VERIFIED` (017), owner full.

**Notes:** Publik tidak expose hirer_id. Idempotent race 23505.

---

## Screen 11: NOTIFICATIONS (`/notifications`)

**Overview:** Pusat notifikasi in-app. Role: authenticated.

**Layout:** `max-w-2xl mx-auto p-4 space-y-4` h1 + `ul space-y-2` `card p-4 flex justify-between`.

**Components:** `card` read=`bg-white text-ink-2` vs unread=`bg-tint border-primary/30 font-semibold`, `text-ink-2` message, `text-ink-2/70` date, `btn-primary` Mark as read.

**Interactions:** `listNotifications(user.id)` + `markAsRead` server action `update read_at`. Realtime via `notification-badge` (supabase realtime subscribe).

**Notes:** Side effects di 6 service best-effort `.catch(()=>{})`. RLS `auth.uid()=user_id`. Fixed `bg-blue-50 text-gray-700` → token.

---

## Screen 12: ADMIN DASHBOARD & SUB-PAGES (`/admin`, `/admin/users`, `/admin/opportunities`, `/admin/reports`, `/admin/audit`)

**Overview:** Operasional oversight. Role: `requireRole ADMIN`.

**Layout:**

- `/admin` → `max-w-4xl` 5 stat card `grid 1/3 gap-4` (`card` / `border-line`) + 4 nav link `grid 2/4 hover:bg-tint`.
- `/admin/users` → card list per user `flex justify-between`, badge ACTIVE green / SUSPENDED red, form `Suspend/Reactivate`.
- `/admin/opportunities` → queue `PENDING_REVIEW` card + form `select APPROVE_PUBLISH/REQUEST_CHANGES/DELETE + notes` + `btn-primary`.
- `/admin/reports` → `max-w-6xl` card `flex md:row` reporter reason + target pills + `Resolve (btn-success) / Reject (btn-danger)`.
- `/admin/audit` → `max-w-7xl overflow-x-auto` table `bg-tint-2 header`, `hover:bg-tint` row, mono `actor_id/resource_id`.

**Interactions:** `getDashboardStats` count head:true parallel, `listUsers`, `suspendUser/reactivateUser` + `logAudit`, `listReports(SUBMITTED)` + `resolve/reject`, `listAuditLogs(100)`.

**Data:** `reports` RLS `reporter_id=auth.uid() OR is_admin`, `audit_logs` admin-only, `profiles.status` update admin.

**Notes:** Polish sprint: `text-gray-*`→`text-ink-2`, `bg-gray-*`→`bg-tint`, `border`→`border-line`, `card`/`btn-*`. Build 23/23 Ready.

---

## Catatan Developer Global

- Auth: `modules/lib/auth.ts` `getCurrentUser/requireUser/requireRole`, RLS `is_admin()`.
- Validation: Zod di `modules/*/schemas.ts`.
- Pattern: `queries.ts` (read) + `service.ts` (write + state machine) + `actions.ts` (Server Action) + `page.tsx`.
- Audit: `modules/audit/service.ts` `logAudit` best-effort after admin action.
- Hosting: Vercel `flex-network-1jnffz4fl...` Ready, env Supabase set, auto preview on push (future).
