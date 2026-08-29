import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { listForTalent } from "@/modules/application/queries";
import { listForApplications } from "@/modules/meeting/queries";
import {
  listForApplications as listConsentsForApplications,
  getRequirementMap,
} from "@/modules/consent/queries";
import { approveConsent, rejectConsent } from "@/modules/consent/actions";
import { ConsentRequestForm } from "./consent-request-form";

export default async function MyApplicationsPage() {
  const user = await requireRole("TALENT");
  const { data: applications } = await listForTalent(user.id);

  const appIds = (applications ?? []).map((a) => a.id);
  const meetings = await listForApplications(appIds);
  const consents = await listConsentsForApplications(appIds);
  const requirements = await getRequirementMap(appIds);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Aplikasi Saya</h1>

      {(applications ?? []).length === 0 && (
        <p className="text-gray-500">Belum ada aplikasi.</p>
      )}

      <div className="flex flex-col gap-3">
        {(applications ?? []).map((a) => {
          const meeting = meetings.get(a.id);
          return (
            <div key={a.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/opportunities/${a.opportunity?.id}`}
                    className="font-semibold hover:underline"
                  >
                    {a.opportunity?.title ?? "-"}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {a.opportunity?.work_mode ?? "-"} · {a.opportunity?.location ?? "-"}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 rounded px-2 py-1">{a.status}</span>
              </div>

              {meeting && (
                <div className="mt-3 border rounded p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Meeting: {meeting.meeting_date ?? "-"} {meeting.meeting_time ?? ""}
                    </span>
                    <span className="text-xs bg-gray-100 rounded px-2 py-1">
                      {meeting.status}
                    </span>
                  </div>
                  {meeting.meeting_method && (
                    <p className="text-sm text-gray-600">
                      Metode: {meeting.meeting_method}
                    </p>
                  )}
                  {meeting.meeting_link && (
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 break-all"
                    >
                      {meeting.meeting_link}
                    </a>
                  )}
                  {meeting.notes && (
                    <p className="text-sm text-gray-600 mt-1">{meeting.notes}</p>
                  )}
                </div>
              )}

              {(() => {
                const requirement = requirements.get(a.id);
                if (!requirement?.required || a.status !== "SELECTED") return null;
                const consent = consents.get(a.id);
                const consentStatus: string = consent?.status ?? "MISSING";
                return (
                  <div className="mt-3 border-t pt-3">
                    {consentStatus === "MISSING" &&
                      (meeting?.status === "COMPLETED" ? (
                        <ConsentRequestForm applicationId={a.id} />
                      ) : (
                        <p className="text-sm text-gray-600">
                          Consent wali diperlukan untuk melanjutkan — selesaikan meeting
                          terlebih dahulu.
                        </p>
                      ))}
                    {consent?.status === "PENDING" && (
                      <div className="text-sm">
                        <p className="font-medium">
                          Consent wali menunggu persetujuan (simulasi).
                        </p>
                        <p className="text-gray-600">
                          Dengan menyetujui, Anda menyatakan persetujuan wali atas
                          partisipasi ini. Tidak ada data wali yang dikumpulkan.
                        </p>
                        <div className="flex gap-2 mt-2">
                          <form action={approveConsent.bind(null, consent.id)}>
                            <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                              Setujui (Simulasi)
                            </button>
                          </form>
                          <form action={rejectConsent.bind(null, consent.id)}>
                            <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">
                              Tolak
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                    {(consent?.status === "APPROVED" || consent?.status === "REJECTED") && (
                      <p className="text-sm">
                        Consent wali:{" "}
                        <span className="text-xs bg-gray-100 rounded px-2 py-1">
                          {consent.status}
                        </span>
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
  );
}
