import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { listForHirer } from "@/modules/application/queries";
import { listForHirer as listContracts } from "@/modules/contract/queries";
import {
  DashboardShell,
  EmptyState,
  StatCard,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/dashboard-ui";

export default async function HirerDashboardPage() {
  const user = await requireRole("HIRER");

  const [{ data: applications }, contracts] = await Promise.all([
    listForHirer(user.id),
    listContracts(user.id),
  ]);

  const activeApplications = (applications ?? []).filter(
    (a) => a.status === "APPLIED" || a.status === "UNDER_REVIEW",
  ).length;
  const activeContracts = contracts.filter(
    (c) => c.status === "ACTIVE" || c.status === "PENDING_SIGNATURE",
  ).length;
  const completedContracts = contracts.filter(
    (c) => c.status === "COMPLETED",
  ).length;

  const opportunityIds = new Set(
    (applications ?? []).map((a) => a.opportunity?.id).filter(Boolean),
  );
  const recent = (applications ?? []).slice(0, 5);

  return (
    <DashboardShell
      title="Dashboard Hirer"
      action={
        <Link
          href="/hirer/opportunities/new"
          className="btn-primary h-10 px-4 text-sm"
        >
          Buat Opportunity
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Opportunities"
          value={opportunityIds.size}
          href="/opportunities"
        />
        <StatCard
          label="Active Applications"
          value={activeApplications}
          href="/opportunities"
        />
        <StatCard
          label="Active Contracts"
          value={activeContracts}
          href="/applications"
        />
        <StatCard
          label="Completed Contracts"
          value={completedContracts}
          href="/applications"
        />
      </div>

      <section>
        <h2 className="text-lg font-bold tracking-tight">
          Lamaran Terbaru di Opportunity Kamu
        </h2>
        <div className="card mt-4 divide-y divide-line">
          {recent.length === 0 && (
            <div className="p-4">
              <EmptyState text="Belum ada lamaran masuk. Publish opportunity pertamamu." />
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
