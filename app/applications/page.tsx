import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { listForTalent } from "@/modules/application/queries";
import { listForApplications } from "@/modules/meeting/queries";

export default async function MyApplicationsPage() {
  const user = await requireRole("TALENT");
  const { data: applications } = await listForTalent(user.id);

  const meetings = await listForApplications(
    (applications ?? []).map((a) => a.id),
  );

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
            </div>
          );
        })}
      </div>
    </div>
  );
}
