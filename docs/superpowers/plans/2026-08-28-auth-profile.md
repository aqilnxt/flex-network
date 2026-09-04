# Auth & Profile Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun module Auth & Profile foundation (register/login/logout/session, profile read+update, skill/interest CRUD) di atas Supabase Auth + database trigger.

**Architecture:** UI → Server Actions → Application Service → Supabase. Profile dibuat otomatis oleh DB trigger `handle_new_user()` saat `auth.users` insert; Server Action register hanya `signUp()` dengan `user_metadata { role, full_name }`. Middleware enforce auth pada route protected; role redirect final di server component `/dashboard`.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript strict, Supabase SSR (`@supabase/ssr`), Supabase Auth, Zod, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-28-auth-profile-design.md`

## Global Constraints

- Status `role` hanya `TALENT`/`HIRER` saat self-register; `ADMIN` tidak bisa dari client.
- `is_minor` TIDAK dipercaya dari client; server-side (belum dihitung di foundation ini).
- Authorization selalu server-side; ownership check `.uid() = profile_id` / `.uid() = id` sebelum mutation.
- Semua Server Action return `ActionResult<T>` (API-SPEC Section 21); tidak melempar raw exception ke client.
- Jangan log password/token/service key.
- RLS sudah aktif (`003_rls_policies.sql`); gunakan server client (`lib/supabase/server.ts`), jangan `admin.ts` untuk user flow biasa.
- Email confirmation TIDAK wajib.
- Impor alias `@/*` → root (tsconfig paths).
- No test runner terpasang (tidak ada vitest/jest); verifikasi = `npm run build` (typecheck) + `npm run dev` manual.

## File Structure

| File | Tanggung jawab |
|------|----------------|
| `supabase/migrations/005_auth_triggers.sql` | Trigger `handle_new_user()` yang membuat `profiles` + `talent_profiles`/`hirer_profiles` |
| `lib/result.ts` | Tipe `ActionResult<T>` shared |
| `modules/lib/auth.ts` | `getCurrentUser()`, `requireUser()`, `requireRole()` |
| `modules/auth/schemas.ts` | `registerSchema`, `loginSchema` (Zod) |
| `modules/auth/actions.ts` | `register`, `login`, `logout` |
| `modules/auth/service.ts` | orchestrasi register/login (thin) |
| `modules/profile/schemas.ts` | `updateProfileSchema` (Zod) |
| `modules/profile/actions.ts` | `updateProfile`, `addSkill`, `removeSkill`, `addInterest`, `removeInterest` |
| `modules/profile/service.ts` | mutation profile + skill/interest |
| `middleware.ts` | session refresh + protected route |
| `app/(auth)/login/page.tsx` | halaman login |
| `app/(auth)/register/page.tsx` | halaman register |
| `app/dashboard/page.tsx` | router role-based |
| `app/dashboard/talent/page.tsx` | placeholder |
| `app/dashboard/hirer/page.tsx` | placeholder |
| `app/profile/page.tsx` | baca/update profile + skill/interest |

---

## Task 1: Migration `005_auth_triggers.sql`

**Files:**
- Create: `supabase/migrations/005_auth_triggers.sql`

**Interfaces:**
- Produces: trigger `handle_new_user()` on `auth.users`. Depend by `modules/auth` (register) implicitly; Task 2-10 assume role/full_name tersimpan via trigger.

**Isi:** Fungsi `public.handle_new_user()` `security definer` dengan `set search_path = ''` dan referensi eksplisit `auth.users`, lalu insert `public.profiles`, `public.talent_profiles`, `public.hirer_profiles` berdasar `new.raw_user_meta_data`.

```sql
-- 005_auth_triggers.sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_full_name text;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'TALENT');
  if v_role not in ('TALENT', 'HIRER') then
    v_role := 'TALENT';
  end if;
  v_full_name := new.raw_user_meta_data ->> 'full_name';

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, v_full_name)
  on conflict (id) do nothing;

  if v_role = 'TALENT' then
    insert into public.talent_profiles (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  elsif v_role = 'HIRER' then
    insert into public.hirer_profiles (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Steps:**
- [ ] **Step 1:** Tulis `supabase/migrations/005_auth_triggers.sql` (isi di atas).
- [ ] **Step 2:** Review `search_path = ''` + semua tabel pakai `public.` (A.39).
- [ ] **Step 3:** Review `role` fallback & blokir `ADMIN`.
- [ ] **Step 4:** Commit `feat(db): add auth trigger to create profiles`.

---

## Task 2: Shared types - `lib/result.ts`

**Files:**
- Create: `lib/result.ts`

**Interfaces:**
- Produces: `ActionResult<T>` dipakai semua action task berikutnya.

```ts
export type ActionResult<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };
```

**Steps:**
- [ ] **Step 1:** Tulis `lib/result.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat: add ActionResult shared type`.

---

## Task 3: Install Zod

**Files:**
- Modify: `package.json`

**Steps:**
- [ ] **Step 1:** Run `npm install zod`.
- [ ] **Step 2:** Verifikasi `zod` muncul di `dependencies`.
- [ ] **Step 3:** Commit `chore: add zod`.

---

## Task 4: Auth helpers - `modules/lib/auth.ts`

**Files:**
- Create: `modules/lib/auth.ts`

**Interfaces:**
- Consumes: `lib/supabase/server.ts` (`createSupabaseServerClient()`), `next/headers`, `next/navigation`.
- Produces:
  - `type SessionRole = "TALENT" | "HIRER" | "ADMIN";`
  - `type CurrentUser = { id: string; email: string; role: SessionRole; status: string; fullName: string | null };`
  - `async function getCurrentUser(): Promise<CurrentUser | null>`
  - `async function requireUser(): Promise<CurrentUser>` (redirect `/login` kalau null)
  - `async function requireRole(role: SessionRole): Promise<CurrentUser>` (redirect `/dashboard` kalau role tidak cocok)

```ts
import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionRole = "TALENT" | "HIRER" | "ADMIN";

export type CurrentUser = {
  id: string;
  email: string;
  role: SessionRole;
  status: string;
  fullName: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, full_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile?.role as SessionRole) ?? "TALENT",
    status: profile?.status ?? "ACTIVE",
    fullName: profile?.full_name ?? null,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: SessionRole): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) redirect("/dashboard");
  return user;
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/lib/auth.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(auth): add server auth helpers`.

---

## Task 5: Auth schemas - `modules/auth/schemas.ts`

**Files:**
- Create: `modules/auth/schemas.ts`

**Interfaces:**
- Consumes: `zod`.
- Produces: `registerSchema`, `loginSchema`, dan inferred types.

```ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TALENT", "HIRER"]),
  fullName: z.string().min(2).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/auth/schemas.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(auth): add auth zod schemas`.

---

## Task 6: Auth service + actions - `modules/auth/service.ts`, `modules/auth/actions.ts`

**Files:**
- Create: `modules/auth/service.ts`
- Create: `modules/auth/actions.ts`

**Interfaces:**
- Consumes: `lib/result.ts` (`ActionResult`), `modules/lib/auth.ts`, `modules/auth/schemas.ts` (`RegisterInput`, `LoginInput`), `lib/supabase/server.ts`.
- Produces: Server Actions `register`, `login`, `logout` (di-import page).

`service.ts`:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegisterInput, LoginInput } from "./schemas";

export async function registerUser(input: RegisterInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { role: input.role, full_name: input.fullName } },
  });
  return { data, error };
}

export async function loginUser(input: LoginInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  return { data, error };
}

export async function logoutUser() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
```

`actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { registerSchema, loginSchema } from "./schemas";
import { registerUser, loginUser, logoutUser } from "./service";

export async function register(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data yang dikirim tidak valid.",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const { error } = await registerUser(parsed.data);

  if (error) {
    return {
      success: false,
      error: { code: "AUTH_INVALID", message: error.message },
    };
  }

  redirect("/login");
}

export async function login(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
    };
  }

  const { error } = await loginUser(parsed.data);

  if (error) {
    return {
      success: false,
      error: { code: "AUTH_INVALID", message: error.message },
    };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await logoutUser();
  redirect("/login");
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/auth/service.ts`.
- [ ] **Step 2:** Tulis `modules/auth/actions.ts`.
- [ ] **Step 3:** Commit `feat(auth): add register, login, logout server actions`.

---

## Task 7: Profile schemas - `modules/profile/schemas.ts`

**Files:**
- Create: `modules/profile/schemas.ts`

**Interfaces:**
- Produces: `updateProfileSchema` + `UpdateProfileInput`.

```ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().max(30).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/profile/schemas.ts`.
- [ ] **Step 2:** Commit `feat(profile): add profile zod schema`.

---

## Task 8: Profile service + actions - `modules/profile/service.ts`, `modules/profile/actions.ts`

**Files:**
- Create: `modules/profile/service.ts`
- Create: `modules/profile/actions.ts`

**Interfaces:**
- Consumes: `modules/lib/auth.ts` (`requireUser`), `modules/profile/schemas.ts`, `lib/supabase/server.ts`.
- Produces: `updateProfile`, `addSkill`, `removeSkill`, `addInterest`, `removeInterest`.

`service.ts`:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UpdateProfileInput } from "./schemas";

export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const supabase = await createSupabaseServerClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName, bio: input.bio, location: input.location })
    .eq("id", userId);

  const { error: privateError } = await supabase
    .from("profile_private")
    .upsert({ profile_id: userId, phone: input.phone });

  return { profileError, privateError };
}

export async function addOwnSkill(userId: string, skillId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_skills")
    .upsert({ profile_id: userId, skill_id: skillId });
}

export async function removeOwnSkill(userId: string, skillId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_skills")
    .delete()
    .eq("profile_id", userId)
    .eq("skill_id", skillId);
}

export async function addOwnInterest(userId: string, interestId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_interests")
    .upsert({ profile_id: userId, interest_id: interestId });
}

export async function removeOwnInterest(userId: string, interestId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_interests")
    .delete()
    .eq("profile_id", userId)
    .eq("interest_id", interestId);
}
```

`actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/result";
import { requireUser } from "@/modules/lib/auth";
import { updateProfileSchema } from "./schemas";
import {
  updateOwnProfile,
  addOwnSkill,
  removeOwnSkill,
  addOwnInterest,
  removeOwnInterest,
} from "./service";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    bio: formData.get("bio"),
    location: formData.get("location"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
    };
  }

  const { profileError, privateError } = await updateOwnProfile(user.id, parsed.data);
  if (profileError || privateError) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui profil." },
    };
  }

  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function addSkill(skillId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await addOwnSkill(user.id, skillId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function removeSkill(skillId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await removeOwnSkill(user.id, skillId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function addInterest(interestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await addOwnInterest(user.id, interestId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function removeInterest(interestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await removeOwnInterest(user.id, interestId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/profile/service.ts`.
- [ ] **Step 2:** Tulis `modules/profile/actions.ts`.
- [ ] **Step 3:** Commit `feat(profile): add profile and skill/interest server actions`.

---

## Task 9: Middleware - `middleware.ts`

**Files:**
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `@supabase/ssr`, `next/server`.

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = request.nextUrl.pathname.startsWith("/dashboard")
    || request.nextUrl.pathname.startsWith("/profile");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

**Steps:**
- [ ] **Step 1:** Tulis `middleware.ts`.
- [ ] **Step 2:** Commit `feat(auth): add protected route middleware`.

---

## Task 10: Auth pages - `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `modules/auth/actions.ts` (`login`, `register`), `lib/result.ts`.
- Produces: halaman form login & register.

`login/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { login } from "@/modules/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <h1 className="text-2xl font-bold">Login</h1>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
```

`register/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { register } from "@/modules/auth/actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null);

  return (
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <h1 className="text-2xl font-bold">Register</h1>
      <input name="fullName" placeholder="Nama lengkap" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password (min 8)" required minLength={8} />
      <select name="role" defaultValue="TALENT">
        <option value="TALENT">Talent</option>
        <option value="HIRER">Hirer</option>
      </select>
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Loading..." : "Register"}
      </button>
    </form>
  );
}
```

**Steps:**
- [ ] **Step 1:** Tulis `app/(auth)/login/page.tsx`.
- [ ] **Step 2:** Tulis `app/(auth)/register/page.tsx`.
- [ ] **Step 3:** Commit `feat(auth): add login and register pages`.

---

## Task 11: Dashboard pages - role router, talent & hirer

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/dashboard/talent/page.tsx`
- Create: `app/dashboard/hirer/page.tsx`

**Interfaces:**
- Consumes: `modules/lib/auth.ts` (`getCurrentUser`), `next/navigation`.

`dashboard/page.tsx` (server component):

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "TALENT") redirect("/dashboard/talent");
  if (user.role === "HIRER") redirect("/dashboard/hirer");
  redirect("/login");
}
```

`dashboard/talent/page.tsx`:

```tsx
import { requireRole } from "@/modules/lib/auth";

export default async function TalentDashboardPage() {
  await requireRole("TALENT");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Talent Dashboard</h1>
      <p>Placeholder dashboard talent.</p>
    </div>
  );
}
```

`dashboard/hirer/page.tsx`:

```tsx
import { requireRole } from "@/modules/lib/auth";

export default async function HirerDashboardPage() {
  await requireRole("HIRER");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Hirer Dashboard</h1>
      <p>Placeholder dashboard hirer.</p>
    </div>
  );
}
```

**Steps:**
- [ ] **Step 1:** Tulis `app/dashboard/page.tsx`.
- [ ] **Step 2:** Tulis `app/dashboard/talent/page.tsx` dan `app/dashboard/hirer/page.tsx`.
- [ ] **Step 3:** Commit `feat: add role-based dashboard pages`.

---

## Task 12: Profile page - `app/profile/page.tsx`

**Files:**
- Create: `app/profile/page.tsx`

**Interfaces:**
- Consumes: `modules/profile/actions.ts`, `modules/lib/auth.ts`, `lib/supabase/server.ts`.

Isi: server component baca `getCurrentUser()` + fetch `profiles`/`profile_private`, render form update (client component inline via `useActionState`) + list skill/interest dengan form add/remove sederhana (form submit ke `addSkill`/`removeSkill` pakai field `skillId`). Untuk foundation, skill/interest pakai input id manual + tombol remove; interaksi master-data ditunda (spec #C).

```tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: privateData } = await supabase
    .from("profile_private")
    .select("phone")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <ProfileForm
        defaultFullName={profile?.full_name ?? ""}
        defaultPhone={privateData?.phone ?? ""}
        defaultBio={profile?.bio ?? ""}
        defaultLocation={profile?.location ?? ""}
      />
    </div>
  );
}
```

Buat juga `app/profile/profile-form.tsx` (client component) yang memanggil `updateProfile` via `useActionState`.

**Steps:**
- [ ] **Step 1:** Tulis `app/profile/profile-form.tsx`.
- [ ] **Step 2:** Tulis `app/profile/page.tsx`.
- [ ] **Step 3:** Commit `feat(profile): add profile page and form`.

---

## Task 13: Verification - build & typecheck

**Files:**
- (none)

**Steps:**
- [ ] **Step 1:** Run `npm run build`.
- [ ] **Step 2:** Pastikan TypeScript lulus tanpa error.
- [ ] **Step 3:** Fix semua error type/import bila ada.
- [ ] **Step 4:** Commit perbaikan (jika ada) `fix: resolve build issues`.

---

## Testing Note

Tidak ada test runner (vitest/jest) terpasang pada proyek ini. Verifikasi foundation ini menggunakan `npm run build` (typecheck) + `npm run dev` untuk smoke-test manual:
1. Register TALENT → landing `/login`.
2. Login TALENT → redirect `/dashboard` → `/dashboard/talent`.
3. Register HIRER → login → `/dashboard/hirer`.
4. Update profile → nilai tersimpan.
5. Logout → kembali ke `/login`.
6. Akses `/dashboard` tanpa login → redirect `/login`.

Test terotomasi (unit/integration) akan ditambahkan saat test runner diperkenalkan (task terpisah).
