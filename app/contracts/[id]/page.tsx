import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { getById } from "@/modules/contract/queries";
import { getByContractId } from "@/modules/work/queries";
import { startWork, completeWork, confirmWork } from "@/modules/work/actions";
import { getByContractId as getPaymentByContractId } from "@/modules/payment/queries";
import {
  simulatePayment,
  releasePayment,
} from "@/modules/payment/actions";
import {
  proposeContract,
  agreeContract,
  declineContract,
} from "@/modules/contract/actions";
import { listByContractId } from "@/modules/rating/queries";
import { submitRating } from "@/modules/rating/actions";
import { getSignatureInfo } from "@/modules/signature/service";
import { SignaturePanel } from "./signature-panel";

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ signature_error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { signature_error: signatureError } = await searchParams;
  const contract = await getById(id);

  if (!contract) notFound();

  const isHirer = contract.hirer_id === user.id;
  const canAgree =
    contract.status === "PENDING_AGREEMENT" &&
    ((isHirer && !contract.hirer_agreed) ||
      (!isHirer && !contract.talent_agreed));
  const work = await getByContractId(id);
  const payment = await getPaymentByContractId(id);
  const ratings = await listByContractId(id);
  const myRating = ratings.find((r) => r.rater_id === user.id);
  const rateeRating = ratings.find((r) => r.ratee_id === user.id);
  const isTalent = user.id === contract.talent_id;
  const signatureInfo = await getSignatureInfo(id, user.id);
  const signature = signatureInfo.data;

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

      {signature && (
        <SignaturePanel
          info={signature}
          contractId={contract.id}
          viewerId={user.id}
          talentId={contract.talent_id}
          hirerId={contract.hirer_id}
          contractStatus={contract.status}
          actionError={signatureError}
        />
      )}

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

      {payment && (
        <div className="mt-3 border rounded p-4 text-sm flex flex-col gap-2">
          <p>
            <span className="font-medium">Payment:</span>{" "}
            <span className="text-xs bg-gray-100 rounded px-2 py-1">
              {payment.status}
            </span>
            <span className="ml-2">Rp {payment.amount ?? "-"}</span>
          </p>
          {payment.held_at && (
            <p className="text-gray-600">
              Ditahan: {new Date(payment.held_at).toLocaleString("id-ID")}
            </p>
          )}
          {payment.released_at && (
            <p className="text-gray-600">
              Dirilis: {new Date(payment.released_at).toLocaleString("id-ID")}
            </p>
          )}
          {isHirer &&
            contract.status === "ACTIVE" &&
            payment.status === "PENDING" && (
              <form
                action={simulatePayment.bind(null, contract.id, `/contracts/${contract.id}`)}
                className="mt-2"
              >
                <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">
                  Bayar (Simulasi)
                </button>
              </form>
            )}
          {isHirer &&
            contract.status === "ACTIVE" &&
            payment.status === "SIMULATED_PAID" &&
            work?.status === "COMPLETED" &&
            work.hirer_confirmed && (
              <form
                action={releasePayment.bind(null, contract.id, `/contracts/${contract.id}`)}
                className="mt-2"
              >
                <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                  Rilis Dana (Simulasi)
                </button>
              </form>
            )}
          {payment.status === "SIMULATED_PAID" &&
            !(work?.status === "COMPLETED" && work.hirer_confirmed) && (
              <p className="text-sm text-amber-600">
                Dana ditahan - rilis setelah pekerjaan selesai &amp; dikonfirmasi
                hirer.
              </p>
            )}
          {payment.status === "RELEASED" && (
            <p className="text-sm text-green-700">
              Dana dirilis (simulasi) - kontrak selesai.
            </p>
          )}
        </div>
      )}

      <div className="mt-3 border rounded p-4 text-sm flex flex-col gap-2">
        <p>
          <span className="font-medium">Rating:</span>{" "}
          {myRating ? (
            <>
              <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-1">
                {myRating.score}/5
              </span>
              {myRating.review_text && (
                <span className="ml-2 text-gray-600">
                  “{myRating.review_text}”
                </span>
              )}
            </>
          ) : work?.status === "COMPLETED" ? (
            <form
              action={submitRating.bind(null, contract.id, `/contracts/${contract.id}`)}
              className="flex flex-col gap-2 mt-2"
            >
              <select
                name="score"
                required
                defaultValue=""
                className="border rounded px-2 py-1 text-sm max-w-xs"
              >
                <option value="" disabled>
                  Pilih nilai
                </option>
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>
                    {s} - {["Buruk", "Kurang", "Cukup", "Baik", "Sangat baik"][s - 1]}
                  </option>
                ))}
              </select>
              <textarea
                name="reviewText"
                maxLength={2000}
                placeholder="Review (opsional)"
                className="border rounded px-2 py-1 text-sm max-w-xs"
              />
              <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm max-w-fit">
                Kirim Rating
              </button>
            </form>
          ) : (
            <span className="text-amber-600">
              Rating tersedia setelah pekerjaan selesai.
            </span>
          )}
        </p>
        {myRating && (
          <p className="text-gray-500 text-xs">
            Dirating: {new Date(myRating.created_at).toLocaleString("id-ID")}
          </p>
        )}
        {rateeRating && (
          <p className="text-gray-600">
            Rating dari {isTalent ? "HIRER" : "TALENT"}:{" "}
            <span className="text-xs bg-gray-100 rounded px-2 py-1">
              {rateeRating.score}/5
            </span>
            {rateeRating.review_text ? ` - “${rateeRating.review_text}”` : ""}
          </p>
        )}
      </div>

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
            Kontrak aktif - payment & work otomatis disiapkan.
          </p>
        )}
      </div>
    </div>
  );
}
