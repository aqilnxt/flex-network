import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RatingType = "TALENT_RATES_HIRER" | "HIRER_RATES_TALENT";

export type RatingRow = {
  id: string;
  work_id: string;
  contract_id: string;
  rater_id: string;
  ratee_id: string;
  rating_type: RatingType;
  score: number;
  review_text: string | null;
  created_at: string;
};

const RATING_COLUMNS =
  "id, work_id, contract_id, rater_id, ratee_id, rating_type, score, review_text, created_at";

export async function listByContractId(
  contractId: string,
): Promise<RatingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ratings")
    .select(RATING_COLUMNS)
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });
  return (data as unknown as RatingRow[]) ?? [];
}

export async function listForContracts(
  contractIds: string[],
): Promise<Map<string, RatingRow[]>> {
  const map = new Map<string, RatingRow[]>();
  if (contractIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ratings")
    .select(RATING_COLUMNS)
    .in("contract_id", contractIds);

  for (const r of (data as unknown as RatingRow[]) ?? []) {
    const list = map.get(r.contract_id) ?? [];
    list.push(r);
    map.set(r.contract_id, list);
  }
  return map;
}
