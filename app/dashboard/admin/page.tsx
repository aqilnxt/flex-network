import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { getDashboardStats } from "@/modules/admin/service";
import { listReports } from "@/modules/report/queries";
import {
  DashboardShell,
  EmptyState,
  StatCard,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/dashboard-ui";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const [stats, reports] = await Promise.all([
    getDashboardStats(),
    listReports("SUBMITTED"),
  ]);
  const recent = reports.slice(0, 5);

  return (
    <DashboardShell
      title="Dashboard Admin"
      action={
        <Link
          href="/admin/opportunities"
          className="btn-primary h-10 px-4 text-sm"
        >
          Moderasi Opportunity
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.users} href="/admin/users" />
        <StatCard
          label="Opportunities"
          value={stats.opportunities}
          href="/admin/opportunities"
        />
        <StatCard
          label="Applications"
          value={stats.applications}
          href="/admin/audit"
        />
        <StatCard
          label="Reports Pending"
          value={stats.pendingReports}
          href="/admin/reports"
        />
      </div>

      <section>
        <h2 className="text-lg font-bold tracking-tight">Report Belum Selesai</h2>
        <div className="card mt-4 divide-y divide-line">
          {recent.length === 0 && (
            <div className="p-4">
              <EmptyState text="Tidak ada report pending. Semua bersih." />
            </div>
          )}
          {recent.map((report) => (
            <Link
              key={report.id}
              href="/admin/reports"
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-tint"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">
                  {report.reason}
                </p>
                <p className="mt-0.5 text-sm text-ink-2">
                  {report.reporter?.full_name ?? "Anonim"} ·{" "}
                  {formatDate(report.created_at)}
                </p>
              </div>
              <StatusBadge status={report.status} />
            </Link>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
