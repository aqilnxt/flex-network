import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContractSnapshot = {
  id: string;
  talent_id: string;
  opportunity_id: string;
  role_title: string | null;
  duration: string | null;
  compensation: number | null;
};

export async function upsertVerifiedHistory(
  contract: ContractSnapshot,
  activatorId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("work_history")
    .select("id, verification_status")
    .eq("contract_id", contract.id)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase.from("work_history").insert({
      contract_id: contract.id,
      talent_id: contract.talent_id,
      opportunity_id: contract.opportunity_id,
      title: contract.role_title,
      duration: contract.duration,
      compensation: contract.compensation,
    });
    if (insertError && insertError.code !== "23505") {
      return;
    }
  }

  await supabase
    .from("work_history")
    .update({
      verification_status: "VERIFIED",
      verified_at: new Date().toISOString(),
      verified_by: activatorId,
    })
    .eq("contract_id", contract.id)
    .neq("verification_status", "VERIFIED");
}
