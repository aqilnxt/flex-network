# Notification Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement centralized in-app notification system.

**Architecture:** Domain services call shared `notificationService.notify()`, data persisted in `notifications` table, real-time UI.

**Tech Stack:** Next.js (App Router), Supabase (RLS, Realtime), Tailwind.

**Spec:** `docs/superpowers/specs/2026-09-03-notification-module-design.md`

## Global Constraints
- Public view shows ONLY VERIFIED work history (Wait, this is previous task).
- Notification: `actor_id` included, `metadata` supported, `read_at` audit trail.
- Side-effect based notification (no event bus complexity for now).

---

### Task 1: Database Migration
**Files:** Create `supabase/migrations/018_notification_enhancements.sql`

- [ ] **Step 1: Write migration**
```sql
ALTER TABLE public.notifications ADD COLUMN actor_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.notifications ADD COLUMN metadata jsonb;
ALTER TABLE public.notifications RENAME COLUMN is_read TO read_at;
ALTER TABLE public.notifications ALTER COLUMN read_at TYPE timestamptz USING (CASE WHEN read_at THEN now() ELSE NULL END);
ALTER TABLE public.notifications ALTER COLUMN read_at DROP DEFAULT;
-- Fix RLS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
```

- [ ] **Step 2: Push & Verify**
`supabase db push --linked --yes`

### Task 2: Notification Service & Queries
**Files:** 
- Create: `modules/notification/service.ts`
- Create: `modules/notification/queries.ts`

- [ ] **Step 1: Implement Service**
```typescript
export async function notify(params: NotifyParams) {
  const supabase = await createSupabaseServerClient();
  await supabase.from('notifications').insert(params);
}
```

- [ ] **Step 2: Implement Queries**
`listNotifications(userId)` and `getUnreadCount(userId)`.

### Task 3: UI Integration
**Files:** 
- Create: `components/notification/notification-badge.tsx`
- Create: `app/notifications/page.tsx`

- [ ] **Step 1: Badge component** (Realtime subscription `.on('postgres_changes', ...)`).
- [ ] **Step 2: Notification Page** (List + Mark Read server actions).

### Task 4: Service Side Effects
**Files:**
- Modify `modules/application/service.ts`, etc.
- Call `notify()` after successful mutations.

---

Plan complete. Two execution options:

1. **Subagent-Driven** (recommended) - Fresh subagent per task, review between tasks.
2. **Inline Execution** - Batch execution with checkpoints.

Which approach?
