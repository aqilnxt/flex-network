import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Placeholder dashboard admin.</p>
      <nav className="mt-6 flex flex-col gap-2">
        <Link
          href="/admin/opportunities"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Moderasi Opportunity
        </Link>
      </nav>
    </div>
  );
}
