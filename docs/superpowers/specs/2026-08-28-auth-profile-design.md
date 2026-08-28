# Auth & Profile Module Design

**Status:** Approved
**Date:** 2026-08-28
**Scope:** Foundation — Module Auth & Profile (registrasi, login, logout, session, profile, skill/interest CRUD)

## Goal

Membangun module Auth & Profile sebagai foundation Flex Network: registrasi user ber-role (TALENT/HIRER), login/logout via Supabase Auth, session management, profil (baca & update), serta CRUD skill & interest milik talent.

## Decisions (locked)

1. **Profile dibuat via DB trigger** (`005_auth_triggers.sql`), bukan application-layer. Server Action register hanya memanggil `supabase.auth.signUp()` dengan `user_metadata { role, full_name }`; trigger `handle_new_user()` yang insert `profiles` + `talent_profiles`/`hirer_profiles`.
2. **Server Actions dulu** — REST API route handlers ditunda ke task terpisah.
3. **#A Email confirmation:** TIDAK wajib (langsung login setelah register). `emailRedirectTo` tidak di-set ke flow verifikasi ketat.
4. **#B Error surface:** `ActionResult<T>` typed contract (API-SPEC Section 21) + `useActionState` (React 19) untuk tampilkan error generik di form.
5. **#C Scope skill/interest:** Full CRUD `add`/`remove` untuk `talent_skills` & `talent_interests`. Master-data `GET /skills`/`GET /interests` TIDAK termasuk (task master data terpisah).

## Architecture

Alur dependency (dari AGENTS.md):
```
UI Components → Server Actions → Application Service → Repository → Supabase
```

Untuk foundation, `service.ts` masih tipis (belum repository pattern penuh), tetapi boundary module sudah dipasang sejak awal. Semua mutation server-side dengan ownership check + RLS sebagai defense-in-depth.

## Module Structure

```
modules/
├── auth/
│   ├── actions.ts          # register, login, logout (Server Actions)
│   ├── schemas.ts          # Zod: registerSchema, loginSchema
│   └── service.ts          # register/login orchestration (thin)
├── profile/
│   ├── actions.ts          # updateProfile, addSkill, removeSkill, addInterest, removeInterest
│   ├── schemas.ts          # Zod: updateProfileSchema
│   └── service.ts          # profile update + skill/interest mutation
└── lib/
    └── auth.ts             # getCurrentUser(), requireUser(), requireRole()
```

Root:
- `middleware.ts` — session refresh + protected-route enforcement.
- `lib/supabase/` — sudah ada (`server.ts`, `browser.ts`, `admin.ts`).

Dependency tambahan: `zod`.

## Migration `005_auth_triggers.sql`

- `handle_new_user()` trigger on `auth.users` AFTER INSERT:
  - Insert `profiles(id, role, full_name)` dari `new.id` + `new.raw_user_meta_data`.
  - `role` dibatasi `TALENT`/`HIRER`; fallback `TALENT`; TIDAK PERNAH `ADMIN` dari client.
  - `TALENT` → insert `talent_profiles(profile_id)`.
  - `HIRER` → insert `hirer_profiles(profile_id)`.
- Fungsi `security definer` + `search_path` eksplisit (APPENDIX A.39).

## Server Actions: Auth (`modules/auth/actions.ts`)

1. `register(formData)`:
   - Zod parse `{ email, password, role, fullName }`.
   - `signUp({ email, password, options: { data: { role, full_name: fullName } } })`.
   - Return `ActionResult`. Tidak insert profile manual.
2. `login(formData)`:
   - `signInWithPassword({ email, password })`.
3. `logout()`:
   - `signOut()`, redirect `/login`.

`modules/lib/auth.ts`:
- `getCurrentUser()` — `getUser()` + fetch `profiles` (role, status).
- `requireUser()` — redirect kalau tidak login.
- `requireRole(role)` — enforce RBAC server-side.

## Server Actions: Profile (`modules/profile/actions.ts`)

- `updateProfile(formData)` — Zod `{ fullName, phone, bio, location }`; update `profiles` + `profile_private` (phone). Tidak boleh ubah `id`, `role`, `status`. `is_minor` server-side (APPENDIX A.5) — belum dihitung pada foundation ini.
- `addSkill` / `removeSkill(skillId)` — insert/delete `talent_skills`.
- `addInterest` / `removeInterest(interestId)` — insert/delete `talent_interests`.
- Semua guarded `requireUser()` + ownership (`.uid() = profile_id`).

## Pages (`app/`)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── page.tsx          # router: baca role → redirect /dashboard/talent atau /dashboard/hirer
│   ├── talent/page.tsx   # placeholder
│   └── hirer/page.tsx    # placeholder
└── profile/page.tsx      # baca + update + skill/interest
```

## Middleware (`middleware.ts`)

- Matcher eksplisit: `/dashboard/:path*`, `/profile`.
- `createServerClient` + refresh session cookie.
- Tidak login + akses protected → redirect `/login`.
- Sudah login + akses `/login`/`/register` → redirect `/dashboard`.
- Role-based redirect final di `/dashboard` (server component); middleware hanya enforce auth (authorization final tetap server-side, TDD 4.3).

## Security Rules (dari AGENTS.md)

- Authorization selalu server-side; client tidak dipercaya.
- Ownership check sebelum memproses resource.
- RLS sebagai defense-in-depth (sudah diaktifkan di `003_rls_policies.sql`).
- `SUPABASE_SERVICE_ROLE_KEY` hanya server — admin.ts tidak dipakai user flow biasa.
- Jangan log password/token/service key/data sensitif.
- `role` tidak boleh `ADMIN` dari client (self-register hanya TALENT/HIRER).
- `is_minor` tidak dipercaya dari client.

## Out of Scope

- REST API route handlers (ditunda).
- Master-data `GET /skills` / `GET /interests` (task terpisah).
- `birth_date` + perhitungan `is_minor` server-side (task Profile lanjutan).
- ADMIN self-registration & admin dashboard.
- UI polish penuh (DESIGN.md) — foundation fokus ke alur fungsional.

## Acceptance Criteria

- User TALENT bisa register → langsung login → diarahkan ke `/dashboard/talent`.
- User HIRER bisa register → langsung login → diarahkan ke `/dashboard/hirer`.
- `profiles`, `talent_profiles`, `hirer_profiles` terisi otomatis oleh trigger.
- `logout` menghapus session dan redirect `/login`.
- User dapat update profile miliknya (full_name, phone, bio, location).
- User TALENT dapat add/remove skill & interest miliknya.
- Akses protected route tanpa login di-redirect ke `/login`.
- Middleware tidak menghalangi halaman publik (`/`, `/login`, `/register`).
