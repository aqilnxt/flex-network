# Matching Module Design

## Goal

Membangun modul Matching — rekomendasi opportunity untuk TALENT berdasarkan weighted skill & interest matching (rule-based, deterministic, server-side). Tanpa AI/ML, hanya decision support (tidak hiring otomatis).

## Decisions (locked)

- **Read-only** — query/service server-side dipanggil dari Server Component, bukan REST / Server Action (API-SPEC 20.5 + decision log "Server Actions dulu; REST ditunda").
- **Halaman rekomendasi khusus** `/matching/recommendations` (TALENT): title + final score + classification. Browse-card integration ditunda.
- **Filter keluar** opportunity yang sudah di-apply (dan non-`PUBLISHED` otomatis).
- **Migration `008`** menambahkan policy owner-scoped untuk `talent_skills`/`talent_interests` (membutuhkan read + memperbaiki latent bug CRUD profile).

## Architecture

UI (Server Component) → Matching Query/Service → Supabase (server client, RLS aktif).

Matching read-only, konsisten `modules/opportunity/queries.ts` (`listPublished`). Tidak ada mutation, tidak ada Server Action, tidak ada REST.

## Module Structure

```
modules/matching/
├── service.ts   → pure scoring deterministik (tanpa supabase)
└── queries.ts   → getRecommendations(talentId, { page, limit })
```

Tanpa `schemas.ts` (tidak ada input mutation; pagination cukup param `page`/`limit`).

## Types

```ts
export type MatchClassification =
  | "STRONG_MATCH"
  | "GOOD_MATCH"
  | "WEAK_MATCH"
  | "NO_MATCH";

export type MatchResult = {
  skillMatchScore: number;
  interestMatchScore: number;
  finalMatchScore: number;
  matchedSkills: string[];
  matchedInterests: string[];
  classification: MatchClassification;
};

export type Recommendation = {
  opportunity: {
    id: string;
    title: string;
    work_mode: string | null;
    location: string | null;
    compensation: number | null;
    compensation_type: string | null;
  };
} & MatchResult;
```

## Formula (deterministic)

- `skillMatchScore = required === 0 ? 100 : (matched / required) * 100`
- `interestMatchScore = relevant === 0 ? 100 : (matched / relevant) * 100`
- `finalMatchScore = round2((skillMatchScore * 0.70) + (interestMatchScore * 0.30))`
- Edutant: `required skills = 0 → 100`; `relevant interests = 0 → 100`
- Classification:
  - `>= 80` → `STRONG_MATCH`
  - `>= 60` → `GOOD_MATCH`
  - `>= 30` → `WEAK_MATCH`
  - else `NO_MATCH`

## Service — `service.ts` (pure, tanpa supabase)

- `skillMatchScore(matched: number, required: number): number`
- `interestMatchScore(matched: number, relevant: number): number`
- `finalMatchScore(skillScore: number, interestScore: number): number`
- `classifyMatchScore(score: number): MatchClassification`
- `scoreOpportunity(talentSkillIds, talentInterestIds, oppSkillIds, oppInterestIds): MatchResult`

`matchedSkills`/`matchedInterests` berisi id (atau name) yang cocok — dihitung via set intersection.

## Queries — `queries.ts`

`getRecommendations(talentId, { page = 1, limit = 12 })`:

1. Fetch `talent_skills` + `talent_interests` (id talent) → set skill/interest.
2. Fetch opportunity `status = PUBLISHED`.
3. Fetch `applications` milik talent → set `opportunity_id` yang sudah di-apply.
4. Bulk fetch `opportunity_skills` + `opportunity_interests` untuk semua PUBLISHED (join `skills(name)`/`interests(name)`).
5. Filter keluar yang sudah di-apply; skor semua; sort `finalMatchScore` desc; paginate in-memory.
6. Return `{ items, total, page, limit }`.

> Performa: skor dihitung app-layer, sort-by-score mewajibkan scoring seluruh candidate PUBLISHED lalu paginate di memori. Bounded untuk MVP (jumlah PUBLISHED kecil). Optimasi DB-function/DB-pagination jadi task lanjutan bila workload naik (TDD 8.12).

## RLS — `008_talent_skills_interests_rls.sql`

Menambahkan policy owner-scoped untuk `talent_skills` & `talent_interests` (melengkapi `TBD` di `003`; dipakai matching untuk baca + memperbaiki latent bug CRUD profile):

```sql
-- select: talent baca miliknya sendiri (dipakai matching)
create policy "talent_skills_select_own"
  on public.talent_skills for select to authenticated
  using (auth.uid() = profile_id);

create policy "talent_interests_select_own"
  on public.talent_interests for select to authenticated
  using (auth.uid() = profile_id);

-- insert/update/delete owner-scoped (perbaiki CRUD profile)
create policy "talent_skills_insert_own"
  on public.talent_skills for insert to authenticated
  with check (auth.uid() = profile_id);
create policy "talent_skills_delete_own"
  on public.talent_skills for delete to authenticated
  using (auth.uid() = profile_id);
-- (analog untuk talent_interests)
```

## Page

- `app/matching/recommendations/page.tsx` — `requireRole("TALENT")` → `getRecommendations(user.id, searchParams)` → render list (card: title, work_mode, lokasi, compensation, final match score progress/badge, classification color-coded). Link ke `/opportunities/:id`.

## Security & Rules

- `requireRole("TALENT")` di halaman; data skill/interest talent diambil dari DB (bukan dari client).
- Skor/classification 100% server-side; client tidak bisa override.
- Rule-based, deterministik, tanpa AI/ML (AGENTS.md "dilarang pakai AI/ML").
- Tidak ada side-effect (read-only; tidak mengubah application/contract/hiring).

## Out of Scope

- Single-opportunity match score (API-SPEC 8.2) — defer.
- Match score di browse card & detail — defer (UI polish).
- Notifikasi/audit — n/a (read-only).

## Acceptance Criteria

1. TALENT lihat `/matching/recommendations` menampilkan opportunity `PUBLISHED` (yang belum di-apply), terurut descending final score.
2. Edge case required-skill kosong → skill score 100; relevant-interest kosong → interest score 100.
3. Classification benar sesuai threshold (STRONG/GOOD/WEAK/NO_MATCH).
4. Deterministik (input sama → hasil sama).
5. `npm run build` lulus tanpa error TypeScript.
