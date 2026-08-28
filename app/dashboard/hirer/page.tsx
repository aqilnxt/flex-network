import { requireRole } from "@/modules/lib/auth";

export default async function HirerDashboardPage() {
  await requireRole("HIRER");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Hirer Dashboard</h1>
      <p>Placeholder dashboard hirer.</p>
    </div>
  );
}
