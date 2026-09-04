import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function listReports(status?: string): Promise<ReportRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("reports").select("*, reporter:reporter_id(full_name)").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data as unknown as ReportRow[]) ?? [];
}

export async function getReportById(id: string): Promise<ReportRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("reports").select("*, reporter:reporter_id(full_name)").eq("id", id).maybeSingle();
  return (data as unknown as ReportRow) ?? null;
}
