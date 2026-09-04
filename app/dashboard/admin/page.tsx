import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
      <p className="mt-2 max-w-[60ch] text-ink-2">
        Placeholder dashboard admin.
      </p>
      <nav className="mt-6 flex flex-col gap-2">
        <Link
          href="/admin/opportunities"
          className="font-medium text-primary hover:underline underline-offset-2"
        >
          Moderasi Opportunity
        </Link>
      </nav>
    </div>
  );
}
