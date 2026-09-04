import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSignedDocUrl } from "@/lib/supabase/storage";
import { logAudit } from "@/modules/audit/service";
import { getConsentDecision } from "@/modules/consent/queries";
import { notify } from "@/modules/notification/service";
import { getSignatureProvider } from "./index";
import type { DocumentContractData, PriorSignatures, ServiceResult } from "./types";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type SignatureContractRow = {
  id: string;
  application_id: string;
  talent_id: string;
  hirer_id: string;
  status: string;
  compensation: number | null;
  contract_number: string | null;
  role_title: string | null;
  description: string | null;
  responsibilities: string | null;
  duration: string | null;
  location: string | null;
  terms_conditions: string | null;
  signature_mode: string | null;
  document_url: string | null;
  signed_document_url: string | null;
  signed_document_hash: string | null;
  talent_signed_at: string | null;
  hirer_signed_at: string | null;
};

async function loadSignatureContract(
  supabase: Supabase,
  contractId: string,
): Promise<SignatureContractRow | null> {
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, application_id, talent_id, hirer_id, status, compensation, contract_number, role_title, description, responsibilities, duration, location, terms_conditions, signature_mode, document_url, signed_document_url, signed_document_hash, talent_signed_at, hirer_signed_at",
    )
    .eq("id", contractId)
    .single();
  return (data as unknown as SignatureContractRow) ?? null;
}

async function loadProfileNames(
  supabase: Supabase,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(ids)];
  if (unique.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);
  for (const p of (data as unknown as { id: string; full_name: string | null }[]) ?? []) {
    map.set(p.id, p.full_name ?? "");
  }
  return map;
}

async function loadAccessibleEmails(
  supabase: Supabase,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(ids)];
  if (unique.length === 0) return map;
  const { data } = await supabase
    .from("profile_private")
    .select("profile_id, email")
    .in("profile_id", unique);
  for (const p of (data as unknown as { profile_id: string; email: string | null }[]) ?? []) {
    if (p.email) map.set(p.profile_id, p.email);
  }
  return map;
}

export async function requestSignature(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const contract = await loadSignatureContract(supabase, contractId);
  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (contract.status !== "DRAFT") {
    return {
      data: null,
      error: { message: "Hanya kontrak DRAFT yang bisa meminta tanda tangan" },
    };
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("status")
    .eq("application_id", contract.application_id)
    .maybeSingle();
  if (!meeting || meeting.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Meeting harus COMPLETED sebelum kontrak bisa diajukan" },
    };
  }

  const decision = await getConsentDecision(contract.application_id);
  if (decision.required && decision.status !== "APPROVED") {
    const reason =
      decision.status === "PENDING"
        ? "Consent wali masih menunggu persetujuan"
        : decision.status === "REJECTED"
          ? "Consent wali ditolak"
          : "Consent wali belum diajukan";
    return { data: null, error: { message: `Kontrak diblokir: ${reason}` } };
  }

  const names = await loadProfileNames(supabase, [contract.talent_id, contract.hirer_id]);
  const emails = await loadAccessibleEmails(supabase, [contract.talent_id, contract.hirer_id]);
  const talentName = names.get(contract.talent_id) || "Talent";
  const hirerName = names.get(contract.hirer_id) || "Hirer";

  const provider = getSignatureProvider();
  const documentData: DocumentContractData = {
    contractNumber: contract.contract_number ?? "",
    roleTitle: contract.role_title,
    description: contract.description,
    responsibilities: contract.responsibilities,
    duration: contract.duration,
    location: contract.location,
    compensation: contract.compensation,
    termsConditions: contract.terms_conditions,
    talentName,
    hirerName,
  };

  let result: { externalId: string | null; docUrl: string };
  try {
    result = await provider.requestSignature(
      contractId,
      documentData,
      emails.get(contract.talent_id) ?? "",
      emails.get(contract.hirer_id) ?? "",
    );
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "Gagal membuat dokumen" },
    };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("contracts")
    .update({
      status: "PENDING_SIGNATURE",
      signature_mode: provider.id,
      document_url: result.docUrl,
      signature_requested_at: now,
      external_signature_id: result.externalId,
    })
    .eq("id", contractId);
  if (error) return { data: null, error: { message: error.message } };

  notify({
    recipientId: contract.talent_id,
    actorId: hirerId,
    type: "CONTRACT_SIGNATURE_REQUESTED",
    title: "Permintaan Tanda Tangan",
    message: "Kontrak telah dibuat dan menunggu tanda tangan Anda",
    link: `/contracts/${contractId}`,
    metadata: { contractId },
  }).catch(() => {});

  logAudit({
    actorId: hirerId,
    action: "SIGNATURE_REQUESTED",
    resourceType: "contract",
    resourceId: contractId,
    metadata: { provider: provider.id },
  }).catch(() => {});

  return { data: { contractId }, error: null };
}

export async function signDocument(
  userId: string,
  contractId: string,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const contract = await loadSignatureContract(supabase, contractId);
  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.talent_id !== userId && contract.hirer_id !== userId) {
    return { data: null, error: { message: "Not involved" } };
  }
  if (contract.status !== "PENDING_SIGNATURE") {
    return {
      data: null,
      error: { message: "Kontrak tidak dalam status PENDING_SIGNATURE" },
    };
  }

  const signedBy: "talent" | "hirer" =
    contract.talent_id === userId ? "talent" : "hirer";
  const ownSignedAt =
    signedBy === "talent" ? contract.talent_signed_at : contract.hirer_signed_at;
  if (ownSignedAt) {
    return { data: null, error: { message: "Anda sudah menandatangani kontrak ini" } };
  }

  const names = await loadProfileNames(supabase, [contract.talent_id, contract.hirer_id]);
  const signerName = names.get(userId) || (signedBy === "talent" ? "Talent" : "Hirer");

  const otherId =
    signedBy === "talent" ? contract.hirer_id : contract.talent_id;
  const priorSignatures: PriorSignatures = {
    talent:
      signedBy === "hirer" && contract.talent_signed_at
        ? { name: names.get(contract.talent_id) || "Talent", at: contract.talent_signed_at }
        : null,
    hirer:
      signedBy === "talent" && contract.hirer_signed_at
        ? { name: names.get(contract.hirer_id) || "Hirer", at: contract.hirer_signed_at }
        : null,
  };

  const provider = getSignatureProvider();
  let result: { docUrl: string; hash: string; signedAt: string };
  try {
    result = await provider.signDocument(
      contractId,
      signedBy,
      signerName,
      priorSignatures,
    );
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "Gagal menandatangani dokumen" },
    };
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      ...(signedBy === "talent"
        ? { talent_signed_at: result.signedAt }
        : { hirer_signed_at: result.signedAt }),
      signed_document_url: result.docUrl,
      signed_document_hash: result.hash,
    })
    .eq("id", contractId);
  if (updateError) return { data: null, error: { message: updateError.message } };

  logAudit({
    actorId: userId,
    action: "CONTRACT_SIGNED",
    resourceType: "contract",
    resourceId: contractId,
    metadata: { signedBy, provider: provider.id },
  }).catch(() => {});

  // Re-check post-update: kedua pihak sudah tanda tangan? Baca fresh dari DB agar
  // race cross-party (talent+hirer sign bersamaan) tidak membuat kontrak stuck.
  // Idempotent: dua aktivasi konkuren toleran (payment/work insert already guard 23505).
  const { data: recheck } = await supabase
    .from("contracts")
    .select("talent_signed_at, hirer_signed_at")
    .eq("id", contractId)
    .single();
  const signed = recheck as {
    talent_signed_at: string | null;
    hirer_signed_at: string | null;
  } | null;
  const bothSigned =
    signed?.talent_signed_at != null && signed.hirer_signed_at != null;

  if (bothSigned) {
    const now = new Date().toISOString();
    const { error: activateError } = await supabase
      .from("contracts")
      .update({ status: "ACTIVE", activated_at: now })
      .eq("id", contractId);
    if (activateError) {
      return { data: null, error: { message: activateError.message } };
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      contract_id: contractId,
      amount: contract.compensation,
      currency: "IDR",
      status: "PENDING",
    });
    if (paymentError && paymentError.code !== "23505") {
      return { data: null, error: { message: paymentError.message } };
    }

    const { error: workError } = await supabase.from("works").insert({
      contract_id: contractId,
      status: "NOT_STARTED",
    });
    if (workError && workError.code !== "23505") {
      return { data: null, error: { message: workError.message } };
    }

    logAudit({
      actorId: userId,
      action: "CONTRACT_ACTIVATED",
      resourceType: "contract",
      resourceId: contractId,
      metadata: { via: "signature" },
    }).catch(() => {});

    notify({
      recipientId: contract.talent_id,
      actorId: userId,
      type: "CONTRACT_ACTIVATED",
      title: "Kontrak aktif",
      message: "Kontrak telah ditandatangani kedua pihak dan kini aktif",
      link: `/contracts/${contractId}`,
      metadata: { contractId },
    }).catch(() => {});
    notify({
      recipientId: contract.hirer_id,
      actorId: userId,
      type: "CONTRACT_ACTIVATED",
      title: "Kontrak aktif",
      message: "Kontrak telah ditandatangani kedua pihak dan kini aktif",
      link: `/contracts/${contractId}`,
      metadata: { contractId },
    }).catch(() => {});
  } else {
    notify({
      recipientId: otherId,
      actorId: userId,
      type: "CONTRACT_SIGNED",
      title: "Kontrak ditandatangani",
      message: `${signedBy === "talent" ? "Talent" : "Hirer"} telah menandatangani kontrak`,
      link: `/contracts/${contractId}`,
      metadata: { contractId },
    }).catch(() => {});
  }

  return { data: { contractId }, error: null };
}

export type SignatureInfo = {
  mode: string | null;
  status: string;
  documentUrl: string | null;
  signedDocumentUrl: string | null;
  hash: string | null;
  talentSignedAt: string | null;
  hirerSignedAt: string | null;
  downloadUrl: string | null;
};

export async function getSignatureInfo(
  contractId: string,
  userId: string,
): Promise<ServiceResult<SignatureInfo>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select(
      "id, talent_id, hirer_id, status, signature_mode, document_url, signed_document_url, signed_document_hash, talent_signed_at, hirer_signed_at",
    )
    .eq("id", contractId)
    .single();

  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  const row = contract as unknown as {
    talent_id: string;
    hirer_id: string;
    status: string;
    signature_mode: string | null;
    document_url: string | null;
    signed_document_url: string | null;
    signed_document_hash: string | null;
    talent_signed_at: string | null;
    hirer_signed_at: string | null;
  };
  if (row.talent_id !== userId && row.hirer_id !== userId) {
    return { data: null, error: { message: "Not involved" } };
  }

  let downloadUrl: string | null = null;
  if (row.signed_document_url) {
    try {
      downloadUrl = await getSignedDocUrl(row.signed_document_url);
    } catch {
      downloadUrl = null;
    }
  }

  return {
    data: {
      mode: row.signature_mode,
      status: row.status,
      documentUrl: row.document_url,
      signedDocumentUrl: row.signed_document_url,
      hash: row.signed_document_hash,
      talentSignedAt: row.talent_signed_at,
      hirerSignedAt: row.hirer_signed_at,
      downloadUrl,
    },
    error: null,
  };
}
