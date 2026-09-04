"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireRole } from "@/modules/lib/auth";
import { reportSchema } from "./schemas";
import { createReport, resolveReport, rejectReport } from "./service";
import { ActionResult } from "@/lib/result";

export async function submitReportAction(_prev: any, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const raw = {
    reason: String(formData.get("reason") ?? ""),
    targetUserId: formData.get("targetUserId") ? String(formData.get("targetUserId")) : undefined,
    targetOpportunityId: formData.get("targetOpportunityId") ? String(formData.get("targetOpportunityId")) : undefined,
    targetApplicationId: formData.get("targetApplicationId") ? String(formData.get("targetApplicationId")) : undefined,
  };
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } };
  }
  try {
    const id = await createReport(user.id, parsed.data);
    revalidatePath("/admin/reports");
    return { success: true, data: { id } };
  } catch (err: any) {
    return { success: false, error: { code: "REPORT_ERROR", message: err.message ?? "Failed to submit report" } };
  }
}

export async function resolveReportAction(reportId: string): Promise<void> {
  const admin = await requireRole("ADMIN");
  await resolveReport(reportId, admin.id);
  revalidatePath("/admin/reports");
}

export async function rejectReportAction(reportId: string): Promise<void> {
  const admin = await requireRole("ADMIN");
  await rejectReport(reportId, admin.id);
  revalidatePath("/admin/reports");
}
