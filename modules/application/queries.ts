import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TalentApplication = {
  id: string;
  status: string;
  applied_at: string;
  message: string | null;
  opportunity: {
    id: string;
    title: string;
    status: string;
    work_mode: string | null;
    location: string | null;
  } | null;
};

export type OpportunityApplication = {
  id: string;
  status: string;
  message: string | null;
  applied_at: string;
  talent: { id: string; full_name: string | null } | null;
};

export async function listForTalent(talentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, applied_at, message, opportunity:opportunities(id, title, status, work_mode, location)",
    )
    .eq("talent_id", talentId)
    .order("applied_at", { ascending: false });

  return { data: (data as unknown as TalentApplication[]) ?? [], error };
}

export async function listForHirer(hirerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, applied_at, message, opportunity:opportunities!inner(id, title, status, work_mode, location)",
    )
    .eq("opportunity.hirer_id", hirerId)
    .order("applied_at", { ascending: false });

  return { data: (data as unknown as TalentApplication[]) ?? [], error };
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
      applications: [] as OpportunityApplication[],
      maxTalent: 1,
      selectedCount: 0,
      error: { message: "Not found or not owner" },
    };
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, message, applied_at, talent:profiles(id, full_name)")
    .eq("opportunity_id", opportunityId)
    .order("applied_at", { ascending: true });

  const { count: selectedCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", opportunityId)
    .eq("status", "SELECTED");

  return {
    applications: (applications as unknown as OpportunityApplication[]) ?? [],
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
  return (data as unknown as { id: string; status: string } | null) ?? null;
}
