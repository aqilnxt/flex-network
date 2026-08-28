import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/modules/lib/auth";
import { listForOpportunity } from "@/modules/application/queries";
import {
  reviewApplication,
  selectApplication,
  rejectApplication,
} from "@/modules/application/actions";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("HIRER");
  const { id } = await params;

  const { applications, maxTalent, selectedCount, error } = await listForOpportunity(
    id,
    user.id,
  );

  if (error) notFound();

  const isFull = selectedCount >= maxTalent;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/hirer/opportunities" className="text-blue-600 text-sm">
        ← Kembali
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">Pelamar</h1>
      <p className="text-sm text-gray-600 mb-4">
        Terpilih {selectedCount} / {maxTalent}
        {isFull && <span className="text-amber-600"> — kuota penuh</span>}
      </p>

      {(applications ?? []).length === 0 && (
        <p className="text-gray-500">Belum ada pelamar.</p>
      )}

      <div className="flex flex-col gap-3">
        {applications.map((a) => (
          <div key={a.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{a.talent?.full_name ?? "Talent"}</p>
              <span className="text-xs bg-gray-100 rounded px-2 py-1">{a.status}</span>
            </div>
            {a.message && (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{a.message}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              {a.status === "APPLIED" && (
                <>
                  <form action={reviewApplication.bind(null, a.id)}>
                    <button className="bg-blue-600 text-white rounded px-3 py-1">
                      Review
                    </button>
                  </form>
                  <form action={rejectApplication.bind(null, a.id)}>
                    <button className="bg-red-600 text-white rounded px-3 py-1">
                      Reject
                    </button>
                  </form>
                </>
              )}
              {a.status === "UNDER_REVIEW" && (
                <>
                  <form action={selectApplication.bind(null, a.id)}>
                    <button
                      disabled={isFull}
                      className="bg-green-600 text-white rounded px-3 py-1 disabled:opacity-50"
                    >
                      Select
                    </button>
                  </form>
                  <form action={rejectApplication.bind(null, a.id)}>
                    <button className="bg-red-600 text-white rounded px-3 py-1">
                      Reject
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
