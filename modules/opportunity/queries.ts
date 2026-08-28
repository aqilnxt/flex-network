import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OpportunityFilters = {
  search?: string;
  type?: string;
  workMode?: string;
  location?: string;
  compensationType?: string;
  skillId?: string;
  interestId?: string;
  sort?: "newest" | "oldest" | "deadline";
  page?: number;
  limit?: number;
};

async function opportunityIdsBySkill(skillId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("opportunity_skills")
    .select("opportunity_id")
    .eq("skill_id", skillId);
  return (data ?? []).map((row) => row.opportunity_id);
}

async function opportunityIdsByInterest(interestId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("opportunity_interests")
    .select("opportunity_id")
    .eq("interest_id", interestId);
  return (data ?? []).map((row) => row.opportunity_id);
}

export async function listPublished(filters: OpportunityFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;

  let query = supabase
    .from("opportunities")
    .select(
      "*, skills:opportunity_skills(skill:skills(id, name)), interests:opportunity_interests(interest:interests(id, name))",
      { count: "exact" },
    )
    .eq("status", "PUBLISHED");

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }
  if (filters.type) query = query.eq("opportunity_type", filters.type);
  if (filters.workMode) query = query.eq("work_mode", filters.workMode);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.compensationType)
    query = query.eq("compensation_type", filters.compensationType);

  if (filters.skillId) {
    const ids = await opportunityIdsBySkill(filters.skillId);
    query = query.in("id", ids);
  }
  if (filters.interestId) {
    const ids = await opportunityIdsByInterest(filters.interestId);
    query = query.in("id", ids);
  }

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "deadline":
      query = query.order("application_deadline", {
        ascending: true,
        nullsFirst: false,
      });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  return query;
}

export async function getOpportunityById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "*, hirer:hirer_id(id, full_name), skills:opportunity_skills(skill:skills(id, name)), interests:opportunity_interests(interest:interests(id, name))",
    )
    .eq("id", id)
    .single();

  if (error || !data) return { data, error };

  const hirerId = data.hirer_id as string;
  const { data: hirerProfile } = await supabase
    .from("hirer_profiles")
    .select("company_name")
    .eq("profile_id", hirerId)
    .single();

  return {
    data: { ...data, company_name: hirerProfile?.company_name ?? null },
    error,
  };
}

