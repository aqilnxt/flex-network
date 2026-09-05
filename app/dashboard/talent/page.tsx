import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { listForTalent } from "@/modules/application/queries";
import { listForTalent as listContracts } from "@/modules/contract/queries";
import { listVerifiedByTalentId } from "@/modules/work_history/queries";
import {
  DashboardShell,
  EmptyState,
  StatCard,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/dashboard-ui";

export default async function TalentDashboardPage() {
  const user = await requireRole("TALENT");

  const [{ data: applications }, contracts, workHistory] = await Promise.all([
    listForTalent(user.id),
    listContracts(user.id),
    listVerifiedByTalentId(user.id),
  ]);

  const activeContracts = contracts.filter(
    (c) => c.status === "ACTIVE" || c.status === "PENDING_SIGNATURE",
  ).length;
  const completedWork = contracts.filter((c) => c.status === "COMPLETED").length;
  const recent = (applications ?? []).slice(0, 5);

  return (
    <DashboardShell
      title="Dashboard Talent"
      action={
        <Link
          href="/opportunities"
          className="btn-primary h-10 px-4 text-sm"
        >
          Cari Opportunity
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={applications?.length ?? 0}
          href="/applications"
        />
        <StatCard
          label="Active Contracts"
          value={activeContracts}
          href="/applications"
        />
        <StatCard
          label="Completed Work"
          value={completedWork}
          href="/work-history"
        />
        <StatCard
          label="Verified Work History"
          value={workHistory.length}
          href="/work-history"
        />
      </div>

      <section>
        <h2 className="text-lg font-bold tracking-tight">Aktivitas Terakhir</h2>
        <div className="card mt-4 divide-y divide-line">
          {recent.length === 0 && (
            <div className="p-4">
              <EmptyState text="Belum ada aplikasi. Mulai cari opportunity pertamamu." />
            </div>
          )}
          {recent.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">
                  {app.opportunity?.title ?? "Opportunity"}
                </p>
                <p className="mt-0.5 text-sm text-ink-2">
                  {formatDate(app.applied_at)}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
