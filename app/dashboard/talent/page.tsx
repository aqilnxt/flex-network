import { requireRole } from "@/modules/lib/auth";

export default async function TalentDashboardPage() {
  await requireRole("TALENT");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard Talent</h1>
      <p className="mt-2 max-w-[60ch] text-ink-2">
        Placeholder dashboard talent.
      </p>
    </div>
  );
}
