"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { registerSchema, loginSchema } from "./schemas";
import { registerUser, loginUser, logoutUser } from "./service";

export async function register(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data yang dikirim tidak valid.",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const { error } = await registerUser(parsed.data);

  if (error) {
    return {
      success: false,
      error: { code: "AUTH_INVALID", message: error.message },
    };
  }

  redirect("/login");
}

export async function login(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Data yang dikirim tidak valid." },
    };
  }

  const { error } = await loginUser(parsed.data);

  if (error) {
    return {
      success: false,
      error: { code: "AUTH_INVALID", message: error.message },
    };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await logoutUser();
  redirect("/login");
}
