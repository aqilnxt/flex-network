import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      "id, talent:profiles!inner(is_minor), opportunity:opportunities!inner(requires_consent)",
    )
    .in("id", applicationIds);

  const rows =
    (data as unknown as {
      id: string;
      talent: { is_minor: boolean } | null;
      opportunity: { requires_consent: boolean } | null;
    }[]) ?? [];

  for (const row of rows) {
    const requiresOpportunity = row.opportunity?.requires_consent === true;
    const isMinor = row.talent?.is_minor === true;
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
