"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireRole } from "@/modules/lib/auth";
import { createConsentSchema } from "./schemas";
import {
  requestConsent as requestConsentService,
  approve as approveConsentService,
  reject as rejectConsentService,
} from "./service";

export async function createConsent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("TALENT");

  const applicationId = formData.get("applicationId");
  const parsed = createConsentSchema.safeParse({
    applicationId: typeof applicationId === "string" ? applicationId : "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Data yang dikirim tidak valid.",
      },
    };
  }

  const { error } = await requestConsentService(user.id, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "CONSENT_ERROR", message: error.message },
    };
  }

  revalidatePath("/applications");
  return { success: true, data: null };
}

export async function approveConsent(consentId: string): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await approveConsentService(user.id, consentId);
  if (error) return;
  revalidatePath("/applications");
  redirect("/applications");
}

export async function rejectConsent(consentId: string): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await rejectConsentService(user.id, consentId);
  if (error) return;
  revalidatePath("/applications");
  redirect("/applications");
}
