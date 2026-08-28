import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionRole = "TALENT" | "HIRER" | "ADMIN";

export type CurrentUser = {
  id: string;
  email: string;
  role: SessionRole;
  status: string;
  fullName: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, full_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile?.role as SessionRole) ?? "TALENT",
    status: profile?.status ?? "ACTIVE",
    fullName: profile?.full_name ?? null,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: SessionRole): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) redirect("/dashboard");
  return user;
}
