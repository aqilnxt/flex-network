-- 002_indexes.sql
-- Flex Network indexes for common query patterns: ownership columns and
-- foreign-key lookups. btree default, idempotent via "if not exists".

-- Opportunity Module
create index if not exists opportunities_hirer_id_idx on public.opportunities (hirer_id);
create index if not exists opportunities_status_idx on public.opportunities (status);

-- Application Module
create index if not exists applications_talent_id_idx on public.applications (talent_id);
create index if not exists applications_opportunity_id_idx on public.applications (opportunity_id);
create index if not exists applications_status_idx on public.applications (status);

-- Meeting Module
create index if not exists meetings_application_id_idx on public.meetings (application_id);

-- Parental Consent Module
create index if not exists consents_application_id_idx on public.consents (application_id);
create index if not exists consents_talent_id_idx on public.consents (talent_id);

-- Contract Module
create index if not exists contracts_talent_id_idx on public.contracts (talent_id);
create index if not exists contracts_hirer_id_idx on public.contracts (hirer_id);
create index if not exists contracts_application_id_idx on public.contracts (application_id);

-- Payment Module
create index if not exists payments_contract_id_idx on public.payments (contract_id);

-- Work Module
create index if not exists works_contract_id_idx on public.works (contract_id);

-- Rating Module
create index if not exists ratings_work_id_idx on public.ratings (work_id);
create index if not exists ratings_ratee_id_idx on public.ratings (ratee_id);

-- Work History Module
create index if not exists work_history_talent_id_idx on public.work_history (talent_id);
create index if not exists work_history_contract_id_idx on public.work_history (contract_id);

-- Notification Module
create index if not exists notifications_user_id_is_read_idx on public.notifications (user_id, is_read);

-- Report Module
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);

-- Admin / Audit Module
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

-- Junction tables (lookup by non-lead side)
create index if not exists talent_skills_skill_id_idx on public.talent_skills (skill_id);
create index if not exists talent_interests_interest_id_idx on public.talent_interests (interest_id);
create index if not exists opportunity_skills_skill_id_idx on public.opportunity_skills (skill_id);
create index if not exists opportunity_interests_interest_id_idx on public.opportunity_interests (interest_id);
