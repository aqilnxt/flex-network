-- 020_digital_signature.sql
-- Digital signature: kolom dokumen + status PENDING_SIGNATURE + bucket storage

alter table public.contracts add column if not exists signature_mode text;
alter table public.contracts add column if not exists document_url text;
alter table public.contracts add column if not exists signed_document_url text;
alter table public.contracts add column if not exists signed_document_hash text;
alter table public.contracts add column if not exists signature_requested_at timestamptz;
alter table public.contracts add column if not exists talent_signed_at timestamptz;
alter table public.contracts add column if not exists hirer_signed_at timestamptz;
alter table public.contracts add column if not exists external_signature_id text;

-- status check: tambah PENDING_SIGNATURE
alter table public.contracts drop constraint contracts_status_check;
alter table public.contracts add constraint contracts_status_check
  check (status in ('DRAFT', 'PENDING_AGREEMENT', 'PENDING_SIGNATURE', 'ACTIVE', 'COMPLETED', 'TERMINATED'));

-- bucket private untuk dokumen kontrak
insert into storage.buckets (id, name, public)
values ('contracts-private', 'contracts-private', false)
on conflict (id) do nothing;
