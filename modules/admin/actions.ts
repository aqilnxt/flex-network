"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/lib/auth";
import { suspendUser, reactivateUser } from "./service";

export async function suspendUserAction(userId: string) {
  const admin = await requireRole("ADMIN");
  await suspendUser(userId, admin.id);
  revalidatePath("/admin/users");
}

export async function reactivateUserAction(userId: string) {
  const admin = await requireRole("ADMIN");
  await reactivateUser(userId, admin.id);
  revalidatePath("/admin/users");
}
