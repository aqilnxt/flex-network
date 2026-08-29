import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateApplicationInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

export async function apply(
  talentId: string,
  input: CreateApplicationInput,
): Promise<ServiceResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, status, application_deadline")
    .eq("id", input.opportunityId)
    .single();

  if (!opportunity) {
    return { data: null, error: { message: "Opportunity tidak ditemukan" } };
  }
  if (opportunity.status !== "PUBLISHED") {
    return { data: null, error: { message: "Opportunity tidak tersedia untuk dilamar" } };
  }
  if (
    opportunity.application_deadline &&
    new Date(opportunity.application_deadline).getTime() < Date.now()
  ) {
    return { data: null, error: { message: "Deadline aplikasi sudah lewat" } };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      talent_id: talentId,
      opportunity_id: input.opportunityId,
      message: input.message ?? null,
      status: "APPLIED",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Kamu sudah apply ke opportunity ini" } };
    }
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

async function getOwnedApplication(
  hirerId: string,
  id: string,
): Promise<ServiceResult<{ id: string; status: string; opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, opportunity_id")
    .eq("id", id)
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
    },
    error: null,
  };
}

export async function review(
  hirerId: string,
  id: string,
): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: app, error: ownedError } = await getOwnedApplication(hirerId, id);
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "APPLIED") {
    return { data: null, error: { message: "Hanya APPLIED yang bisa di-review" } };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "UNDER_REVIEW", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { opportunityId: app.opportunityId }, error: null };
}

export async function select(hirerId: string, id: string): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: app, error: ownedError } = await getOwnedApplication(hirerId, id);
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "UNDER_REVIEW") {
    return { data: null, error: { message: "Hanya UNDER_REVIEW yang bisa di-select" } };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("max_talent")
    .eq("id", app.opportunityId)
    .single();

  const maxTalent = opportunity?.max_talent ?? 1;

  const { count: selectedCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", app.opportunityId)
    .eq("status", "SELECTED");

  if ((selectedCount ?? 0) >= maxTalent) {
    return { data: null, error: { message: "Kuota talent sudah penuh" } };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "SELECTED", selected_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { opportunityId: app.opportunityId }, error: null };
}

export async function reject(hirerId: string, id: string): Promise<ServiceResult<{ opportunityId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: app, error: ownedError } = await getOwnedApplication(hirerId, id);
  if (ownedError || !app) return { data: null, error: ownedError };
  if (app.status !== "APPLIED" && app.status !== "UNDER_REVIEW") {
    return { data: null, error: { message: "Status tidak bisa di-reject" } };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "REJECTED", rejected_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { opportunityId: app.opportunityId }, error: null };
}
