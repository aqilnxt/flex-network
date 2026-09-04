import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContractStatus =
  | "DRAFT"
  | "PENDING_AGREEMENT"
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "COMPLETED"
  | "TERMINATED";

export type ContractRow = {
  id: string;
  application_id: string;
  opportunity_id: string;
  talent_id: string;
  hirer_id: string;
  contract_number: string | null;
  role_title: string | null;
  description: string | null;
  responsibilities: string | null;
  duration: string | null;
  location: string | null;
  compensation: number | null;
  terms_conditions: string | null;
  status: ContractStatus;
  proposed_at: string | null;
  talent_agreed: boolean;
  hirer_agreed: boolean;
  talent_agreed_at: string | null;
  hirer_agreed_at: string | null;
  activated_at: string | null;
  terminated_at: string | null;
  decline_reason: string | null;
  signature_mode: string | null;
  document_url: string | null;
  signed_document_url: string | null;
  signed_document_hash: string | null;
  signature_requested_at: string | null;
  talent_signed_at: string | null;
  hirer_signed_at: string | null;
};

export type ContractDetail = ContractRow & {
  opportunity_title: string | null;
  talent_name: string | null;
  hirer_name: string | null;
};

const CONTRACT_COLUMNS =
  "id, application_id, opportunity_id, talent_id, hirer_id, contract_number, role_title, description, responsibilities, duration, location, compensation, terms_conditions, status, proposed_at, talent_agreed, hirer_agreed, talent_agreed_at, hirer_agreed_at, activated_at, terminated_at, decline_reason, signature_mode, document_url, signed_document_url, signed_document_hash, signature_requested_at, talent_signed_at, hirer_signed_at";

export async function getById(
  contractId: string,
): Promise<ContractDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      `${CONTRACT_COLUMNS}, opportunity:opportunities(title), talent:talent_id(full_name), hirer:hirer_id(full_name)`,
    )
    .eq("id", contractId)
    .maybeSingle();

  const row = data as unknown as
    | (ContractRow & {
        opportunity: { title: string } | null;
        talent: { full_name: string | null } | null;
        hirer: { full_name: string | null } | null;
      })
    | null;
  if (!row) return null;
  return {
    ...row,
    opportunity_title: row.opportunity?.title ?? null,
    talent_name: row.talent?.full_name ?? null,
    hirer_name: row.hirer?.full_name ?? null,
  };
}

export async function getByApplicationId(
  applicationId: string,
): Promise<ContractRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("application_id", applicationId)
    .maybeSingle();
  return (data as unknown as ContractRow) ?? null;
}

export async function listForTalent(
  talentId: string,
): Promise<ContractRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });
  return (data as unknown as ContractRow[]) ?? [];
}

export async function listForHirer(
  hirerId: string,
): Promise<ContractRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("hirer_id", hirerId)
    .order("created_at", { ascending: false });
  return (data as unknown as ContractRow[]) ?? [];
}

export async function listForApplications(
  applicationIds: string[],
): Promise<Map<string, ContractRow>> {
  const map = new Map<string, ContractRow>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .in("application_id", applicationIds);

  for (const c of (data as unknown as ContractRow[]) ?? []) {
    map.set(c.application_id, c);
  }
  return map;
}
