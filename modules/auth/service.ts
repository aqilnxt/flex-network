import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegisterInput, LoginInput } from "./schemas";

export async function registerUser(input: RegisterInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { role: input.role, full_name: input.fullName } },
  });
  return { data, error };
}

export async function loginUser(input: LoginInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  return { data, error };
}

export async function logoutUser() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
