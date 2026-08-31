"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { ratingSchema } from "./schemas";
import { submitRating as submitRatingService } from "./service";

export async function submitRating(
  contractId: string,
  redirectTo: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const parsed = ratingSchema.safeParse({
    contractId,
    score: Number(formData.get("score")),
    reviewText:
      (formData.get("reviewText") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) return;

  const { error } = await submitRatingService(user.id, parsed.data);
  if (error) return;
  revalidatePath("/applications");
  revalidatePath(`/contracts/${contractId}`);
  redirect(redirectTo);
}
