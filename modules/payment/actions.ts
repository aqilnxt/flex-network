"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import {
  simulatePayment as simulatePaymentService,
  releasePayment as releasePaymentService,
} from "./service";

export async function simulatePayment(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await simulatePaymentService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}

export async function releasePayment(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await releasePaymentService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}
