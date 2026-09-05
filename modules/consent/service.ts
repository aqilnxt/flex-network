import { createSupabaseServerClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { notify } from "@/modules/notification/service";
import { logAudit } from "@/modules/audit/service";
import { sendEmail } from "@/modules/notification/email";
import { hashToken, issueConsentToken } from "./tokens";
import type { CreateConsentInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

async function loadConsentContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  talentId: string,
  applicationId: string,
): Promise<
  ServiceResult<{
    opportunityId: string;
    opportunityTitle: string;
    requiredReason: string;
  }>
> {
  const { data: application } = await supabase
    .from("applications")
    .select("id, status, talent_id, opportunity_id, opportunity:opportunities(title)")
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
    .select("id, requires_consent, title")
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
      opportunityTitle:
        (application as {
          opportunity?: { title?: string | null } | null;
        }).opportunity?.title ?? opportunity?.title ?? "Opportunity",
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

  const { data: talentProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", talentId)
    .single();
  const talentName = talentProfile?.full_name ?? "Talent";

  const { data: consent, error } = await supabase
    .from("consents")
    .insert({
      application_id: input.applicationId,
      talent_id: talentId,
      opportunity_id: ctx.opportunityId,
      consent_required: true,
      required_reason: ctx.requiredReason,
      guardian_email: input.guardianEmail,
      status: "PENDING",
      requested_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !consent) {
    if (error?.code === "23505") {
      return { data: null, error: { message: "Consent sudah diajukan" } };
    }
    return { data: null, error: { message: error?.message ?? "Insert consent gagal" } };
  }

  let rawToken: string;
  try {
    rawToken = await issueConsentToken(consent.id);
  } catch {
    return { data: null, error: { message: "Gagal membuat token persetujuan" } };
  }

  sendEmail({
    to: input.guardianEmail,
    title: "Persetujuan Wali Diperlukan",
    message: `${talentName} meminta persetujuan Anda untuk mengikuti opportunity "${ctx.opportunityTitle}". Buka tautan untuk menyetujui atau menolak. Tautan berlaku 48 jam.`,
    link: `/consent/${rawToken}`,
  }).catch(() => {});

  return { data: { applicationId: input.applicationId }, error: null };
}

export async function resolveConsentByToken(
  rawToken: string,
  decision: "APPROVED" | "REJECTED",
): Promise<ServiceResult<null>> {
  const { data: token } = await admin
    .from("consent_tokens")
    .select("id, expires_at, used_at, consent_id")
    .eq("token_hash", hashToken(rawToken))
    .maybeSingle();
  if (!token) return { data: null, error: { message: "Link tidak valid" } };
  if (token.used_at) return { data: null, error: { message: "Link sudah digunakan" } };
  if (new Date(token.expires_at) < new Date())
    return { data: null, error: { message: "Link kedaluwarsa" } };

  const { data: consent } = await admin
    .from("consents")
    .select("id, status, talent_id, application_id")
    .eq("id", token.consent_id)
    .single();
  if (!consent) return { data: null, error: { message: "Consent tidak ditemukan" } };
  if (consent.status !== "PENDING")
    return { data: null, error: { message: "Consent sudah diputuskan" } };

  const now = new Date().toISOString();
  // one-time race guard: klaim token dulu
  const { data: claimed } = await admin
    .from("consent_tokens")
    .update({ used_at: now })
    .eq("id", token.id)
    .is("used_at", null)
    .select("id")
    .single();
  if (!claimed) return { data: null, error: { message: "Link sudah digunakan" } };

  const { error: updateError } = await admin
    .from("consents")
    .update(
      decision === "APPROVED"
        ? { status: "APPROVED", approved_at: now }
        : { status: "REJECTED", rejected_at: now },
    )
    .eq("id", consent.id);
  if (updateError) return { data: null, error: { message: updateError.message } };

  notify({
    recipientId: consent.talent_id,
    type: "CONSENT_RESOLVED",
    title: decision === "APPROVED" ? "Consent Wali Disetujui" : "Consent Wali Ditolak",
    message:
      decision === "APPROVED"
        ? "Wali Anda telah menyetujui partisipasi. Silakan lanjut pembuatan kontrak."
        : "Wali Anda menolak partisipasi ini.",
    link: "/applications",
    metadata: { consentId: consent.id },
  }).catch(() => {});

  logAudit({
    actorId: null,
    actorType: "SYSTEM",
    action: decision === "APPROVED" ? "CONSENT_GUARDIAN_APPROVED" : "CONSENT_GUARDIAN_REJECTED",
    resourceType: "consent",
    resourceId: consent.id,
    metadata: { decision },
  }).catch(() => {});

  return { data: null, error: null };
}
