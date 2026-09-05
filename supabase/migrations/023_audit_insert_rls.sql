-- 023_audit_insert_rls.sql
-- Audit append-only: semua user terauthentikasi boleh insert event audit.
-- Tanpa policy update/delete (append-only), SELECT tetap admin-only.

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated"
  on public.audit_logs for insert to authenticated
  with check (true);
