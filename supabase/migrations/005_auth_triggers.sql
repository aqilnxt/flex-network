-- 005_auth_triggers.sql
-- Flex Network: auto-create profiles + talent/hirer profile when a new
-- auth.users row is inserted. role & full_name come from raw_user_meta_data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_full_name text;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'TALENT');
  if v_role not in ('TALENT', 'HIRER') then
    v_role := 'TALENT';
  end if;
  v_full_name := new.raw_user_meta_data ->> 'full_name';

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, v_full_name)
  on conflict (id) do nothing;

  if v_role = 'TALENT' then
    insert into public.talent_profiles (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  elsif v_role = 'HIRER' then
    insert into public.hirer_profiles (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
