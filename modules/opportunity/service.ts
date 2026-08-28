import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateOpportunityInput,
  UpdateOpportunityInput,
  ModerateInput,
} from "./schemas";

type ServiceResult<T = null> = {
  data: T | null;
  error: { message: string } | null;
};

function toServiceError(error: { message: string } | null): ServiceResult {
  return { data: null, error };
}

async function syncJunctions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  opportunityId: string,
  skillIds: string[],
  interestIds: string[],
) {
  if (skillIds.length) {
    await supabase.from("opportunity_skills").insert(
      skillIds.map((skillId) => ({
        opportunity_id: opportunityId,
        skill_id: skillId,
      })),
    );
  }
  if (interestIds.length) {
    await supabase.from("opportunity_interests").insert(
      interestIds.map((interestId) => ({
        opportunity_id: opportunityId,
        interest_id: interestId,
      })),
    );
  }
}

export async function createOpty(
  hirerId: string,
  input: CreateOpportunityInput,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();

  const { skillIds, interestIds, ...rest } = input;

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      hirer_id: hirerId,
      title: rest.title,
      description: rest.description,
      opportunity_type: rest.opportunityType,
      location: rest.location,
      work_mode: rest.workMode,
      start_date: rest.startDate,
      end_date: rest.endDate,
      working_hours: rest.workingHours,
      duration: rest.duration,
      compensation: rest.compensation,
      compensation_type: rest.compensationType,
      requirements: rest.requirements,
      responsibilities: rest.responsibilities,
      max_talent: rest.maxTalent,
      application_deadline: rest.applicationDeadline,
      requires_consent: rest.requiresConsent,
      cv_requirement: rest.cvRequirement,
      portfolio_requirement: rest.portfolioRequirement,
      interview_requirement: rest.interviewRequirement,
      meeting_method: rest.meetingMethod,
      other_terms: rest.otherTerms,
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (error || !data) return toServiceError(error);

  await syncJunctions(supabase, data.id, skillIds, interestIds);

  return { data, error: null };
}

export async function updateOpty(
  hirerId: string,
  id: string,
  input: UpdateOpportunityInput,
): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not found or not owner" } };
  }
  if (existing.status !== "DRAFT" && existing.status !== "PENDING_REVIEW") {
    return { data: null, error: { message: "Status tidak dapat diubah" } };
  }

  const { skillIds, interestIds, ...rest } = input;

  const { error } = await supabase
    .from("opportunities")
    .update({
      title: rest.title,
      description: rest.description,
      opportunity_type: rest.opportunityType,
      location: rest.location,
      work_mode: rest.workMode,
      start_date: rest.startDate,
      end_date: rest.endDate,
      working_hours: rest.workingHours,
      duration: rest.duration,
      compensation: rest.compensation,
      compensation_type: rest.compensationType,
      requirements: rest.requirements,
      responsibilities: rest.responsibilities,
      max_talent: rest.maxTalent,
      application_deadline: rest.applicationDeadline,
      requires_consent: rest.requiresConsent,
      cv_requirement: rest.cvRequirement,
      portfolio_requirement: rest.portfolioRequirement,
      interview_requirement: rest.interviewRequirement,
      meeting_method: rest.meetingMethod,
      other_terms: rest.otherTerms,
    })
    .eq("id", id)
    .eq("hirer_id", hirerId);

  if (error) return toServiceError(error);

  if (skillIds || interestIds) {
    await supabase.from("opportunity_skills").delete().eq("opportunity_id", id);
    await supabase
      .from("opportunity_interests")
      .delete()
      .eq("opportunity_id", id);
    await syncJunctions(supabase, id, skillIds ?? [], interestIds ?? []);
  }

  return { data: null, error: null };
}

export async function submitForReview(
  hirerId: string,
  id: string,
): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id, title, description, application_deadline")
    .eq("id", id)
    .single();

  if (!existing || existing.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not found or not owner" } };
  }
  if (existing.status !== "DRAFT") {
    return { data: null, error: { message: "Hanya DRAFT yang bisa di-submit" } };
  }
  if (!existing.title || !existing.description || !existing.application_deadline) {
    return {
      data: null,
      error: { message: "Lengkapi title, description, dan deadline" },
    };
  }

  const { error } = await supabase
    .from("opportunities")
    .update({ status: "PENDING_REVIEW", submitted_for_review_at: new Date().toISOString() })
    .eq("id", id)
    .eq("hirer_id", hirerId);

  return toServiceError(error);
}

export async function closeOpty(
  actorId: string,
  id: string,
  isAdmin: boolean,
): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id")
    .eq("id", id)
    .single();

  if (!existing) return { data: null, error: { message: "Not found" } };
  if (!isAdmin && existing.hirer_id !== actorId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (existing.status !== "PUBLISHED") {
    return { data: null, error: { message: "Hanya PUBLISHED yang bisa di-close" } };
  }

  const { error } = await supabase
    .from("opportunities")
    .update({ status: "CLOSED", closed_at: new Date().toISOString() })
    .eq("id", id);

  return toServiceError(error);
}

export async function moderateOpty(
  adminId: string,
  id: string,
  input: ModerateInput,
): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) return { data: null, error: { message: "Not found" } };

  const now = new Date().toISOString();
  const meta = {
    moderated_by: adminId,
    moderated_at: now,
    moderation_notes: input.notes ?? null,
  };

  switch (input.action) {
    case "APPROVE_PUBLISH": {
      if (existing.status !== "PENDING_REVIEW") {
        return {
          data: null,
          error: { message: "Hanya PENDING_REVIEW yang bisa di-approve" },
        };
      }
      const { error } = await supabase
        .from("opportunities")
        .update({ ...meta, status: "PUBLISHED", published_at: now })
        .eq("id", id);
      return toServiceError(error);
    }
    case "REQUEST_CHANGES": {
      if (existing.status !== "PENDING_REVIEW") {
        return {
          data: null,
          error: { message: "Hanya PENDING_REVIEW yang bisa di-request changes" },
        };
      }
      const { error } = await supabase
        .from("opportunities")
        .update({ ...meta, status: "DRAFT" })
        .eq("id", id);
      return toServiceError(error);
    }
    case "CLOSE": {
      if (existing.status !== "PUBLISHED") {
        return {
          data: null,
          error: { message: "Hanya PUBLISHED yang bisa di-close" },
        };
      }
      const { error } = await supabase
        .from("opportunities")
        .update({ ...meta, status: "CLOSED", closed_at: now })
        .eq("id", id);
      return toServiceError(error);
    }
    case "DELETE": {
      if (existing.status === "PUBLISHED") {
        return {
          data: null,
          error: { message: "PUBLISHED tidak bisa di-delete; close dulu" },
        };
      }
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", id);
      return toServiceError(error);
    }
  }
}

export async function deleteOpty(
  hirerId: string,
  id: string,
): Promise<ServiceResult<null>> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, status, hirer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not found or not owner" } };
  }
  if (existing.status !== "DRAFT") {
    return { data: null, error: { message: "Hanya DRAFT yang bisa di-delete" } };
  }

  const { error } = await supabase.from("opportunities").delete().eq("id", id);

  return toServiceError(error);
}
