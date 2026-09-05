"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireRole } from "@/modules/lib/auth";
import { createConsentSchema } from "./schemas";
import {
  requestConsent as requestConsentService,
  resolveConsentByToken,
} from "./service";

export async function createConsent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("TALENT");

  const applicationId = formData.get("applicationId");
  const guardianEmail = formData.get("guardianEmail");
  const parsed = createConsentSchema.safeParse({
    applicationId: typeof applicationId === "string" ? applicationId : "",
    guardianEmail: typeof guardianEmail === "string" ? guardianEmail : "",
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

export async function resolveConsentAction(
  token: string,
  decision: string,
): Promise<void> {
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    redirect(`/consent/${token}?error=Keputusan%20tidak%20valid`);
  }
  const { error } = await resolveConsentByToken(token, decision);
  if (error) {
    redirect(`/consent/${token}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/consent/${token}?done=1`);
}
