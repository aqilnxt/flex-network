"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import {
  startWork as startWorkService,
  completeWork as completeWorkService,
  confirmCompletion as confirmCompletionService,
} from "./service";

export async function startWork(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await startWorkService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}

export async function completeWork(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("TALENT");
  const { error } = await completeWorkService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}

export async function confirmWork(
  contractId: string,
  redirectTo: string,
): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await confirmCompletionService(user.id, contractId);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}
