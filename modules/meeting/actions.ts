"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireRole } from "@/modules/lib/auth";
import { scheduleMeetingSchema } from "./schemas";
import { schedule as scheduleService, complete, cancel } from "./service";

export async function scheduleMeeting(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");

  const opportunityId = formData.get("opportunityId");

  const parsed = scheduleMeetingSchema.safeParse({
    applicationId: formData.get("applicationId"),
    meetingDate: formData.get("meetingDate"),
    meetingTime: formData.get("meetingTime"),
    meetingLink: formData.get("meetingLink") ?? "",
    meetingMethod: formData.get("meetingMethod") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          parsed.error.issues[0]?.message ?? "Data yang dikirim tidak valid.",
      },
    };
  }

  const { error } = await scheduleService(user.id, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "MEETING_ERROR", message: error.message },
    };
  }

  if (typeof opportunityId === "string") {
    revalidatePath(`/hirer/opportunities/${opportunityId}/applications`);
  }
  revalidatePath("/applications");
  return { success: true, data: null };
}

export async function completeMeeting(
  meetingId: string,
  opportunityId: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await complete(user.id, meetingId);
  if (error) return;
  revalidatePath(`/hirer/opportunities/${opportunityId}/applications`);
  revalidatePath("/applications");
  redirect(`/hirer/opportunities/${opportunityId}/applications`);
}

export async function cancelMeeting(
  meetingId: string,
  opportunityId: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await cancel(user.id, meetingId);
  if (error) return;
  revalidatePath(`/hirer/opportunities/${opportunityId}/applications`);
  revalidatePath("/applications");
  redirect(`/hirer/opportunities/${opportunityId}/applications`);
}
