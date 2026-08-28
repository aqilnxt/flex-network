-- 004_updated_at_triggers.sql
-- Flex Network auto-update of updated_at on row update via set_updated_at()
-- (defined in 001_initial_schema.sql).

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profile_private_updated_at
  before update on public.profile_private
  for each row execute function public.set_updated_at();

create trigger talent_profiles_updated_at
  before update on public.talent_profiles
  for each row execute function public.set_updated_at();

create trigger hirer_profiles_updated_at
  before update on public.hirer_profiles
  for each row execute function public.set_updated_at();

create trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create trigger meetings_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();

create trigger consents_updated_at
  before update on public.consents
  for each row execute function public.set_updated_at();

create trigger contracts_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger works_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

create trigger work_history_updated_at
  before update on public.work_history
  for each row execute function public.set_updated_at();

create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();
