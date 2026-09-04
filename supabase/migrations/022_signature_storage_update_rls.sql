-- 022_signature_storage_update_rls.sql
-- Upsert upload butuh policy UPDATE (insert dengan upsert menjalankan update path).
-- ponytail: kalau upsert dilepas dari storage.ts, policy ini bisa dihapus lagi.

drop policy if exists "contracts_private_update_involved" on storage.objects;
create policy "contracts_private_update_involved"
  on storage.objects for update to authenticated
  using (public.can_access_contract_doc(bucket_id, (storage.foldername(name))[1] || '/' || (storage.foldername(name))[2]))
  with check (public.can_access_contract_doc(bucket_id, (storage.foldername(name))[1] || '/' || (storage.foldername(name))[2]));
