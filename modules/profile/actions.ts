"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/lib/auth";
import { updateProfileSchema, updateTalentProfileSchema } from "./schemas";
import {
  updateOwnProfile,
  addOwnSkill,
  removeOwnSkill,
  addOwnInterest,
  removeOwnInterest,
} from "./service";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    bio: formData.get("bio"),
    location: formData.get("location"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
    };
  }

  const { profileError, privateError } = await updateOwnProfile(user.id, parsed.data);
  if (profileError || privateError) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui profil." },
    };
  }

  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function updateTalentProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "TALENT") {
    return { success: false, error: { code: "FORBIDDEN", message: "Hanya TALENT." } };
  }
  const parsed = updateTalentProfileSchema.safeParse({
    portfolioUrl: formData.get("portfolioUrl") ?? "",
    cvUrl: formData.get("cvUrl") ?? "",
    schoolName: formData.get("schoolName") ?? "",
    gradeLevel: formData.get("gradeLevel") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
    };
  }

  const norm = (v?: string) => (v && v.trim() ? v.trim() : null);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("talent_profiles").upsert({
    profile_id: user.id,
    portfolio_url: norm(parsed.data.portfolioUrl),
    cv_url: norm(parsed.data.cvUrl),
    school_name: norm(parsed.data.schoolName),
    grade_level: norm(parsed.data.gradeLevel),
  });

  if (error) {
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan portfolio." } };
  }

  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function addSkill(skillId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await addOwnSkill(user.id, skillId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function removeSkill(skillId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await removeOwnSkill(user.id, skillId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function addInterest(interestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await addOwnInterest(user.id, interestId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}

export async function removeInterest(interestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await removeOwnInterest(user.id, interestId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/profile");
  return { success: true, data: null };
}
