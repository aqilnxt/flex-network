import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReportInput } from "./schemas";
import { logAudit } from "@/modules/audit/service";

export type ReportRow = {
  id: string;
  reporter_id: string;
  target_user_id: string | null;
  target_opportunity_id: string | null;
  target_application_id: string | null;
  reason: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  created_at: string;
  updated_at: string;
  reporter?: { full_name: string | null } | null;
};

export async function createReport(reporterId: string, input: ReportInput): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reason: input.reason,
    target_user_id: input.targetUserId ?? null,
    target_opportunity_id: input.targetOpportunityId ?? null,
    target_application_id: input.targetApplicationId ?? null,
    status: "SUBMITTED",
  }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function listReports(status?: string): Promise<ReportRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("reports").select("*, reporter:reporter_id(full_name)").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data as unknown as ReportRow[]) ?? [];
}

export async function resolveReport(id: string, adminId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reports").update({ status: "RESOLVED" }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit({ actorId: adminId, action: "RESOLVE_REPORT", resourceType: "reports", resourceId: id }).catch(() => {});
}

export async function rejectReport(id: string, adminId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reports").update({ status: "REJECTED" }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit({ actorId: adminId, action: "REJECT_REPORT", resourceType: "reports", resourceId: id }).catch(() => {});
}
