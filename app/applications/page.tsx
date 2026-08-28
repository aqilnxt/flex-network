import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { listForTalent } from "@/modules/application/queries";

export default async function MyApplicationsPage() {
  const user = await requireRole("TALENT");
  const { data: applications } = await listForTalent(user.id);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Aplikasi Saya</h1>

      {(applications ?? []).length === 0 && (
        <p className="text-gray-500">Belum ada aplikasi.</p>
      )}

      <div className="flex flex-col gap-3">
        {(applications ?? []).map((a) => (
          <div key={a.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <Link
                href={`/opportunities/${a.opportunity?.id}`}
                className="font-semibold hover:underline"
              >
                {a.opportunity?.title ?? "-"}
              </Link>
              <p className="text-sm text-gray-600">
                {a.opportunity?.work_mode ?? "-"} · {a.opportunity?.location ?? "-"}
              </p>
            </div>
            <span className="text-xs bg-gray-100 rounded px-2 py-1">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
