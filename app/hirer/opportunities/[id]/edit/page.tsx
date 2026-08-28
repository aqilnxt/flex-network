import { notFound } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { update } from "@/modules/opportunity/actions";
import { OpportunityForm } from "@/app/hirer/opportunities/opportunity-form";

function toDatetimeLocal(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return d.toISOString().slice(0, 16);
}

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("HIRER");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("hirer_id", user.id)
    .single();

  if (!opportunity) notFound();

  const { data: skills } = await supabase
    .from("opportunity_skills")
    .select("skill_id")
    .eq("opportunity_id", id);

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select("interest_id")
    .eq("opportunity_id", id);

  const skillIds = (skills ?? []).map((s) => s.skill_id).join(", ");
  const interestIds = (interests ?? []).map((s) => s.interest_id).join(", ");

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Opportunity</h1>
      <OpportunityForm
        action={update.bind(null, id)}
        submitLabel="Simpan Perubahan"
        defaultValues={{
          title: opportunity.title,
          description: opportunity.description ?? "",
          opportunityType: opportunity.opportunity_type ?? undefined,
          location: opportunity.location ?? "",
          workMode: opportunity.work_mode ?? "ONSITE",
          startDate: opportunity.start_date ?? "",
          endDate: opportunity.end_date ?? "",
          workingHours: opportunity.working_hours ?? "",
          duration: opportunity.duration ?? "",
          compensation: opportunity.compensation,
          compensationType: opportunity.compensation_type ?? "NEGOTIABLE",
          requirements: opportunity.requirements ?? "",
          responsibilities: opportunity.responsibilities ?? "",
          otherTerms: opportunity.other_terms ?? "",
          maxTalent: opportunity.max_talent,
          applicationDeadline: toDatetimeLocal(opportunity.application_deadline),
          requiresConsent: opportunity.requires_consent,
          cvRequirement: opportunity.cv_requirement,
          portfolioRequirement: opportunity.portfolio_requirement,
          interviewRequirement: opportunity.interview_requirement,
          meetingMethod: opportunity.meeting_method ?? "",
          skillIds,
          interestIds,
        }}
      />
    </div>
  );
}
