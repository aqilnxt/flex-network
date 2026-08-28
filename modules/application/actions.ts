"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/result";
import { requireRole } from "@/modules/lib/auth";
import { createApplicationSchema } from "./schemas";
import { apply as applyService, review, select, reject } from "./service";

function formString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v;
}

export async function apply(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("TALENT");

  const parsed = createApplicationSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    message: formString(formData.get("message")),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
    };
  }

  const { error } = await applyService(user.id, parsed.data);
  if (error) {
    return {
      success: false,
      error: { code: "APPLICATION_ERROR", message: error.message },
    };
  }

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/applications");
  return { success: true, data: null };
}

export async function reviewApplication(id: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await review(user.id, id);
  if (error) return;
  revalidatePath("/hirer/opportunities", "layout");
}

export async function selectApplication(id: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await select(user.id, id);
  if (error) return;
  revalidatePath("/hirer/opportunities", "layout");
}

export async function rejectApplication(id: string): Promise<void> {
  const user = await requireRole("HIRER");
  const { error } = await reject(user.id, id);
  if (error) return;
  revalidatePath("/hirer/opportunities", "layout");
}
