import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import { listForOpportunity } from "@/modules/application/queries";
import {
  reviewApplication,
  selectApplication,
  rejectApplication,
} from "@/modules/application/actions";
import { listForApplications } from "@/modules/meeting/queries";
import { completeMeeting, cancelMeeting } from "@/modules/meeting/actions";
import { ScheduleMeetingForm } from "./schedule-meeting-form";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("HIRER");
  const { id } = await params;

  const { applications, maxTalent, selectedCount, error } = await listForOpportunity(
    id,
    user.id,
  );

  if (error) notFound();

  const meetings = await listForApplications(
    (applications ?? []).map((a) => a.id),
  );

  const isFull = selectedCount >= maxTalent;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/hirer/opportunities" className="text-blue-600 text-sm">
        ← Kembali
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">Pelamar</h1>
      <p className="text-sm text-gray-600 mb-4">
        Terpilih {selectedCount} / {maxTalent}
        {isFull && <span className="text-amber-600"> — kuota penuh</span>}
      </p>

      {(applications ?? []).length === 0 && (
        <p className="text-gray-500">Belum ada pelamar.</p>
      )}

      <div className="flex flex-col gap-3">
        {applications.map((a) => (
          <div key={a.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{a.talent?.full_name ?? "Talent"}</p>
              <span className="text-xs bg-gray-100 rounded px-2 py-1">{a.status}</span>
            </div>
            {a.message && (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{a.message}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              {a.status === "APPLIED" && (
                <>
                  <form action={reviewApplication.bind(null, a.id)}>
                    <button className="bg-blue-600 text-white rounded px-3 py-1">
                      Review
                    </button>
                  </form>
                  <form action={rejectApplication.bind(null, a.id)}>
                    <button className="bg-red-600 text-white rounded px-3 py-1">
                      Reject
                    </button>
                  </form>
                </>
              )}
              {a.status === "UNDER_REVIEW" && (
                <>
                  <form action={selectApplication.bind(null, a.id)}>
                    <button
                      disabled={isFull}
                      className="bg-green-600 text-white rounded px-3 py-1 disabled:opacity-50"
                    >
                      Select
                    </button>
                  </form>
                  <form action={rejectApplication.bind(null, a.id)}>
                    <button className="bg-red-600 text-white rounded px-3 py-1">
                      Reject
                    </button>
                  </form>
                </>
              )}
            </div>

            {(() => {
              const meeting = meetings.get(a.id);
              if (a.status !== "SELECTED" && !meeting) return null;
              return (
                <div className="mt-3 border-t pt-3">
                  {!meeting && a.status === "SELECTED" && (
                    <ScheduleMeetingForm applicationId={a.id} opportunityId={id} />
                  )}
                  {meeting && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Meeting: {meeting.meeting_date ?? "-"} {meeting.meeting_time ?? ""}
                        </span>
                        <span className="text-xs bg-gray-100 rounded px-2 py-1">
                          {meeting.status}
                        </span>
                      </div>
                      {meeting.meeting_method && (
                        <p className="text-sm text-gray-600">Metode: {meeting.meeting_method}</p>
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
                      {meeting.status === "SCHEDULED" && (
                        <div className="flex gap-2 mt-2">
                          <form action={completeMeeting.bind(null, meeting.id, id)}>
                            <button className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                              Tandai Selesai
                            </button>
                          </form>
                          <form action={cancelMeeting.bind(null, meeting.id, id)}>
                            <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">
                              Batalkan
                            </button>
                          </form>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
