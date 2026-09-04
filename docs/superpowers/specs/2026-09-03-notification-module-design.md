# Spec: Notification Module

## Purpose
Provide a centralized system for in-app notifications to keep users (Talent, Hirer, Admin) informed about relevant events in the Flex Network ecosystem.

## Scope
In-app notifications for:
- **Application**: applied (to Hirer), selected (to Talent), rejected (to Talent).
- **Meeting**: scheduled, completed, cancelled (to both involved parties).
- **Consent**: requested (to Talent), approved (to Hirer), rejected (to Hirer).
- **Contract**: created, proposed, agreed, declined, active.
- **Payment**: simulated paid, released.
- **Work**: started, completed, confirmed.
- **Rating**: received.

## Design Decisions
1. **Architecture**: Modular Monolith side effects. Domain services call a shared `notificationService.notify()` function.
2. **Database**: 
   - Table `notifications` exists but needs enhancements.
   - Column `actor_id` added to track who triggered the event.
   - Column `metadata` (JSONB) for flexible data (e.g., target ID, specific event flags).
   - Column `is_read` renamed to `read_at` (timestamptz) for better audit.
3. **Privacy**: Store actor name snapshot in `message` to avoid heavy joins and handle profile changes.
4. **Real-time**: Frontend uses Supabase Realtime to subscribe to the `notifications` table for the current user's ID.

## Data Schema (Enhanced)
Table: `notifications`
- `id` (uuid, pk)
- `user_id` (uuid, references profiles, recipient)
- `actor_id` (uuid, references profiles, nullable)
- `type` (text, category)
- `title` (text)
- `message` (text)
- `link` (text, e.g., "/contracts/uuid")
- `metadata` (jsonb, optional)
- `read_at` (timestamptz, nullable)
- `created_at` (timestamptz)

## RLS Policies
- `SELECT`: `auth.uid() = user_id`.
- `UPDATE`: `auth.uid() = user_id` (only for `read_at`).
- `INSERT`: Server-side only (service role) or strictly controlled.

## UI Requirements
- **Navbar Badge**: Shows unread count. Updates via Supabase Realtime.
- **Notification Page (`/notifications`)**: List of all notifications, ordered by `created_at` DESC.
- **Mark as Read**: Action to set `read_at` for specific or all notifications.

## Integration Points
Services to be modified:
- `modules/application/service.ts`
- `modules/meeting/service.ts`
- `modules/consent/service.ts`
- `modules/contract/service.ts`
- `modules/payment/service.ts`
- `modules/work/service.ts`
- `modules/rating/service.ts`

## Verification
- Trigger event -> Notification row created in DB with correct `user_id`.
- Recipient logs in -> Navbar badge shows count.
- Recipient clicks notification -> Redirects to correct `link`, notification marked as read.
