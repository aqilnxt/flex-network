import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listVerifiedByTalentId } from "@/modules/work_history/queries";

export type PublicTalentProfile = {
  id: string;
  role: string;
  fullName: string | null;
  bio: string | null;
  location: string | null;
  schoolName: string | null;
  gradeLevel: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  skills: string[];
  workHistory: Array<{
    id: string;
    title: string | null;
    duration: string | null;
  }>;
};

export async function getPublicTalentProfile(
  profileId: string,
): Promise<PublicTalentProfile | null> {
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, bio, location")
    .eq("id", profileId)
    .single();
  if (!profile) return null;

  const [{ data: talent }, { data: skills }] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("school_name, grade_level, portfolio_url, cv_url")
      .eq("profile_id", profileId)
      .maybeSingle(),
    supabase
      .from("talent_skills")
      .select("skill:skills(name)")
      .eq("profile_id", profileId),
  ]);

  const workHistory =
    profile.role === "TALENT" ? await listVerifiedByTalentId(profileId) : [];

  return {
    id: profile.id,
    role: profile.role,
    fullName: profile.full_name,
    bio: profile.bio,
    location: profile.location,
    schoolName: talent?.school_name ?? null,
    gradeLevel: talent?.grade_level ?? null,
    portfolioUrl: talent?.portfolio_url ?? null,
    cvUrl: talent?.cv_url ?? null,
    skills: ((skills as unknown as Array<{ skill: { name: string } | null }> | null) ?? [])
      .map((s) => s.skill?.name)
      .filter((n): n is string => Boolean(n)),
    workHistory: workHistory.map((w) => ({
      id: w.id,
      title: w.title,
      duration: w.duration,
    })),
  };
}
