import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { getById } from "@/modules/contract/queries";
import { getByContractId } from "@/modules/work/queries";
import { startWork, completeWork, confirmWork } from "@/modules/work/actions";
import {
  proposeContract,
  agreeContract,
  declineContract,
} from "@/modules/contract/actions";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const contract = await getById(id);

  if (!contract) notFound();

  const isHirer = contract.hirer_id === user.id;
  const canAgree =
    contract.status === "PENDING_AGREEMENT" &&
    ((isHirer && !contract.hirer_agreed) ||
      (!isHirer && !contract.talent_agreed));
  const work = await getByContractId(id);

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/applications" className="text-blue-600 text-sm">
        ← Kembali
      </Link>
      <h1 className="text-2xl font-bold mt-2">
        {contract.role_title ?? "Kontrak"}
      </h1>
      <p className="text-sm text-gray-600">
        {contract.contract_number ?? "-"} ·{" "}
        <span className="text-xs bg-gray-100 rounded px-2 py-1">
          {contract.status}
        </span>
      </p>

      <div className="mt-4 border rounded p-4 flex flex-col gap-2 text-sm">
        <p>
          <span className="font-medium">Opportunity:</span>{" "}
          {contract.opportunity_title ?? "-"}
        </p>
        {contract.description && (
          <p>
            <span className="font-medium">Deskripsi:</span> {contract.description}
          </p>
        )}
        {contract.responsibilities && (
          <p>
            <span className="font-medium">Tanggung jawab:</span>{" "}
            {contract.responsibilities}
          </p>
        )}
        {contract.duration && (
          <p>
            <span className="font-medium">Durasi:</span> {contract.duration}
          </p>
        )}
        {contract.location && (
          <p>
            <span className="font-medium">Lokasi:</span> {contract.location}
          </p>
        )}
        {contract.compensation != null && (
          <p>
            <span className="font-medium">Kompensasi:</span> Rp {contract.compensation}
          </p>
        )}
        {contract.terms_conditions && (
          <p>
            <span className="font-medium">Syarat & Ketentuan:</span>{" "}
            {contract.terms_conditions}
          </p>
        )}
        <div className="flex gap-4 mt-2 text-sm">
          <span>
            Talent: {contract.talent_agreed ? "✔ setuju" : "belum"}
          </span>
          <span>Hirer: {contract.hirer_agreed ? "✔ setuju" : "belum"}</span>
        </div>
        {contract.status === "TERMINATED" && contract.decline_reason && (
          <p className="text-gray-600">Alasan: {contract.decline_reason}</p>
        )}
      </div>

      {work && (
        <div className="mt-3 border rounded p-4 text-sm flex flex-col gap-2">
          <p>
            <span className="font-medium">Work:</span>{" "}
            <span className="text-xs bg-gray-100 rounded px-2 py-1">
              {work.status}
            </span>
            {work.hirer_confirmed && (
              <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1 ml-2">
                Dikonfirmasi HIRER ✔
              </span>
            )}
          </p>
          {user.id === contract.talent_id &&
            contract.status === "ACTIVE" &&
            work.status === "NOT_STARTED" && (
              <form
                action={startWork.bind(null, contract.id, `/contracts/${contract.id}`)}
                className="mt-2"
              >
                <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
                  Mulai Kerja
                </button>
              </form>
            )}
          {user.id === contract.talent_id &&
            contract.status === "ACTIVE" &&
            work.status === "IN_PROGRESS" && (
              <form
                action={completeWork.bind(null, contract.id, `/contracts/${contract.id}`)}
                className="mt-2"
              >
                <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                  Tandai Selesai
                </button>
              </form>
            )}
          {isHirer &&
            contract.status === "ACTIVE" &&
            work.status === "COMPLETED" &&
            !work.hirer_confirmed && (
              <form
                action={confirmWork.bind(null, contract.id, `/contracts/${contract.id}`)}
                className="mt-2"
              >
                <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                  Konfirmasi Selesai
                </button>
              </form>
            )}
          {work.status === "COMPLETED" && !work.hirer_confirmed && (
            <p className="text-sm text-amber-600">Menunggu konfirmasi hirer.</p>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {isHirer && contract.status === "DRAFT" && (
          <>
            <Link
              href={`/contracts/${contract.id}/edit`}
              className="bg-gray-200 rounded px-3 py-1 text-sm"
            >
              Edit
            </Link>
            <form action={proposeContract.bind(null, contract.id)}>
              <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
                Ajukan ke Talent
              </button>
            </form>
          </>
        )}
        {contract.status === "PENDING_AGREEMENT" && (
          <>
            {canAgree ? (
              <form action={agreeContract.bind(null, contract.id)}>
                <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                  Setujui Kontrak
                </button>
              </form>
            ) : null}
            <form action={declineContract.bind(null, contract.id)}>
              <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">
                Tolak Kontrak
              </button>
            </form>
          </>
        )}
        {contract.status === "ACTIVE" && (
          <p className="text-sm text-green-700">
            Kontrak aktif — payment & work otomatis disiapkan.
          </p>
        )}
      </div>
    </div>
  );
}
