import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notify } from "@/modules/notification/service";
import { getByContractId as getWorkByContractId } from "@/modules/work/queries";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type PaymentWithContract = {
  paymentId: string;
  paymentStatus: string;
  contractTalentId: string;
  contractHirerId: string;
  contractStatus: string;
};

async function loadPaymentWithContract(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  contractId: string,
): Promise<ServiceResult<PaymentWithContract>> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, status, contract:contracts(talent_id, hirer_id, status)")
    .eq("contract_id", contractId)
    .maybeSingle();

  if (error) return { data: null, error: { message: error.message } };
  if (!data) {
    return { data: null, error: { message: "Payment tidak ditemukan" } };
  }

  const row = data as unknown as {
    id: string;
    status: string;
    contract: { talent_id: string; hirer_id: string; status: string } | null;
  };

  if (!row.contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }

  return {
    data: {
      paymentId: row.id,
      paymentStatus: row.status,
      contractTalentId: row.contract.talent_id,
      contractHirerId: row.contract.hirer_id,
      contractStatus: row.contract.status,
    },
    error: null,
  };
}

export async function simulatePayment(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ paymentId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadPaymentWithContract(
    supabase,
    contractId,
  );
  if (loadError || !ctx) return { data: null, error: loadError };

  if (ctx.contractHirerId !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (ctx.contractStatus !== "ACTIVE") {
    return { data: null, error: { message: "Kontrak belum aktif" } };
  }
  if (ctx.paymentStatus !== "PENDING") {
    return {
      data: null,
      error: { message: "Payment sudah disimulasikan" },
    };
  }

  const { error } = await supabase
    .from("payments")
    .update({
      status: "SIMULATED_PAID",
      held_at: new Date().toISOString(),
      held_by: hirerId,
    })
    .eq("id", ctx.paymentId);
  if (error) return { data: null, error: { message: error.message } };
  notify({
    recipientId: ctx.contractTalentId,
    actorId: hirerId,
    type: "PAYMENT_SIMULATED_PAID",
    title: "Pembayaran diamankan",
    message: "Hirer telah mengamankan dana untuk kontrak Anda",
    link: `/contracts/${contractId}`,
    metadata: { contractId, paymentId: ctx.paymentId },
  }).catch(() => {});
  return { data: { paymentId: ctx.paymentId }, error: null };
}

export async function releasePayment(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ paymentId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadPaymentWithContract(
    supabase,
    contractId,
  );
  if (loadError || !ctx) return { data: null, error: loadError };

  if (ctx.contractHirerId !== hirerId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (ctx.contractStatus !== "ACTIVE") {
    return { data: null, error: { message: "Kontrak belum aktif" } };
  }
  if (ctx.paymentStatus !== "SIMULATED_PAID") {
    return {
      data: null,
      error: { message: "Payment belum disimulasikan" },
    };
  }

  const work = await getWorkByContractId(contractId);
  if (!work) {
    return { data: null, error: { message: "Work tidak ditemukan" } };
  }
  if (work.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Pekerjaan belum selesai" },
    };
  }
  if (!work.hirer_confirmed) {
    return {
      data: null,
      error: { message: "Pekerjaan belum dikonfirmasi hirer" },
    };
  }

  const { error: payError } = await supabase
    .from("payments")
    .update({
      status: "RELEASED",
      released_at: new Date().toISOString(),
      released_by: hirerId,
    })
    .eq("id", ctx.paymentId);
  if (payError) return { data: null, error: { message: payError.message } };
  notify({
    recipientId: ctx.contractTalentId,
    actorId: hirerId,
    type: "PAYMENT_RELEASED",
    title: "Dana dirilis",
    message: "Dana untuk kontrak Anda telah dirilis",
    link: `/contracts/${contractId}`,
    metadata: { contractId, paymentId: ctx.paymentId },
  }).catch(() => {});

  const { error: contractError } = await supabase
    .from("contracts")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", contractId);
  if (contractError) {
    return {
      data: null,
      error: {
        message: `Dana dirilis namun kontrak gagal diselesaikan: ${contractError.message}`,
      },
    };
  }

  return { data: { paymentId: ctx.paymentId }, error: null };
}
