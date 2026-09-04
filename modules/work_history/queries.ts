import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkHistoryRow = {
  id: string;
  title: string | null;
  duration: string | null;
  compensation: number | null;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  verified_at: string | null;
};

const WORK_HISTORY_COLUMNS =
  "id, title, duration, compensation, verification_status, verified_at";

export async function listByTalentId(
  talentId: string,
): Promise<WorkHistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("work_history")
    .select(WORK_HISTORY_COLUMNS)
    .eq("talent_id", talentId)
    .order("verified_at", { ascending: false, nullsFirst: false });
  return (data as unknown as WorkHistoryRow[]) ?? [];
}

export async function listVerifiedByTalentId(
  talentId: string,
): Promise<WorkHistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("work_history")
    .select(WORK_HISTORY_COLUMNS)
    .eq("talent_id", talentId)
    .eq("verification_status", "VERIFIED")
    .order("verified_at", { ascending: false, nullsFirst: false });
  return (data as unknown as WorkHistoryRow[]) ?? [];
}
