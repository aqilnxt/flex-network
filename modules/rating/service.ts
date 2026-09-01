import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getByContractId as getWorkByContractId } from "@/modules/work/queries";
import { upsertVerifiedHistory } from "@/modules/work_history/service";
import { ratingSchema, type RatingInput, type RatingType } from "./schemas";

type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

function deriveRatingRole(
  raterId: string,
  talentId: string,
  hirerId: string,
): { rateeId: string; ratingType: RatingType } | null {
  if (raterId === talentId) {
    return { rateeId: hirerId, ratingType: "TALENT_RATES_HIRER" };
  }
  if (raterId === hirerId) {
    return { rateeId: talentId, ratingType: "HIRER_RATES_TALENT" };
  }
  return null;
}

export async function submitRating(
  raterId: string,
  input: RatingInput,
): Promise<ServiceResult<{ ratingId: string }>> {
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: { message: "Input rating tidak valid" } };
  }

  const supabase = await createSupabaseServerClient();

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(
      "id, talent_id, hirer_id, opportunity_id, role_title, duration, compensation, status",
    )
    .eq("id", parsed.data.contractId)
    .maybeSingle();
  if (contractError) {
    return { data: null, error: { message: contractError.message } };
  }
  if (!contract) {
    return { data: null, error: { message: "Kontrak tidak ditemukan" } };
  }

  const row = contract as unknown as {
    id: string;
    talent_id: string;
    hirer_id: string;
    opportunity_id: string;
    role_title: string | null;
    duration: string | null;
    compensation: number | null;
    status: string;
  };

  const derived = deriveRatingRole(raterId, row.talent_id, row.hirer_id);
  if (!derived) {
    return { data: null, error: { message: "Not owner" } };
  }

  const work = await getWorkByContractId(row.id);
  if (!work) {
    return { data: null, error: { message: "Work tidak ditemukan" } };
  }
  if (work.status !== "COMPLETED") {
    return {
      data: null,
      error: { message: "Rating tersedia setelah pekerjaan selesai" },
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ratings")
    .insert({
      work_id: work.id,
      contract_id: row.id,
      rater_id: raterId,
      ratee_id: derived.rateeId,
      rating_type: derived.ratingType,
      score: parsed.data.score,
      review_text: parsed.data.reviewText ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        data: null,
        error: { message: "Kamu sudah memberi rating untuk pekerjaan ini" },
      };
    }
    return { data: null, error: { message: insertError.message } };
  }

  const ratingRow = inserted as unknown as { id: string };

  // Trigger Verified Work History: kedua arah rating untuk work ini lengkap.
  const { data: existingTypes } = await supabase
    .from("ratings")
    .select("rating_type")
    .eq("work_id", work.id);

  const types = new Set(
    (existingTypes as unknown as { rating_type: string }[] | null)?.map(
      (r) => r.rating_type,
    ) ?? [],
  );
  if (types.has("TALENT_RATES_HIRER") && types.has("HIRER_RATES_TALENT")) {
    await upsertVerifiedHistory(
      {
        id: row.id,
        talent_id: row.talent_id,
        opportunity_id: row.opportunity_id,
        role_title: row.role_title,
        duration: row.duration,
        compensation: row.compensation,
      },
      raterId,
    );
  }

  return {
    data: { ratingId: ratingRow.id },
    error: null,
  };
}
