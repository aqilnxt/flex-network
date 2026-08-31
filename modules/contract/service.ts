import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getConsentDecision } from "@/modules/consent/queries";
import type { CreateContractInput, UpdateContractInput } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

function generateContractNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CNTR-${yy}${mm}${dd}-${suffix}`;
}

type ContractRow = {
  id: string;
  application_id: string;
  opportunity_id: string;
  talent_id: string;
  hirer_id: string;
  status: string;
  compensation: number | null;
};

async function loadOwnedContract(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  contractId: string,
): Promise<ServiceResult<ContractRow>> {
  const { data: contract } = await supabase
    .from("contracts")
    .select(
      "id, application_id, opportunity_id, talent_id, hirer_id, status, compensation",
    )
    .eq("id", contractId)
    .single();

  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.talent_id !== userId && contract.hirer_id !== userId) {
    return { data: null, error: { message: "Not involved" } };
  }
  return { data: contract as unknown as ContractRow, error: null };
}

export async function createContract(
  hirerId: string,
  input: CreateContractInput,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, talent_id, opportunity_id")
    .eq("id", input.applicationId)
    .single();

  if (!application) {
    return { data: null, error: { message: "Application tidak ditemukan" } };
  }
  if (application.status !== "SELECTED") {
    return {
      data: null,
      error: { message: "Kontrak hanya bisa dibuat untuk application SELECTED" },
    };
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, hirer_id")
    .eq("id", application.opportunity_id)
    .single();

  if (!opportunity || opportunity.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("status")
    .eq("application_id", input.applicationId)
    .maybeSingle();

  if (!meeting || meeting.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Meeting harus COMPLETED sebelum kontrak bisa dibuat" },
    };
  }

  const decision = await getConsentDecision(input.applicationId);
  if (decision.required && decision.status !== "APPROVED") {
    const reason =
      decision.status === "PENDING"
        ? "Consent wali masih menunggu persetujuan"
        : decision.status === "REJECTED"
          ? "Consent wali ditolak"
          : "Consent wali belum diajukan";
    return { data: null, error: { message: `Kontrak diblokir: ${reason}` } };
  }

  const { data: existing } = await supabase
    .from("contracts")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();
  if (existing) {
    return { data: null, error: { message: "Kontrak sudah dibuat" } };
  }

  const { data: created, error } = await supabase
    .from("contracts")
    .insert({
      application_id: input.applicationId,
      opportunity_id: application.opportunity_id,
      talent_id: application.talent_id,
      hirer_id: hirerId,
      contract_number: generateContractNumber(),
      role_title: input.roleTitle,
      description: input.description || null,
      responsibilities: input.responsibilities || null,
      duration: input.duration || null,
      location: input.location || null,
      compensation: input.compensation ?? null,
      terms_conditions: input.termsConditions || null,
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: { message: "Kontrak sudah dibuat" } };
    }
    return { data: null, error: { message: error.message } };
  }

  return { data: { contractId: (created as { id: string }).id }, error: null };
}

export async function updateContract(
  hirerId: string,
  contractId: string,
  input: UpdateContractInput,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, hirer_id, status")
    .eq("id", contractId)
    .single();

  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (contract.status !== "DRAFT") {
    return { data: null, error: { message: "Hanya kontrak DRAFT yang bisa diedit" } };
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      role_title: input.roleTitle,
      description: input.description || null,
      responsibilities: input.responsibilities || null,
      duration: input.duration || null,
      location: input.location || null,
      compensation: input.compensation ?? null,
      terms_conditions: input.termsConditions || null,
    })
    .eq("id", contractId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { contractId }, error: null };
}

export async function propose(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, hirer_id, status")
    .eq("id", contractId)
    .single();

  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  if (contract.hirer_id !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (contract.status !== "DRAFT") {
    return {
      data: null,
      error: { message: "Hanya kontrak DRAFT yang bisa diajukan" },
    };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("contracts")
    .update({
      status: "PENDING_AGREEMENT",
      proposed_at: now,
      proposed_by: hirerId,
      hirer_agreed: true,
      hirer_agreed_at: now,
    })
    .eq("id", contractId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { contractId }, error: null };
}

export async function agree(
  userId: string,
  contractId: string,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract, error: ownedError } = await loadOwnedContract(
    supabase,
    userId,
    contractId,
  );
  if (ownedError || !contract) return { data: null, error: ownedError };

  if (contract.status !== "PENDING_AGREEMENT") {
    return {
      data: null,
      error: { message: "Hanya kontrak PENDING_AGREEMENT yang bisa disetujui" },
    };
  }

  const { data: current } = await supabase
    .from("contracts")
    .select("talent_agreed, hirer_agreed, talent_id, hirer_id")
    .eq("id", contractId)
    .single();

  if (!current) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }
  const isTalent = current.talent_id === userId;
  const alreadyAgreed = isTalent ? current.talent_agreed : current.hirer_agreed;
  if (alreadyAgreed) {
    return { data: null, error: { message: "Anda sudah menyetujui kontrak ini" } };
  }

  const now = new Date().toISOString();
  const nextTalentAgreed = isTalent ? true : current.talent_agreed;
  const nextHirerAgreed = isTalent ? current.hirer_agreed : true;
  const willActivate = nextTalentAgreed && nextHirerAgreed;

  const { error: updateError } = await supabase
    .from("contracts")
    .update(
      isTalent
        ? { talent_agreed: true, talent_agreed_at: now }
        : { hirer_agreed: true, hirer_agreed_at: now },
    )
    .eq("id", contractId);
  if (updateError) return { data: null, error: { message: updateError.message } };

  if (willActivate) {
    const { error: activateError } = await supabase
      .from("contracts")
      .update({ status: "ACTIVE", activated_at: now })
      .eq("id", contractId);
    if (activateError) return { data: null, error: { message: activateError.message } };

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
  }

  return { data: { contractId }, error: null };
}

export async function decline(
  userId: string,
  contractId: string,
  reason: string | null,
): Promise<ServiceResult<{ contractId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: contract, error: ownedError } = await loadOwnedContract(
    supabase,
    userId,
    contractId,
  );
  if (ownedError || !contract) return { data: null, error: ownedError };

  if (contract.status !== "PENDING_AGREEMENT") {
    return {
      data: null,
      error: { message: "Hanya kontrak PENDING_AGREEMENT yang bisa ditolak" },
    };
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      status: "TERMINATED",
      terminated_at: new Date().toISOString(),
      decline_reason: reason,
    })
    .eq("id", contractId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { contractId }, error: null };
}
