import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { getDashboardStats } from "@/modules/admin/service";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  const stats = await getDashboardStats();

  const cards = [
    { label: "Users", value: stats.users },
    { label: "Opportunities", value: stats.opportunities },
    { label: "Applications", value: stats.applications },
    { label: "Contracts", value: stats.contracts },
    { label: "Pending Reports", value: stats.pendingReports },
  ];

  const links = [
    { label: "Users", href: "/admin/users" },
    { label: "Opportunities", href: "/admin/opportunities" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Audit", href: "/admin/audit" },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-sm text-ink-2">{c.label}</div>
            <div className="text-2xl font-bold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card p-4 text-center hover:bg-tint"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
