# Work History Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement private Work History dashboard and public Verified Work History profiles.

**Architecture:** Add RLS policies for anonymous access, implement server-side queries for privacy-compliant data retrieval, and add page routes.

**Tech Stack:** Next.js (App Router), Supabase (RLS), Tailwind, Zod.

**Spec:** `docs/superpowers/specs/2026-09-03-workhistory-page-design.md`

## Global Constraints
- Public view shows ONLY VERIFIED work history.
- Public view HIDES hirer info.
- Private view requires TALENT auth.

---

### Task 1: RLS Policy

**Files:**
- Modify: `supabase/migrations/016_work_history_rls.sql` (or create new: `017_work_history_public.sql`)

**Interfaces:**
- N/A

- [ ] **Step 1: Write SQL for public policy**

```sql
CREATE POLICY "Public VERIFIED work history" ON work_history
FOR SELECT TO anon, authenticated
USING (status = 'VERIFIED');
```

- [ ] **Step 2: Run migration**
`supabase db push`

- [ ] **Step 3: Commit**
`git add supabase/migrations/... && git commit -m "feat(rls): add public select policy for verified work history"`

### Task 2: Queries

**Files:**
- Modify: `modules/work_history/queries.ts`

**Interfaces:**
- Produces: `listVerifiedByTalentId(talentId: string)`

- [ ] **Step 1: Implement `listVerifiedByTalentId`**

```typescript
export async function listVerifiedByTalentId(talentId: string) {
  const { data } = await supabase
    .from('work_history')
    .select('id, title, compensation, started_at, ended_at, status, verified_at')
    .eq('talent_id', talentId)
    .eq('status', 'VERIFIED');
  return data;
}
```

- [ ] **Step 2: Commit**
`git add modules/work_history/queries.ts && git commit -m "feat(queries): add public verified query"`

### Task 3: Public Page

**Files:**
- Create: `app/profiles/[id]/work-history/page.tsx`

**Interfaces:**
- Consumes: `modules/work_history/queries.ts:listVerifiedByTalentId`

- [ ] **Step 1: Implement page**
  - Fetch params.id
  - Call query
  - Render list

- [ ] **Step 2: Commit**
`git add app/profiles/[id]/work-history/page.tsx && git commit -m "feat(ui): add public work history page"`

### Task 4: Private Page

**Files:**
- Create: `app/work-history/page.tsx`

**Interfaces:**
- Consumes: `modules/work_history/queries.ts:listByTalentId`

- [ ] **Step 1: Implement page**
  - Auth check (Talent)
  - Call query
  - Render all records (including PENDING)

- [ ] **Step 2: Commit**
`git add app/work-history/page.tsx && git commit -m "feat(ui): add private work history dashboard"`

---

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks.
2. **Inline Execution** - Batch execution with checkpoints.

Which approach?
