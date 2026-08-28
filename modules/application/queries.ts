import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listForTalent(talentId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("applications")
    .select(
      "id, status, applied_at, message, opportunity:opportunity_id(id, title, status, work_mode, location)",
    )
    .eq("talent_id", talentId)
    .order("applied_at", { ascending: false });
}

export async function listForOpportunity(opportunityId: string, hirerId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, hirer_id, max_talent, title")
    .eq("id", opportunityId)
    .single();

  if (!opportunity || opportunity.hirer_id !== hirerId) {
    return {
      applications: [],
      maxTalent: 1,
      selectedCount: 0,
      error: { message: "Not found or not owner" },
    };
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, message, applied_at, talent:talent_id(id, full_name)")
    .eq("opportunity_id", opportunityId)
    .order("applied_at", { ascending: true });

  const { count: selectedCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", opportunityId)
    .eq("status", "SELECTED");

  return {
    applications: applications ?? [],
    maxTalent: opportunity.max_talent ?? 1,
    selectedCount: selectedCount ?? 0,
    error: null,
  };
}

export async function getApplicationStatus(talentId: string, opportunityId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("applications")
    .select("id, status")
    .eq("talent_id", talentId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  return data ?? null;
}
