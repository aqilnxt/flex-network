import { requireRole } from "@/modules/lib/auth";
import { listReports } from "@/modules/report/service";
import { resolveReportAction, rejectReportAction } from "@/modules/report/actions";

export default async function AdminReportsPage() {
  await requireRole("ADMIN");
  const reports = await listReports("SUBMITTED");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Submitted Reports</h1>
      {reports.length === 0 ? (
        <p className="text-ink-2">No submitted reports found.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-ink">
                  Reporter: {report.reporter_id}
                </div>
                <p className="text-ink">{report.reason}</p>
                <div className="text-xs text-ink-2/60 space-x-2">
                  {report.target_user_id && <span>User: {report.target_user_id}</span>}
                  {report.target_opportunity_id && <span>Opportunity: {report.target_opportunity_id}</span>}
                  {report.target_application_id && <span>Application: {report.target_application_id}</span>}
                  <span>• {new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <form action={async () => {
                  "use server";
                  await resolveReportAction(report.id);
                }}>
                  <button type="submit" className="btn-success px-3 py-1 text-xs">
                    Resolve
                  </button>
                </form>
                <form action={async () => {
                  "use server";
                  await rejectReportAction(report.id);
                }}>
                  <button type="submit" className="btn-danger px-3 py-1 text-xs">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
