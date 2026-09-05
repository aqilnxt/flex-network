# Portfolio Link + Profil Publik Talent — Design Spec

Tanggal: 2026-09-05
Status: Approved design (chat)
Klasifikasi: Bounded (brainstorming — extend flow existing; spec file diminta user untuk traceability)

## Konteks

`talent_profiles` punya kolom `portfolio_url`, `cv_url`, `school_name`, `grade_level` yang belum tersentuh UI sama sekali. Halaman `/profile` hanya mengelola form dasar (nama, phone, bio, location). Route `/profiles/[id]` hanya punya work-history — tidak ada halaman profil publik talent. Hirer tidak bisa menilai talent (portfolio, pendidikan, skill) sebelum rekrut.

## Keputusan

1. **Scope: link saja** — portfolio & CV sebagai input URL (no file upload, no storage). Kolom DB existing terpakai, zero migration, zero dependency.
2. **UI: extend profil existing** — section baru di `/profile` untuk TALENT, bukan halaman baru.
3. **Profil publik: ya** — halaman `/profiles/[id]` menampilkan portfolio + pendidikan + skill + verified work history. Ini nilai utama: hirer menilai talent sebelum rekrut.

## Desain

### 1. Extend `/profile` (TALENT only)

**page.tsx:**
- Load `talent_profiles` row (`.maybeSingle()` — row bisa tidak ada).
- Pass `defaultPortfolioUrl`, `defaultCvUrl`, `defaultSchoolName`, `defaultGradeLevel` + `role` ke form.

**profile-form.tsx:**
- Section baru "Portfolio & Pendidikan" (heading + 4 input), render hanya kalau `role === "TALENT"`.
- Field: Portfolio URL, CV URL (input url, optional), Nama Sekolah, Kelas/Jenjang (text, optional).
- Submit section terpisah → server action `updateTalentProfile` (form terpisah dari form dasar existing supaya dua aksi tidak bercampur).

**modules/profile/schemas.ts:**
```ts
export const talentProfileSchema = z.object({
  portfolioUrl: z.string().trim().url("URL portfolio tidak valid").max(255).optional().or(z.literal("")),
  cvUrl: z.string().trim().url("URL CV tidak valid").max(255).optional().or(z.literal("")),
  schoolName: z.string().trim().max(120).optional().or(z.literal("")),
  gradeLevel: z.string().trim().max(60).optional().or(z.literal("")),
});
```
String kosong dinormalisasi ke `null` di service sebelum upsert.

**modules/profile/actions.ts:**
- `updateTalentProfileAction(prevState, formData)` — pattern copy dari action profile existing: `requireRole("TALENT")`, safeParse, upsert, revalidatePath("/profile"), return ActionResult.

**Upsert:**
```ts
await supabase.from("talent_profiles").upsert({
  profile_id: userId,
  portfolio_url: norm(portfolioUrl),
  cv_url: norm(cvUrl),
  school_name: norm(schoolName),
  grade_level: norm(gradeLevel),
});
```
RLS talent_profiles: cek migration — policy own select/update harus ada; kalau tidak ada, tambah di migration kecil. (Verifikasi saat implement: `003_rls_policies.sql` + migration terkait profile.)

### 2. Halaman publik `/profiles/[id]/page.tsx` (create)

Server component:
- Query via fungsi baru `modules/profile/queries.ts`:
  `getPublicTalentProfile(profileId)` → profiles (full_name, bio, location, role), talent_profiles (school_name, grade_level, portfolio_url, cv_url), skills: `talent_skills(skill:skills(name))`, verified work history: `listVerifiedByTalentId` (existing).
- `notFound()` kalau profile tidak ada.
- Kalau role bukan TALENT → render minimal (nama + bio) tanpa section talent.
- Kalau TALENT: header (nama h1, bio p, lokasi), chip sekolah + kelas (badge class), link Portfolio + CV (anchor `target="_blank" rel="noopener noreferrer"`, style text-primary hover:underline, hanya render kalau ada), section Skills (badge per skill, `.badge` class), section Verified Work History (card list, VERIFIED badge pattern `#EAFBF1/#15803D`, title + duration), empty state per section (dashed tint-2 pattern dashboard-ui EmptyState).
- Auth: halaman butuh session (RLS profiles authenticated) — middleware existing pattern menangani redirect login untuk route yang butuh auth; kalau halaman ini diakses anon, query kembali null → notFound. Acceptable untuk MVP demo.

### 3. Files

- Modify: `app/profile/page.tsx`, `app/profile/profile-form.tsx`, `modules/profile/schemas.ts`, `modules/profile/actions.ts`, `modules/profile/queries.ts`
- Create: `app/profiles/[id]/page.tsx`
- Kemungkinan migration kecil: RLS upsert talent_profiles kalau policy belum ada (cek dulu).

## Testing

1. `npx tsc --noEmit` + `npm run build` clean.
2. E2E manual: login TALENT → `/profile` → isi link portfolio + sekolah → save → cek DB talent_profiles row; buka `/profiles/[id]` (login HIRER) → portfolio + sekolah + skill + work history tampil; zod menolak URL invalid; empty state (talent tanpa data).
3. Visual check profil publik vs DESIGN.md: card radius 16, badge pattern, blue link only, Inter.

## Out of Scope

- File upload (PDF/gambar) ke Storage — phase berikutnya kalau perlu.
- Avatar upload (avatar_url kolom exists, terpisah).
- Halaman profil publik HIRER (company profile).
- SEO/OG meta.
