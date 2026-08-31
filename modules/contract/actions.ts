"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { requireUser, requireRole } from "@/modules/lib/auth";
import {
  createContractSchema,
  updateContractSchema,
} from "./schemas";
import {
  createContract as createContractService,
  updateContract as updateContractService,
  propose as proposeService,
  agree as agreeService,
  decline as declineService,
} from "./service";

export async function createContract(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("HIRER");

  const parsed = createContractSchema.safeParse({
    applicationId: formData.get("applicationId") ?? "",
    roleTitle: formData.get("roleTitle") ?? "",
    description: formData.get("description") ?? "",
    responsibilities: formData.get("responsibilities") ?? "",
    duration: formData.get("duration") ?? "",
    location: formData.get("location") ?? "",
    compensation: formData.get("compensation") ?? "",
    termsConditions: formData.get("termsConditions") ?? "",
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

  const { data, error } = await createContractService(user.id, parsed.data);
  if (error || !data) {
    return {
      success: false,
      error: { code: "CONTRACT_ERROR", message: error?.message ?? "Gagal membuat kontrak." },
    };
  }

  revalidatePath("/applications");
  redirect(`/contracts/${data.contractId}`);
}

export async function updateContractAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const contractId = String(formData.get("contractId") ?? "");
  const parsed = updateContractSchema.safeParse({
    roleTitle: formData.get("roleTitle") ?? "",
    description: formData.get("description") ?? "",
    responsibilities: formData.get("responsibilities") ?? "",
    duration: formData.get("duration") ?? "",
    location: formData.get("location") ?? "",
    compensation: formData.get("compensation") ?? "",
    termsConditions: formData.get("termsConditions") ?? "",
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

  const { error } = await updateContractService(user.id, contractId, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "CONTRACT_ERROR", message: error.message },
    };
  }

  revalidatePath(`/contracts/${contractId}`);
  redirect(`/contracts/${contractId}`);
}

export async function proposeContract(contractId: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await proposeService(user.id, contractId);
  if (error) return;
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/applications");
  redirect(`/contracts/${contractId}`);
}

export async function agreeContract(contractId: string): Promise<void> {
  const user = await requireUser();
  const { error } = await agreeService(user.id, contractId);
  if (error) return;
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/applications");
  redirect(`/contracts/${contractId}`);
}

export async function declineContract(contractId: string): Promise<void> {
  const user = await requireUser();
  const { error } = await declineService(user.id, contractId, null);
  if (error) return;
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/applications");
  redirect(`/contracts/${contractId}`);
}
