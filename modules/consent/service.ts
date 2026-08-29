import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateConsentInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

async function loadConsentContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  talentId: string,
  applicationId: string,
): Promise<ServiceResult<{ opportunityId: string; requiredReason: string }>> {
  const { data: application } = await supabase
    .from("applications")
    .select("id, status, talent_id, opportunity_id")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return { data: null, error: { message: "Application tidak ditemukan" } };
  }
  if (application.talent_id !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (application.status !== "SELECTED") {
    return {
      data: null,
      error: { message: "Consent hanya bisa diajukan untuk application SELECTED" },
    };
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("status")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!meeting || meeting.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Meeting harus COMPLETED sebelum consent bisa diajukan" },
    };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, requires_consent")
    .eq("id", application.opportunity_id)
    .single();

  const { data: profile } = await supabase
    .from("talent_profiles")
    .select("is_minor")
    .eq("id", talentId)
    .maybeSingle();

  const requiresOpportunity = opportunity?.requires_consent === true;
  const isMinor = profile?.is_minor === true;

  if (!requiresOpportunity && !isMinor) {
    return {
      data: null,
      error: { message: "Consent tidak diperlukan untuk application ini" },
    };
  }

  const reasons = [
    requiresOpportunity ? "Opportunity requires consent" : null,
    isMinor ? "Talent is minor" : null,
  ].filter((r): r is string => r !== null);

  return {
    data: {
      opportunityId: application.opportunity_id,
      requiredReason: reasons.join("; "),
    },
    error: null,
  };
}

export async function requestConsent(
  talentId: string,
  input: CreateConsentInput,
): Promise<ServiceResult<{ applicationId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: ctxError } = await loadConsentContext(
    supabase,
    talentId,
    input.applicationId,
  );
  if (ctxError || !ctx) return { data: null, error: ctxError };

  const { data: existing } = await supabase
    .from("consents")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();

  if (existing) {
    return { data: null, error: { message: "Consent sudah diajukan" } };
  }

  const { error } = await supabase.from("consents").insert({
    application_id: input.applicationId,
    talent_id: talentId,
    opportunity_id: ctx.opportunityId,
    consent_required: true,
    required_reason: ctx.requiredReason,
    status: "PENDING",
    requested_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Consent sudah diajukan" } };
    }
    return { data: null, error: { message: error.message } };
  }

  return { data: { applicationId: input.applicationId }, error: null };
}

async function getOwnedConsent(
  talentId: string,
  consentId: string,
): Promise<
  ServiceResult<{
    id: string;
    status: string;
    consentRequired: boolean;
    applicationId: string;
  }>
> {
  const supabase = await createSupabaseServerClient();

  const { data: consent } = await supabase
    .from("consents")
    .select("id, status, consent_required, talent_id, application_id")
    .eq("id", consentId)
    .single();

  if (!consent) {
    return { data: null, error: { message: "Consent tidak ditemukan" } };
  }
  if (consent.talent_id !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }

  return {
    data: {
      id: consent.id,
      status: consent.status,
      consentRequired: consent.consent_required,
      applicationId: consent.application_id,
    },
    error: null,
  };
}

export async function approve(
  talentId: string,
  consentId: string,
): Promise<ServiceResult<{ applicationId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: consent, error: ownedError } = await getOwnedConsent(talentId, consentId);
  if (ownedError || !consent) return { data: null, error: ownedError };

  if (!consent.consentRequired) {
    return {
      data: null,
      error: { message: "Consent tidak wajib untuk application ini" },
    };
  }
  if (consent.status !== "PENDING") {
    return { data: null, error: { message: "Hanya PENDING yang bisa disetujui" } };
  }

  const { error } = await supabase
    .from("consents")
    .update({ status: "APPROVED", approved_at: new Date().toISOString() })
    .eq("id", consentId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { applicationId: consent.applicationId }, error: null };
}

export async function reject(
  talentId: string,
  consentId: string,
): Promise<ServiceResult<{ applicationId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: consent, error: ownedError } = await getOwnedConsent(talentId, consentId);
  if (ownedError || !consent) return { data: null, error: ownedError };

  if (!consent.consentRequired) {
    return {
      data: null,
      error: { message: "Consent tidak wajib untuk application ini" },
    };
  }
  if (consent.status !== "PENDING") {
    return { data: null, error: { message: "Hanya PENDING yang bisa ditolak" } };
  }

  const { error } = await supabase
    .from("consents")
    .update({ status: "REJECTED", rejected_at: new Date().toISOString() })
    .eq("id", consentId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { applicationId: consent.applicationId }, error: null };
}
