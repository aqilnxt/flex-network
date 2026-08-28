import { requireRole } from "@/modules/lib/auth";

export default async function TalentDashboardPage() {
  await requireRole("TALENT");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Talent Dashboard</h1>
      <p>Placeholder dashboard talent.</p>
    </div>
  );
}
