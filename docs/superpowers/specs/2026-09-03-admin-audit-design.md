# Spec: Admin & Audit Module

## Purpose
Enable operational oversight of the platform through an Admin Dashboard, User Management, Report Moderation, and Action Auditing.

## Scope
1. **Admin Dashboard**: Central hub with key metrics (Users, Opportunities, Apps, Contracts, Reports).
2. **User Management**: Admin control over user status (ACTIVE/SUSPENDED).
3. **Report Moderation**: Users submit reports (target opportunity/user/app); Admins moderate (RESOLVED/REJECTED).
4. **Action Auditing**: Centralized audit logging for administrative actions.

## Design Decisions
1. **Audit Helper (`logAudit`)**: Global service-layer helper to capture every sensitive admin action. Non-blocking (async best-effort).
2. **Admin Dashboard**: Aggregated views using `getCount` style queries; real-time not required (SSG/ISR not needed, dynamic Server Components fine).
3. **Reports**: Admin-moderated, linked via `target_*_id` foreign keys in `reports` table.
4. **User Status**: Controlled via `profiles.status` column.

## Database Changes
- **Migration**: `019_admin_audit_rls.sql`.
- **RLS**:
  - `reports`: SELECT (reporter, ADMIN), INSERT (authenticated), UPDATE (ADMIN).
  - `audit_logs`: SELECT (ADMIN), INSERT (system-role).
  - `profiles` (update): ADMIN only.

## Components
- `modules/admin/service.ts`: Dashboard data & user actions.
- `modules/report/service.ts`: Report CRUD + Admin resolution.
- `modules/audit/service.ts`: `logAudit` helper.
- UI Pages: `/admin`, `/admin/users`, `/admin/reports`, `/admin/audit`.
- `components/report/report-form.tsx`: User input for reporting.

## Verification
- Admin sees audit log when moderate opportunities/suspend users/resolve reports.
- User status update reflects immediately (access control).
- Reports transition status (SUBMITTED -> RESOLVED).
