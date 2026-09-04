import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/modules/audit/service";

export async function getDashboardStats(): Promise<{
  users: number;
  opportunities: number;
  applications: number;
  contracts: number;
  pendingReports: number;
}> {
  const supabase = await createSupabaseServerClient();
  const [usersRes, oppsRes, appsRes, contractsRes, reportsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase.from("contracts").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "SUBMITTED"),
  ]);
  return {
    users: usersRes.count ?? 0,
    opportunities: oppsRes.count ?? 0,
    applications: appsRes.count ?? 0,
    contracts: contractsRes.count ?? 0,
    pendingReports: reportsRes.count ?? 0,
  };
}

export async function listUsers(): Promise<
  Array<{ id: string; full_name: string | null; role: string; status: string; created_at: string }>
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, created_at")
    .order("created_at", { ascending: false });
  return (data as Array<{ id: string; full_name: string | null; role: string; status: string; created_at: string }>) ?? [];
}

export async function suspendUser(id: string, adminId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").update({ status: "SUSPENDED" }).eq("id", id);
  await logAudit({ actorId: adminId, action: "SUSPEND_USER", resourceType: "profiles", resourceId: id }).catch(() => {});
}

export async function reactivateUser(id: string, adminId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").update({ status: "ACTIVE" }).eq("id", id);
  await logAudit({ actorId: adminId, action: "REACTIVATE_USER", resourceType: "profiles", resourceId: id }).catch(() => {});
}
