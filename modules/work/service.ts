import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type WorkWithContract = {
  workId: string;
  workStatus: string;
  hirerConfirmed: boolean;
  contractTalentId: string;
  contractHirerId: string;
  contractStatus: string;
};

async function loadWorkWithContract(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  contractId: string,
): Promise<ServiceResult<WorkWithContract>> {
  const { data, error } = await supabase
    .from("works")
    .select(
      "id, status, hirer_confirmed, contract:contracts(talent_id, hirer_id, status)",
    )
    .eq("contract_id", contractId)
    .maybeSingle();

  if (error) return { data: null, error: { message: error.message } };
  if (!data) {
    return { data: null, error: { message: "Work tidak ditemukan" } };
  }

  const row = data as unknown as {
    id: string;
    status: string;
    hirer_confirmed: boolean;
    contract: { talent_id: string; hirer_id: string; status: string } | null;
  };

  if (!row.contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }

  return {
    data: {
      workId: row.id,
      workStatus: row.status,
      hirerConfirmed: row.hirer_confirmed,
      contractTalentId: row.contract.talent_id,
      contractHirerId: row.contract.hirer_id,
      contractStatus: row.contract.status,
    },
    error: null,
  };
}

export async function startWork(
  talentId: string,
  contractId: string,
): Promise<ServiceResult<{ workId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadWorkWithContract(
    supabase,
    contractId,
  );
  if (loadError || !ctx) return { data: null, error: loadError };

  if (ctx.contractTalentId !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (ctx.contractStatus !== "ACTIVE") {
    return { data: null, error: { message: "Kontrak belum aktif" } };
  }
  if (ctx.workStatus !== "NOT_STARTED") {
    return { data: null, error: { message: "Work sudah dimulai" } };
  }

  const { error } = await supabase
    .from("works")
    .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
    .eq("id", ctx.workId);
  if (error) return { data: null, error: { message: error.message } };
  return { data: { workId: ctx.workId }, error: null };
}

export async function completeWork(
  talentId: string,
  contractId: string,
): Promise<ServiceResult<{ workId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadWorkWithContract(
    supabase,
    contractId,
  );
  if (loadError || !ctx) return { data: null, error: loadError };

  if (ctx.contractTalentId !== talentId) {
    return { data: null, error: { message: "Not owner" } };
  }
  if (ctx.contractStatus !== "ACTIVE") {
    return { data: null, error: { message: "Kontrak belum aktif" } };
  }
  if (ctx.workStatus !== "IN_PROGRESS") {
    return { data: null, error: { message: "Work belum dimulai" } };
  }

  const { error } = await supabase
    .from("works")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", ctx.workId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { workId: ctx.workId }, error: null };
}

export async function confirmCompletion(
  hirerId: string,
  contractId: string,
): Promise<ServiceResult<{ workId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data: ctx, error: loadError } = await loadWorkWithContract(
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
  if (ctx.workStatus !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Pekerjaan belum ditandai selesai oleh talent" },
    };
  }
  if (ctx.hirerConfirmed) {
    return { data: null, error: { message: "Sudah dikonfirmasi" } };
  }

  const { error } = await supabase
    .from("works")
    .update({
      hirer_confirmed: true,
      hirer_confirmed_at: new Date().toISOString(),
      confirmed_by: hirerId,
    })
    .eq("id", ctx.workId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: { workId: ctx.workId }, error: null };
}
