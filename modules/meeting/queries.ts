import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MeetingRow = {
  id: string;
  application_id: string;
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_link: string | null;
  meeting_method: string | null;
  notes: string | null;
  status: string;
  completed_at: string | null;
};

export async function getByApplicationId(
  applicationId: string,
): Promise<MeetingRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("meetings")
    .select(
      "id, application_id, meeting_date, meeting_time, meeting_link, meeting_method, notes, status, completed_at",
    )
    .eq("application_id", applicationId)
    .maybeSingle();
  return (data as unknown as MeetingRow) ?? null;
}

export async function listForApplications(
  applicationIds: string[],
): Promise<Map<string, MeetingRow>> {
  const map = new Map<string, MeetingRow>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("meetings")
    .select(
      "id, application_id, meeting_date, meeting_time, meeting_link, meeting_method, notes, status, completed_at",
    )
    .in("application_id", applicationIds);

  for (const m of (data as unknown as MeetingRow[]) ?? []) {
    map.set(m.application_id, m);
  }
  return map;
}
