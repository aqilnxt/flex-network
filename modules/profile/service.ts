import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UpdateProfileInput } from "./schemas";

export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const supabase = await createSupabaseServerClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName, bio: input.bio, location: input.location })
    .eq("id", userId);

  const { error: privateError } = await supabase
    .from("profile_private")
    .upsert({ profile_id: userId, phone: input.phone });

  return { profileError, privateError };
}

export async function addOwnSkill(userId: string, skillId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_skills")
    .upsert({ profile_id: userId, skill_id: skillId });
}

export async function removeOwnSkill(userId: string, skillId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_skills")
    .delete()
    .eq("profile_id", userId)
    .eq("skill_id", skillId);
}

export async function addOwnInterest(userId: string, interestId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_interests")
    .upsert({ profile_id: userId, interest_id: interestId });
}

export async function removeOwnInterest(userId: string, interestId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("talent_interests")
    .delete()
    .eq("profile_id", userId)
    .eq("interest_id", interestId);
}
