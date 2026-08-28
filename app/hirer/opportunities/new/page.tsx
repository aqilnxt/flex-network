import { requireRole } from "@/modules/lib/auth";
import { create } from "@/modules/opportunity/actions";
import { OpportunityForm } from "@/app/hirer/opportunities/opportunity-form";

export default async function NewOpportunityPage() {
  await requireRole("HIRER");

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Buat Opportunity</h1>
      <OpportunityForm action={create} submitLabel="Simpan" />
    </div>
  );
}
