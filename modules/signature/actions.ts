"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/result";
import { requireUser } from "@/modules/lib/auth";
import { signatureContractSchema } from "./schemas";
import {
  requestSignature as requestSignatureService,
  signDocument as signDocumentService,
} from "./service";

export async function requestSignatureAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const contractId = formData.get("contractId");
  const parsed = signatureContractSchema.safeParse({
    contractId: typeof contractId === "string" ? contractId : "",
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

  const { error } = await requestSignatureService(user.id, parsed.data.contractId);
  if (error) {
    return {
      success: false,
      error: { code: "SIGNATURE_ERROR", message: error.message },
    };
  }

  revalidatePath(`/contracts/${parsed.data.contractId}`);
  return { success: true, data: null };
}

export async function signDocumentAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const contractId = formData.get("contractId");
  const parsed = signatureContractSchema.safeParse({
    contractId: typeof contractId === "string" ? contractId : "",
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

  const { error } = await signDocumentService(user.id, parsed.data.contractId);
  if (error) {
    return {
      success: false,
      error: { code: "SIGNATURE_ERROR", message: error.message },
    };
  }

  revalidatePath(`/contracts/${parsed.data.contractId}`);
  return { success: true, data: null };
}
