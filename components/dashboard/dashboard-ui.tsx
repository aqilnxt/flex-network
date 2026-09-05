import type { ReactNode } from "react";
import Link from "next/link";

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="card card-hover flex flex-col gap-1 p-5">
      <p className="text-2xl font-bold tabular-nums tracking-tight text-ink">
        {value}
      </p>
      <p className="text-sm text-ink-2">{label}</p>
    </Link>
  );
}

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-tint text-ink-2",
  UNDER_REVIEW: "bg-[#FEF3C7] text-[#B45309]",
  SELECTED: "bg-[#EAFBF1] text-[#15803D]",
  REJECTED: "bg-[#FEF2F2] text-[#B91C1C]",
  ACTIVE: "bg-[#EAFBF1] text-[#15803D]",
  PENDING: "bg-[#FEF3C7] text-[#B45309]",
  PENDING_REVIEW: "bg-[#FEF3C7] text-[#B45309]",
  PUBLISHED: "bg-[#EAFBF1] text-[#15803D]",
  CLOSED: "bg-tint-2 text-ink-2",
  DRAFT: "bg-tint-2 text-ink-2",
  SUBMITTED: "bg-[#FEF3C7] text-[#B45309]",
  COMPLETED: "bg-[#EAFBF1] text-[#15803D]",
  VERIFIED: "bg-[#EAFBF1] text-[#15803D]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-tint text-ink-2"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function DashboardShell({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {action}
      </div>
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-tint-2 px-4 py-8 text-center text-sm text-ink-2">
      {text}
    </div>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
