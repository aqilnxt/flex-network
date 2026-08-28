"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireUser, requireRole } from "@/modules/lib/auth";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  moderateSchema,
} from "./schemas";
import {
  createOpty,
  updateOpty,
  submitForReview,
  closeOpty,
  moderateOpty,
  deleteOpty,
} from "./service";

const VALIDATION_ERROR: ActionResult = {
  success: false,
  error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
};

const INTERNAL_ERROR: ActionResult = {
  success: false,
  error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server." },
};

function formString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v;
}

function formIdList(v: FormDataEntryValue[]): string[] {
  return v
    .flatMap((item) => String(item).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOpportunityForm(formData: FormData) {
  return createOpportunitySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    opportunityType: formData.get("opportunityType"),
    location: formString(formData.get("location")),
    workMode: formData.get("workMode") ?? "ONSITE",
    startDate: formString(formData.get("startDate")),
    endDate: formString(formData.get("endDate")),
    workingHours: formString(formData.get("workingHours")),
    duration: formString(formData.get("duration")),
    compensation: formString(formData.get("compensation")),
    compensationType: formData.get("compensationType") ?? "NEGOTIABLE",
    requirements: formString(formData.get("requirements")),
    responsibilities: formString(formData.get("responsibilities")),
    otherTerms: formString(formData.get("otherTerms")),
    maxTalent: formData.get("maxTalent") ?? "1",
    applicationDeadline: formData.get("applicationDeadline"),
    requiresConsent: formData.get("requiresConsent"),
    cvRequirement: formData.get("cvRequirement"),
    portfolioRequirement: formData.get("portfolioRequirement"),
    interviewRequirement: formData.get("interviewRequirement"),
    meetingMethod: formString(formData.get("meetingMethod")),
    skillIds: formIdList(formData.getAll("skillIds")),
    interestIds: formIdList(formData.getAll("interestIds")),
  });
}

export async function create(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");

  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) return VALIDATION_ERROR;

  const { data, error } = await createOpty(user.id, parsed.data);
  if (error || !data) return INTERNAL_ERROR;

  revalidatePath("/hirer/opportunities");
  redirect(`/hirer/opportunities/${data.id}/edit`);
}

export async function update(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");

  const parsed = updateOpportunitySchema.safeParse({
    title: formString(formData.get("title")),
    description: formString(formData.get("description")),
    opportunityType: formString(formData.get("opportunityType")),
    location: formString(formData.get("location")),
    workMode: formData.get("workMode") ?? undefined,
    startDate: formString(formData.get("startDate")),
    endDate: formString(formData.get("endDate")),
    workingHours: formString(formData.get("workingHours")),
    duration: formString(formData.get("duration")),
    compensation: formString(formData.get("compensation")),
    compensationType: formData.get("compensationType") ?? undefined,
    requirements: formString(formData.get("requirements")),
    responsibilities: formString(formData.get("responsibilities")),
    otherTerms: formString(formData.get("otherTerms")),
    maxTalent: formString(formData.get("maxTalent")),
    applicationDeadline: formString(formData.get("applicationDeadline")),
    requiresConsent: formData.get("requiresConsent") ?? undefined,
    cvRequirement: formData.get("cvRequirement") ?? undefined,
    portfolioRequirement: formData.get("portfolioRequirement") ?? undefined,
    interviewRequirement: formData.get("interviewRequirement") ?? undefined,
    meetingMethod: formString(formData.get("meetingMethod")),
    skillIds: formIdList(formData.getAll("skillIds")),
    interestIds: formIdList(formData.getAll("interestIds")),
  });
  if (!parsed.success) return VALIDATION_ERROR;

  const { error } = await updateOpty(user.id, id, parsed.data);
  if (error) return INTERNAL_ERROR;

  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}

export async function submitReview(id: string): Promise<ActionResult> {
  const user = await requireRole("HIRER");
  const { error } = await submitForReview(user.id, id);
  if (error) {
    return { success: false, error: { code: "STATE_ERROR", message: error.message } };
  }
  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}

export async function close(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { error } = await closeOpty(user.id, id, user.role === "ADMIN");
  if (error) {
    return { success: false, error: { code: "STATE_ERROR", message: error.message } };
  }
  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}

export async function moderate(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = moderateSchema.safeParse({
    action: formData.get("action"),
    notes: formString(formData.get("notes")),
  });
  if (!parsed.success) return VALIDATION_ERROR;

  const { error } = await moderateOpty(user.id, id, parsed.data);
  if (error) {
    return { success: false, error: { code: "STATE_ERROR", message: error.message } };
  }

  revalidatePath("/admin/opportunities");
  return { success: true, data: null };
}

export async function deleteOpportunity(id: string): Promise<ActionResult> {
  const user = await requireRole("HIRER");
  const { error } = await deleteOpty(user.id, id);
  if (error) {
    return { success: false, error: { code: "STATE_ERROR", message: error.message } };
  }
  revalidatePath("/hirer/opportunities");
  return { success: true, data: null };
}
