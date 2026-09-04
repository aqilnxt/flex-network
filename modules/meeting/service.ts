import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notify } from "@/modules/notification/service";
import type { ScheduleMeetingInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type SupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

async function getOwnedApplication(
  supabase: SupabaseClient,
  hirerId: string,
  applicationId: string,
): Promise<
  ServiceResult<{ id: string; status: string; opportunityId: string; talentId: string }>
> {
  const { data: application } = await supabase
    .from("applications")
    .select("id, status, opportunity_id, talent_id")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return { data: null, error: { message: "Application tidak ditemukan" } };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, hirer_id")
    .eq("id", application.opportunity_id)
    .single();

  if (!opportunity || opportunity.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }

  return {
    data: {
      id: application.id,
      status: application.status,
      opportunityId: application.opportunity_id,
      talentId: (application as { talent_id: string }).talent_id,
    },
    error: null,
  };
}

export async function schedule(
  hirerId: string,
  input: ScheduleMeetingInput,
): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: app, error: ownedError } = await getOwnedApplication(
    supabase,
    hirerId,
    input.applicationId,
  );
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "SELECTED") {
    return {
      data: null,
      error: {
        message: "Meeting hanya bisa dijadwalkan untuk application SELECTED",
      },
    };
  }

  const { data: existing } = await supabase
    .from("meetings")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();

  if (existing) {
    return { data: null, error: { message: "Meeting sudah dijadwalkan" } };
  }

  const { error } = await supabase.from("meetings").insert({
    application_id: input.applicationId,
    meeting_date: input.meetingDate,
    meeting_time: input.meetingTime,
    meeting_link: input.meetingLink || null,
    meeting_method: input.meetingMethod || null,
    notes: input.notes ?? null,
    status: "SCHEDULED",
  });

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Meeting sudah dijadwalkan" } };
    }
    return { data: null, error: { message: error.message } };
  }

  notify({
    recipientId: app.talentId,
    actorId: hirerId,
    type: "MEETING_SCHEDULED",
    title: "Meeting dijadwalkan",
    message: "Meeting telah dijadwalkan, silakan cek detail",
    link: `/applications`,
    metadata: { applicationId: input.applicationId, opportunityId: app.opportunityId },
  }).catch(() => {});

  return { data: { opportunityId: app.opportunityId }, error: null };
}

async function getOwnedMeeting(
  hirerId: string,
  meetingId: string,
): Promise<
  ServiceResult<{ id: string; status: string; opportunityId: string; talentId: string }>
> {
  const supabase = await createSupabaseServerClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, status, application_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) {
    return { data: null, error: { message: "Meeting tidak ditemukan" } };
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, opportunity_id, talent_id")
    .eq("id", meeting.application_id)
    .single();

  if (!application) {
    return { data: null, error: { message: "Application tidak ditemukan" } };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, hirer_id")
    .eq("id", application.opportunity_id)
    .single();

  if (!opportunity || opportunity.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }

  return {
    data: { id: meeting.id, status: meeting.status, opportunityId: opportunity.id, talentId: (application as { talent_id: string }).talent_id },
    error: null,
  };
}

export async function complete(
  hirerId: string,
  meetingId: string,
): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: meeting, error: ownedError } = await getOwnedMeeting(
    hirerId,
    meetingId,
  );
  if (ownedError || !meeting) return { data: null, error: ownedError };
  if (meeting.status !== "SCHEDULED") {
    return {
      data: null,
      error: { message: "Hanya SCHEDULED yang bisa diselesaikan" },
    };
  }

  const { error } = await supabase
    .from("meetings")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", meetingId);

  if (error) return { data: null, error: { message: error.message } };
  notify({
    recipientId: meeting.talentId,
    actorId: hirerId,
    type: "MEETING_COMPLETED",
    title: "Meeting selesai",
    message: "Meeting telah ditandai selesai",
    link: `/applications`,
    metadata: { meetingId, opportunityId: meeting.opportunityId },
  }).catch(() => {});
  return { data: { opportunityId: meeting.opportunityId }, error: null };
}

export async function cancel(
  hirerId: string,
  meetingId: string,
): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: meeting, error: ownedError } = await getOwnedMeeting(
    hirerId,
    meetingId,
  );
  if (ownedError || !meeting) return { data: null, error: ownedError };
  if (meeting.status !== "SCHEDULED") {
    return {
      data: null,
      error: { message: "Hanya SCHEDULED yang bisa dibatalkan" },
    };
  }

  const { error } = await supabase
    .from("meetings")
    .update({ status: "CANCELLED" })
    .eq("id", meetingId);

  if (error) return { data: null, error: { message: error.message } };
  notify({
    recipientId: meeting.talentId,
    actorId: hirerId,
    type: "MEETING_CANCELLED",
    title: "Meeting dibatalkan",
    message: "Meeting telah dibatalkan",
    link: `/applications`,
    metadata: { meetingId, opportunityId: meeting.opportunityId },
  }).catch(() => {});
  return { data: { opportunityId: meeting.opportunityId }, error: null };
}
