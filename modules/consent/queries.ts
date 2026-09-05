import { admin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hashToken } from "./tokens";

export type ConsentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MISSING";

export type ConsentRow = {
  id: string;
  application_id: string;
  talent_id: string;
  opportunity_id: string;
  consent_required: boolean;
  required_reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_REQUIRED";
  requested_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
};

export type ConsentDecision = {
  required: boolean;
  status: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED" | "MISSING";
};

const CONSENT_COLUMNS =
  "id, application_id, talent_id, opportunity_id, consent_required, required_reason, status, requested_at, approved_at, rejected_at";

export async function getByApplicationId(
  applicationId: string,
): Promise<ConsentRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("consents")
    .select(CONSENT_COLUMNS)
    .eq("application_id", applicationId)
    .maybeSingle();
  return (data as unknown as ConsentRow) ?? null;
}

export async function listForApplications(
  applicationIds: string[],
): Promise<Map<string, ConsentRow>> {
  const map = new Map<string, ConsentRow>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("consents")
    .select(CONSENT_COLUMNS)
    .in("application_id", applicationIds);

  for (const c of (data as unknown as ConsentRow[]) ?? []) {
    map.set(c.application_id, c);
  }
  return map;
}

export async function getRequirementMap(
  applicationIds: string[],
): Promise<Map<string, { required: boolean; reason: string | null }>> {
  const map = new Map<string, { required: boolean; reason: string | null }>();
  if (applicationIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, talent_id, opportunity:opportunities!inner(requires_consent)",
    )
    .in("id", applicationIds);

  const rows =
    (data as unknown as {
      id: string;
      talent_id: string;
      opportunity: { requires_consent: boolean } | null;
    }[]) ?? [];

  const talentIds = [...new Set(rows.map((r) => r.talent_id))];
  const minorMap = new Map<string, boolean>();
  if (talentIds.length > 0) {
    const { data: talents } = await supabase
      .from("talent_profiles")
      .select("id, is_minor")
      .in("id", talentIds);
    for (const t of (talents as { id: string; is_minor: boolean }[]) ?? []) {
      minorMap.set(t.id, t.is_minor);
    }
  }

  for (const row of rows) {
    const requiresOpportunity = row.opportunity?.requires_consent === true;
    const isMinor = minorMap.get(row.talent_id) === true;
    const required = requiresOpportunity || isMinor;
    const reasons = [
      requiresOpportunity ? "Opportunity requires consent" : null,
      isMinor ? "Talent is minor" : null,
    ].filter((r): r is string => r !== null);
    map.set(row.id, {
      required,
      reason: required ? reasons.join("; ") : null,
    });
  }
  return map;
}

export async function getConsentDecision(
  applicationId: string,
): Promise<ConsentDecision> {
  const requirement = (await getRequirementMap([applicationId])).get(
    applicationId,
  );
  const required = requirement?.required ?? false;

  if (!required) {
    return { required: false, status: "NOT_REQUIRED" };
  }

  const row = await getByApplicationId(applicationId);
  return { required: true, status: row?.status ?? "MISSING" };
}

export type ConsentPageData = {
  talentName: string;
  roleTitle: string | null;
  organization: string | null;
  duration: string | null;
  compensation: number | null;
};

// null = token invalid/used/expired. Caller menampilkan pesan generik.
export async function getConsentPageData(
  rawToken: string,
): Promise<ConsentPageData | null> {
  const { data: token } = await admin
    .from("consent_tokens")
    .select("used_at, expires_at, consent:consents(talent_id, application_id)")
    .eq("token_hash", hashToken(rawToken))
    .maybeSingle();
  if (!token || token.used_at || new Date(token.expires_at) < new Date()) {
    return null;
  }
  const consent = token.consent as unknown as {
    talent_id: string;
    application_id: string;
  } | null;
  if (!consent) return null;

  const { data: app } = await admin
    .from("applications")
    .select("opportunity:opportunities(title, compensation, hirer:hirer_id(full_name))")
    .eq("id", consent.application_id)
    .single();
  const { data: talent } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", consent.talent_id)
    .single();

  const opp = app?.opportunity as
    | {
        title?: string | null;
        compensation?: number | null;
        hirer?: { full_name: string | null } | null;
      }
    | null;
  return {
    talentName: talent?.full_name ?? "Talent",
    roleTitle: opp?.title ?? null,
    organization: opp?.hirer?.full_name ?? null,
    duration: null,
    compensation: opp?.compensation ?? null,
  };
}
