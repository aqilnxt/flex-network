# Matching Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul Matching — rekomendasi opportunity untuk TALENT berdasarkan weighted skill & interest matching (rule-based, deterministic, server-side, read-only).

**Architecture:** Server Component → Matching Query/Service → Supabase (server client, RLS aktif). Service = pure scoring (tanpa supabase); query = data fetch + orchestration + in-memory sort/paginate. Tanpa Server Action, tanpa REST.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript strict, Supabase SSR, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-28-matching-module-design.md`

## Global Constraints

- **Read-only** — tidak ada Server Action, tidak ada REST route; query/service dipanggil dari Server Component.
- **Tanpa AI/ML** — murni rule-based; deterministik (input sama → hasil sama).
- **Server-side 100%** — skor/classification dihitung server, client tidak bisa override.
- Formula:
  - `skillMatchScore = required===0 ? 100 : (matched/required)*100`
  - `interestMatchScore = relevant===0 ? 100 : (matched/relevant)*100`
  - `finalMatchScore = round2(skill*0.70 + interest*0.30)`
- Classification: `>=80 STRONG_MATCH`, `>=60 GOOD_MATCH`, `>=30 WEAK_MATCH`, else `NO_MATCH`.
- **Filter keluar** opportunity yang sudah di-apply + non-`PUBLISHED`.
- `requireRole("TALENT")` di halaman; data skill/interest talent dari DB.
- Impor alias `@/*` → root.
- No test runner terpasang; verifikasi = `npm run build` + `npm run dev` manual.

## File Structure

| File | Tanggung jawab |
|------|----------------|
| `supabase/migrations/008_talent_skills_interests_rls.sql` | policy owner-scoped talent_skills/talent_interests |
| `modules/matching/service.ts` | pure scoring + types (deterministik) |
| `modules/matching/queries.ts` | `getRecommendations` (fetch + skor + sort + paginate) |
| `app/matching/recommendations/page.tsx` | halaman rekomendasi TALENT |

---

## Task 1: Migration `008_talent_skills_interests_rls.sql`

**Files:**
- Create: `supabase/migrations/008_talent_skills_interests_rls.sql`

**Interfaces:**
- Produces: policy select/insert/update/delete owner-scoped untuk `talent_skills` & `talent_interests`. Dipakai `queries.ts` (baca) dan memperbaiki latent bug CRUD profile (upsert/delete).

**Isi:**

```sql
-- 008_talent_skills_interests_rls.sql
-- Owner-scoped policies untuk talent_skills & talent_interests
-- (melengkapi TBD di 003; dipakai Matching untuk baca + memperbaiki CRUD Profile).

-- talent_skills
create policy "talent_skills_select_own"
  on public.talent_skills for select to authenticated
  using (auth.uid() = profile_id);

create policy "talent_skills_insert_own"
  on public.talent_skills for insert to authenticated
  with check (auth.uid() = profile_id);

create policy "talent_skills_update_own"
  on public.talent_skills for update to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "talent_skills_delete_own"
  on public.talent_skills for delete to authenticated
  using (auth.uid() = profile_id);

-- talent_interests
create policy "talent_interests_select_own"
  on public.talent_interests for select to authenticated
  using (auth.uid() = profile_id);

create policy "talent_interests_insert_own"
  on public.talent_interests for insert to authenticated
  with check (auth.uid() = profile_id);

create policy "talent_interests_update_own"
  on public.talent_interests for update to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "talent_interests_delete_own"
  on public.talent_interests for delete to authenticated
  using (auth.uid() = profile_id);
```

**Steps:**
- [ ] **Step 1:** Tulis `supabase/migrations/008_talent_skills_interests_rls.sql` (isi di atas).
- [ ] **Step 2:** Push `supabase db push`.
- [ ] **Step 3:** Commit `feat(db): add talent skills and interests RLS policies`.

---

## Task 2: Service — `modules/matching/service.ts`

**Files:**
- Create: `modules/matching/service.ts`

**Interfaces:**
- Consumes: (nothing — pure functions).
- Produces: `MatchClassification`, `MatchResult` types; `skillMatchScore`, `interestMatchScore`, `finalMatchScore`, `classifyMatchScore`, `scoreOpportunity`, `round2`. Dipakai `queries.ts` (Task 3) dan `page.tsx` (Task 4 via type `MatchClassification`).

**Isi:**

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

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function skillMatchScore(matched: number, required: number): number {
  if (required <= 0) return 100;
  return (matched / required) * 100;
}

export function interestMatchScore(matched: number, relevant: number): number {
  if (relevant <= 0) return 100;
  return (matched / relevant) * 100;
}

export function finalMatchScore(
  skillScore: number,
  interestScore: number,
): number {
  return round2(skillScore * 0.7 + interestScore * 0.3);
}

export function classifyMatchScore(score: number): MatchClassification {
  if (score >= 80) return "STRONG_MATCH";
  if (score >= 60) return "GOOD_MATCH";
  if (score >= 30) return "WEAK_MATCH";
  return "NO_MATCH";
}

export function scoreOpportunity(
  talentSkillIds: string[],
  talentInterestIds: string[],
  oppSkillIds: string[],
  oppInterestIds: string[],
): MatchResult {
  const talentSkills = new Set(talentSkillIds);
  const talentInterests = new Set(talentInterestIds);

  const matchedSkills = oppSkillIds.filter((s) => talentSkills.has(s));
  const matchedInterests = oppInterestIds.filter((i) => talentInterests.has(i));

  const skillScore = skillMatchScore(matchedSkills.length, oppSkillIds.length);
  const interestScore = interestMatchScore(
    matchedInterests.length,
    oppInterestIds.length,
  );
  const score = finalMatchScore(skillScore, interestScore);

  return {
    skillMatchScore: round2(skillScore),
    interestMatchScore: round2(interestScore),
    finalMatchScore: score,
    matchedSkills,
    matchedInterests,
    classification: classifyMatchScore(score),
  };
}

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

**Steps:**
- [ ] **Step 1:** Tulis `modules/matching/service.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(matching): add deterministic scoring service`.

---

## Task 3: Queries — `modules/matching/queries.ts`

**Files:**
- Create: `modules/matching/queries.ts`

**Interfaces:**
- Consumes: `lib/supabase/server.ts` (`createSupabaseServerClient`), `modules/matching/service.ts` (`scoreOpportunity`, `Recommendation`).
- Produces: `getRecommendations(talentId, { page, limit }) => Promise<RecommendationsResult>`.

**Isi:**

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { scoreOpportunity, type Recommendation } from "./service";

export type RecommendationsResult = {
  items: Recommendation[];
  total: number;
  page: number;
  limit: number;
};

export async function getRecommendations(
  talentId: string,
  { page = 1, limit = 12 }: { page?: number; limit?: number } = {},
): Promise<RecommendationsResult> {
  const supabase = await createSupabaseServerClient();

  const { data: talentSkills } = await supabase
    .from("talent_skills")
    .select("skill_id")
    .eq("profile_id", talentId);
  const { data: talentInterests } = await supabase
    .from("talent_interests")
    .select("interest_id")
    .eq("profile_id", talentId);

  const talentSkillIds = (talentSkills ?? []).map((r) => r.skill_id);
  const talentInterestIds = (talentInterests ?? []).map((r) => r.interest_id);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, work_mode, location, compensation, compensation_type")
    .eq("status", "PUBLISHED");

  if (!opportunities || opportunities.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  const oppIds = opportunities.map((o) => o.id);

  const { data: applications } = await supabase
    .from("applications")
    .select("opportunity_id")
    .eq("talent_id", talentId)
    .in("opportunity_id", oppIds);
  const appliedIds = new Set(
    (applications ?? []).map((a) => a.opportunity_id),
  );

  const { data: oppSkills } = await supabase
    .from("opportunity_skills")
    .select("opportunity_id, skill_id")
    .in("opportunity_id", oppIds);
  const { data: oppInterests } = await supabase
    .from("opportunity_interests")
    .select("opportunity_id, interest_id")
    .in("opportunity_id", oppIds);

  const skillsByOpp = new Map<string, string[]>();
  for (const s of oppSkills ?? []) {
    const arr = skillsByOpp.get(s.opportunity_id) ?? [];
    arr.push(s.skill_id);
    skillsByOpp.set(s.opportunity_id, arr);
  }

  const interestsByOpp = new Map<string, string[]>();
  for (const i of oppInterests ?? []) {
    const arr = interestsByOpp.get(i.opportunity_id) ?? [];
    arr.push(i.interest_id);
    interestsByOpp.set(i.opportunity_id, arr);
  }

  const scored = opportunities
    .filter((o) => !appliedIds.has(o.id))
    .map((o) => {
      const result = scoreOpportunity(
        talentSkillIds,
        talentInterestIds,
        skillsByOpp.get(o.id) ?? [],
        interestsByOpp.get(o.id) ?? [],
      );
      return { opportunity: o, ...result };
    })
    .sort((a, b) => b.finalMatchScore - a.finalMatchScore);

  const total = scored.length;
  const offset = (page - 1) * limit;
  const items = scored.slice(offset, offset + limit);

  return { items, total, page, limit };
}
```

**Steps:**
- [ ] **Step 1:** Tulis `modules/matching/queries.ts` (isi di atas).
- [ ] **Step 2:** Commit `feat(matching): add recommendations query`.

---

## Task 4: Recommendations page — `app/matching/recommendations/page.tsx`

**Files:**
- Create: `app/matching/recommendations/page.tsx`

**Interfaces:**
- Consumes: `modules/lib/auth.ts` (`requireRole`), `modules/matching/queries.ts` (`getRecommendations`), `modules/matching/service.ts` (`MatchClassification`).

**Isi:**

```tsx
import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { getRecommendations } from "@/modules/matching/queries";
import type { MatchClassification } from "@/modules/matching/service";

function classificationBadge(c: MatchClassification) {
  switch (c) {
    case "STRONG_MATCH":
      return "bg-green-100 text-green-700";
    case "GOOD_MATCH":
      return "bg-blue-100 text-blue-700";
    case "WEAK_MATCH":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("TALENT");
  const params = await searchParams;

  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = 12;

  const { items, total } = await getRecommendations(user.id, { page, limit });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Rekomendasi Untuk Kamu</h1>

      {items.length === 0 && (
        <p className="text-gray-500">Belum ada rekomendasi.</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((r) => (
          <Link
            key={r.opportunity.id}
            href={`/opportunities/${r.opportunity.id}`}
            className="border rounded p-4 hover:shadow"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{r.opportunity.title}</h2>
              <span
                className={`text-xs rounded px-2 py-1 ${classificationBadge(r.classification)}`}
              >
                {r.classification.replace("_MATCH", "")}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {r.opportunity.work_mode ?? "-"} · {r.opportunity.location ?? "-"}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${r.finalMatchScore}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {r.finalMatchScore.toFixed(2)}%
              </span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-6">
          {page > 1 && (
            <Link
              href={`/matching/recommendations?page=${page - 1}`}
              className="text-blue-600"
            >
              ← Sebelumnya
            </Link>
          )}
          <span className="text-sm text-gray-600">
            Halaman {page} dari {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/matching/recommendations?page=${page + 1}`}
              className="text-blue-600"
            >
              Berikutnya →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

**Steps:**
- [ ] **Step 1:** Tulis `app/matching/recommendations/page.tsx` (isi di atas).
- [ ] **Step 2:** Commit `feat(matching): add recommendations page`.

---

## Task 5: Verification — build & typecheck

**Files:**
- (none)

**Steps:**
- [ ] **Step 1:** Run `npm run build`.
- [ ] **Step 2:** Pastikan TypeScript lulus tanpa error.
- [ ] **Step 3:** Fix semua error type/import bila ada.
- [ ] **Step 4:** Commit perbaikan `fix: resolve build issues` (jika ada).

---

## Testing Note

Tidak ada test runner terpasang. Verifikasi via `npm run build` + `npm run dev` manual:

1. Login TALENT → buka `/matching/recommendations` → lihat opportunity PUBLISHED terurut descending score.
2. Opportunity yang sudah di-apply TIDAK muncul.
3. UI menampilkan classification & score 2 desimal dengan benar.
4. Edge case: opportunity tanpa required skills → skill score 100 (final score = 70 + interest*0.30); tanpa relevant interests → interest score 100.
5. Deterministik — refresh halaman tidak mengubah skor.
6. `npm run build` lulus.

> Catatan: fungsi `scoreOpportunity` bersifat pure/deterministik — kandidat ideal untuk unit test saat test runner diperkenalkan (task terpisah). Untuk sprint ini verifikasi manual via UI.
