-- 009_table_grants.sql
-- Grant table/schema/sequence privileges for the app roles. Migrations created
-- tables without granting SELECT/INSERT/UPDATE/DELETE to anon/authenticated/
-- service_role, which caused "permission denied" on every data query (RLS is
-- the access control; the roles still need base table privileges).

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
