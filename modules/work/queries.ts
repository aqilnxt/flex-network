import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type WorkRow = {
  id: string;
  contract_id: string;
  status: WorkStatus;
  started_at: string | null;
  completed_at: string | null;
  hirer_confirmed: boolean;
  hirer_confirmed_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
};

const WORK_COLUMNS =
  "id, contract_id, status, started_at, completed_at, hirer_confirmed, hirer_confirmed_at, confirmed_by, notes";

export async function getByContractId(
  contractId: string,
): Promise<WorkRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("works")
    .select(WORK_COLUMNS)
    .eq("contract_id", contractId)
    .maybeSingle();
  return (data as unknown as WorkRow) ?? null;
}

export async function listForContracts(
  contractIds: string[],
): Promise<Map<string, WorkRow>> {
  const map = new Map<string, WorkRow>();
  if (contractIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("works")
    .select(WORK_COLUMNS)
    .in("contract_id", contractIds);

  for (const w of (data as unknown as WorkRow[]) ?? []) {
    map.set(w.contract_id, w);
  }
  return map;
}
