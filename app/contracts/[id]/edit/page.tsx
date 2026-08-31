import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import { getById } from "@/modules/contract/queries";
import { ContractEditForm } from "./contract-edit-form";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("HIRER");
  const { id } = await params;
  const contract = await getById(id);

  if (!contract || contract.hirer_id !== user.id) notFound();
  if (contract.status !== "DRAFT") notFound();

  return (
    <div className="p-8 max-w-2xl">
      <Link href={`/contracts/${contract.id}`} className="text-blue-600 text-sm">
        ← Kembali
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Edit Kontrak</h1>
      <ContractEditForm
        contractId={contract.id}
        initial={{
          roleTitle: contract.role_title ?? "",
          description: contract.description ?? "",
          responsibilities: contract.responsibilities ?? "",
          duration: contract.duration ?? "",
          location: contract.location ?? "",
          compensation: contract.compensation != null ? String(contract.compensation) : "",
          termsConditions: contract.terms_conditions ?? "",
        }}
      />
    </div>
  );
}
