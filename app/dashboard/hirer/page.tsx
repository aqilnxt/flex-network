import { requireRole } from "@/modules/lib/auth";

export default async function HirerDashboardPage() {
  await requireRole("HIRER");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard Hirer</h1>
      <p className="mt-2 max-w-[60ch] text-ink-2">
        Placeholder dashboard hirer.
      </p>
    </div>
  );
}
