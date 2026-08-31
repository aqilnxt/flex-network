import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PaymentStatus = "PENDING" | "SIMULATED_PAID" | "RELEASED";

export type PaymentRow = {
  id: string;
  contract_id: string;
  amount: number | null;
  currency: string;
  status: PaymentStatus;
  held_at: string | null;
  released_at: string | null;
  held_by: string | null;
  released_by: string | null;
};

const PAYMENT_COLUMNS =
  "id, contract_id, amount, currency, status, held_at, released_at, held_by, released_by";

export async function getByContractId(
  contractId: string,
): Promise<PaymentRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("contract_id", contractId)
    .maybeSingle();
  return (data as unknown as PaymentRow) ?? null;
}

export async function listForContracts(
  contractIds: string[],
): Promise<Map<string, PaymentRow>> {
  const map = new Map<string, PaymentRow>();
  if (contractIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .in("contract_id", contractIds);

  for (const p of (data as unknown as PaymentRow[]) ?? []) {
    map.set(p.contract_id, p);
  }
  return map;
}
