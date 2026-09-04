-- 021_signature_storage_rls.sql
-- Storage policy: pihak kontrak boleh insert/select dokumen di bucket contracts-private.
-- Upload & signed URL dilakukan via server (service session); policy kasih akses
-- authenticated pada path contracts/<contract_id>/... untuk involved parties.
-- ponytail: storage RLS tak bisa join public.contracts dgn mudah (cross-schema
-- policy dilarang di beberapa versi) — pakai fungsi security definer.

create or replace function public.can_access_contract_doc(bucket text, obj text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contracts c
    where auth.uid() in (c.talent_id, c.hirer_id)
      and obj like 'contracts/' || c.id || '/%'
  )
$$;

drop policy if exists "contracts_private_insert_involved" on storage.objects;
create policy "contracts_private_insert_involved"
  on storage.objects for insert to authenticated
  with check (public.can_access_contract_doc(bucket_id, (storage.foldername(name))[1] || '/' || (storage.foldername(name))[2]));

drop policy if exists "contracts_private_select_involved" on storage.objects;
create policy "contracts_private_select_involved"
  on storage.objects for select to authenticated
  using (public.can_access_contract_doc(bucket_id, (storage.foldername(name))[1] || '/' || (storage.foldername(name))[2]));
