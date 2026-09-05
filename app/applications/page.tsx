import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { listForTalent } from "@/modules/application/queries";
import { listForApplications } from "@/modules/meeting/queries";
import {
  listForApplications as listConsentsForApplications,
  getRequirementMap,
} from "@/modules/consent/queries";
import { listForApplications as listContractsForApplications } from "@/modules/contract/queries";
import {
  agreeContract,
  declineContract,
} from "@/modules/contract/actions";
import { listForContracts } from "@/modules/work/queries";
import { startWork, completeWork } from "@/modules/work/actions";
import { listForContracts as listPaymentsForContracts } from "@/modules/payment/queries";
import { listForContracts as listRatingsForContracts } from "@/modules/rating/queries";
import { submitRating } from "@/modules/rating/actions";
import { ConsentRequestForm } from "./consent-request-form";

export default async function MyApplicationsPage() {
  const user = await requireRole("TALENT");
  const { data: applications } = await listForTalent(user.id);

  const appIds = (applications ?? []).map((a) => a.id);
  const meetings = await listForApplications(appIds);
  const consents = await listConsentsForApplications(appIds);
  const requirements = await getRequirementMap(appIds);
  const contracts = await listContractsForApplications(appIds);
  const works = await listForContracts(
    [...contracts.values()].map((c) => c.id),
  );
  const payments = await listPaymentsForContracts(
    [...contracts.values()].map((c) => c.id),
  );
  const ratings = await listRatingsForContracts(
    [...contracts.values()].map((c) => c.id),
  );

  return (
    <div className="p-8">
      <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Aplikasi Saya</h1>

      {(applications ?? []).length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-tint-2 px-5 py-8 text-center text-ink-2">
          Belum ada aplikasi - temukan opportunity dan kirim lamaran pertamamu.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {(applications ?? []).map((a) => {
          const meeting = meetings.get(a.id);
          return (
            <div key={a.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/opportunities/${a.opportunity?.id}`}
                    className="font-semibold hover:underline"
                  >
                    {a.opportunity?.title ?? "-"}
                  </Link>
                  <p className="text-sm text-ink-2">
                    {a.opportunity?.work_mode ?? "-"} · {a.opportunity?.location ?? "-"}
                  </p>
                </div>
                <span className="badge">{a.status}</span>
              </div>

              {meeting && (
                <div className="mt-4 rounded-xl border border-line bg-tint-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Meeting: {meeting.meeting_date ?? "-"} {meeting.meeting_time ?? ""}
                    </span>
                    <span className="badge">
                      {meeting.status}
                    </span>
                  </div>
                  {meeting.meeting_method && (
                    <p className="text-sm text-ink-2">
                      Metode: {meeting.meeting_method}
                    </p>
                  )}
                  {meeting.meeting_link && (
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary break-all"
                    >
                      {meeting.meeting_link}
                    </a>
                  )}
                  {meeting.notes && (
                    <p className="text-sm text-ink-2 mt-1">{meeting.notes}</p>
                  )}
                </div>
              )}

              {(() => {
                const requirement = requirements.get(a.id);
                if (!requirement?.required || a.status !== "SELECTED") return null;
                const consent = consents.get(a.id);
                const consentStatus: string = consent?.status ?? "MISSING";
                return (
                <div className="mt-4 border-t border-line pt-4">
                    {consentStatus === "MISSING" &&
                      (meeting?.status === "COMPLETED" ? (
                        <ConsentRequestForm applicationId={a.id} />
                      ) : (
                        <p className="text-sm text-ink-2">
                          Consent wali diperlukan untuk melanjutkan - selesaikan meeting
                          terlebih dahulu.
                        </p>
                      ))}
                    {consent?.status === "PENDING" && (
                      <div className="text-sm">
                        <p className="font-medium">
                          Consent wali menunggu persetujuan wali.
                        </p>
                        <p className="text-ink-2">
                          Link persetujuan telah dikirim ke email wali yang
                          Anda daftarkan. Tautan berlaku 48 jam.
                        </p>
                      </div>
                    )}
                    {(consent?.status === "APPROVED" || consent?.status === "REJECTED") && (
                      <p className="text-sm">
                        Consent wali:{" "}
                        <span className="badge">
                          {consent.status}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const contract = contracts.get(a.id);
                if (!contract) return null;
                return (
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Kontrak: {contract.role_title ?? "-"}
                      </span>
                      <span className="badge">
                        {contract.status}
                      </span>
                    </div>
                    <Link href={`/contracts/${contract.id}`} className="text-sm text-primary">
                      Lihat kontrak
                    </Link>
                    {contract.status === "PENDING_AGREEMENT" && !contract.talent_agreed && (
                      <div className="flex gap-2 mt-2">
                        <form action={agreeContract.bind(null, contract.id)}>
                          <button className="btn-success px-3.5 py-2 text-sm">
                            Setujui Kontrak
                          </button>
                        </form>
                        <form action={declineContract.bind(null, contract.id)}>
                          <button className="btn-danger px-3.5 py-2 text-sm">
                            Tolak
                          </button>
                        </form>
                      </div>
                    )}
                    {contract.status === "ACTIVE" && (
                      <p className="text-sm text-[#15803D] mt-1">
                        Kontrak aktif - payment disiapkan.
                      </p>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const contract = contracts.get(a.id);
                if (!contract) return null;
                const work = works.get(contract.id);
                if (!work) return null;
                return (
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Work:</span>
                      <span className="badge">
                        {work.status}
                      </span>
                      {work.hirer_confirmed && (
                        <span className="text-xs bg-green-100 text-[#15803D] rounded px-2 py-1">
                          Dikonfirmasi HIRER
                        </span>
                      )}
                    </div>
                    {contract.status === "ACTIVE" && work.status === "NOT_STARTED" && (
                      <form action={startWork.bind(null, contract.id, "/applications")} className="mt-2">
                        <button className="btn-primary px-3.5 py-2 text-sm">
                          Mulai Kerja
                        </button>
                      </form>
                    )}
                    {contract.status === "ACTIVE" && work.status === "IN_PROGRESS" && (
                      <form action={completeWork.bind(null, contract.id, "/applications")} className="mt-2">
                        <button className="btn-success px-3.5 py-2 text-sm">
                          Tandai Selesai
                        </button>
                      </form>
                    )}
                    {work.status === "COMPLETED" && !work.hirer_confirmed && (
                      <p className="text-sm text-[#B45309] mt-1">Menunggu konfirmasi hirer.</p>
                    )}
                    {work.status === "COMPLETED" && work.hirer_confirmed && (
                      <p className="text-sm text-[#15803D] mt-1">
                        Pekerjaan selesai - dikonfirmasi hirer.
                      </p>
                    )}
                  </div>
                );
              })()}
              {(() => {
                const contract = contracts.get(a.id);
                if (!contract) return null;
                const payment = payments.get(contract.id);
                if (!payment) return null;
                return (
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Payment:</span>
                      <span className="badge">
                        {payment.status}
                      </span>
                      <span className="text-sm text-ink-2">
                        Rp {payment.amount ?? "-"}
                      </span>
                    </div>
                    {payment.status === "PENDING" && (
                      <p className="text-sm text-ink-2 mt-1">
                        Menunggu hirer membayar (simulasi).
                      </p>
                    )}
                    {payment.status === "SIMULATED_PAID" && (
                      <p className="text-sm text-primary mt-1">
                        Dana ditahan (escrow simulasi) - rilis setelah pekerjaan
                        dikonfirmasi hirer.
                      </p>
                    )}
                    {payment.status === "RELEASED" && (
                      <p className="text-sm text-[#15803D] mt-1">
                        Dana dirilis - kontrak selesai.
                      </p>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const contract = contracts.get(a.id);
                if (!contract) return null;
                const work = works.get(contract.id);
                if (!work) return null;
                const rows = ratings.get(contract.id) ?? [];
                const myRating = rows.find((r) => r.rater_id === user.id);
                const rateeRating = rows.find((r) => r.ratee_id === user.id);
                return (
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rating:</span>
                      {myRating ? (
                        <>
                          <span className="text-xs bg-green-100 text-[#15803D] rounded px-2 py-1">
                            {myRating.score}/5
                          </span>
                          {myRating.review_text && (
                            <span className="text-sm text-ink-2 truncate max-w-xs">
                              “{myRating.review_text}”
                            </span>
                          )}
                        </>
                      ) : work.status === "COMPLETED" ? (
                        <form
                          action={submitRating.bind(null, contract.id, "/applications")}
                          className="flex items-center gap-2"
                        >
                          <select
                            name="score"
                            required
                            defaultValue=""
                            className="px-2.5 py-1.5 text-sm"
                          >
                            <option value="" disabled>
                              Nilai
                            </option>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <option key={s} value={s}>
                                {s} - {["Buruk", "Kurang", "Cukup", "Baik", "Sangat baik"][s - 1]}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            name="reviewText"
                            maxLength={2000}
                            placeholder="Review (opsional)"
                            className="px-2.5 py-1.5 text-sm"
                          />
                          <button className="btn-primary px-3.5 py-2 text-sm">
                            Kirim Rating
                          </button>
                        </form>
                      ) : (
                        <span className="text-sm text-[#B45309]">
                          Rating tersedia setelah pekerjaan selesai.
                        </span>
                      )}
                    </div>
                    {rateeRating && (
                      <p className="text-sm text-ink-2 mt-1">
                        Rating dari HIRER: {rateeRating.score}/5
                        {rateeRating.review_text ? ` - “${rateeRating.review_text}”` : ""}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
