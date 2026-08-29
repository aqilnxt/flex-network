import { createSupabaseServerClient } from "@/lib/supabase/server";
import { scoreOpportunity, type MatchResult, type Recommendation } from "./service";

export type RecommendationsResult = {
  items: Recommendation[];
  total: number;
  page: number;
  limit: number;
};

export async function getRecommendations(
  talentId: string,
  { page = 1, limit = 12 }: { page?: number; limit?: number } = {},
): Promise<RecommendationsResult> {
  const supabase = await createSupabaseServerClient();

  const { data: talentSkills } = await supabase
    .from("talent_skills")
    .select("skill_id")
    .eq("profile_id", talentId);
  const { data: talentInterests } = await supabase
    .from("talent_interests")
    .select("interest_id")
    .eq("profile_id", talentId);

  const talentSkillIds = (talentSkills ?? []).map((r) => r.skill_id);
  const talentInterestIds = (talentInterests ?? []).map((r) => r.interest_id);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, work_mode, location, compensation, compensation_type")
    .eq("status", "PUBLISHED");

  if (!opportunities || opportunities.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  const oppIds = opportunities.map((o) => o.id);

  const { data: applications } = await supabase
    .from("applications")
    .select("opportunity_id")
    .eq("talent_id", talentId)
    .in("opportunity_id", oppIds);
  const appliedIds = new Set(
    (applications ?? []).map((a) => a.opportunity_id),
  );

  const { data: oppSkills } = await supabase
    .from("opportunity_skills")
    .select("opportunity_id, skill_id")
    .in("opportunity_id", oppIds);
  const { data: oppInterests } = await supabase
    .from("opportunity_interests")
    .select("opportunity_id, interest_id")
    .in("opportunity_id", oppIds);

  const skillsByOpp = new Map<string, string[]>();
  for (const s of oppSkills ?? []) {
    const arr = skillsByOpp.get(s.opportunity_id) ?? [];
    arr.push(s.skill_id);
    skillsByOpp.set(s.opportunity_id, arr);
  }

  const interestsByOpp = new Map<string, string[]>();
  for (const i of oppInterests ?? []) {
    const arr = interestsByOpp.get(i.opportunity_id) ?? [];
    arr.push(i.interest_id);
    interestsByOpp.set(i.opportunity_id, arr);
  }

  const scored = opportunities
    .filter((o) => !appliedIds.has(o.id))
    .map((o) => {
      const result = scoreOpportunity(
        talentSkillIds,
        talentInterestIds,
        skillsByOpp.get(o.id) ?? [],
        interestsByOpp.get(o.id) ?? [],
      );
      return { opportunity: o, ...result };
    })
    .sort((a, b) => b.finalMatchScore - a.finalMatchScore);

  const total = scored.length;
  const offset = (page - 1) * limit;
  const items = scored.slice(offset, offset + limit);

  return { items, total, page, limit };
}

export async function getMatchScoresForTalent(
  talentId: string,
  oppIds: string[],
): Promise<Map<string, MatchResult>> {
  const result = new Map<string, MatchResult>();
  if (oppIds.length === 0) return result;

  const supabase = await createSupabaseServerClient();

  const [talentSkills, talentInterests, oppSkills, oppInterests] =
    await Promise.all([
      supabase
        .from("talent_skills")
        .select("skill_id")
        .eq("profile_id", talentId),
      supabase
        .from("talent_interests")
        .select("interest_id")
        .eq("profile_id", talentId),
      supabase
        .from("opportunity_skills")
        .select("opportunity_id, skill_id")
        .in("opportunity_id", oppIds),
      supabase
        .from("opportunity_interests")
        .select("opportunity_id, interest_id")
        .in("opportunity_id", oppIds),
    ]);

  const talentSkillIds = (talentSkills.data ?? []).map((r) => r.skill_id);
  const talentInterestIds = (talentInterests.data ?? []).map(
    (r) => r.interest_id,
  );

  const skillsByOpp = new Map<string, string[]>();
  for (const s of oppSkills.data ?? []) {
    const arr = skillsByOpp.get(s.opportunity_id) ?? [];
    arr.push(s.skill_id);
    skillsByOpp.set(s.opportunity_id, arr);
  }

  const interestsByOpp = new Map<string, string[]>();
  for (const i of oppInterests.data ?? []) {
    const arr = interestsByOpp.get(i.opportunity_id) ?? [];
    arr.push(i.interest_id);
    interestsByOpp.set(i.opportunity_id, arr);
  }

  for (const oppId of oppIds) {
    result.set(
      oppId,
      scoreOpportunity(
        talentSkillIds,
        talentInterestIds,
        skillsByOpp.get(oppId) ?? [],
        interestsByOpp.get(oppId) ?? [],
      ),
    );
  }

  return result;
}
