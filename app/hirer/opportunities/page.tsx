import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitReview, close, deleteOpportunity } from "@/modules/opportunity/actions";

export default async function HirerOpportunitiesPage() {
  const user = await requireRole("HIRER");
  const supabase = await createSupabaseServerClient();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("hirer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Opportunity Saya</h1>
        <Link
          href="/hirer/opportunities/new"
          className="bg-blue-600 text-white rounded px-4 py-2"
        >
          + Buat
        </Link>
      </div>

      {(opportunities ?? []).length === 0 && (
        <p className="text-gray-500">Belum ada opportunity.</p>
      )}

      <div className="flex flex-col gap-3">
        {(opportunities ?? []).map((o) => (
          <div key={o.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <Link
                href={`/hirer/opportunities/${o.id}/edit`}
                className="font-semibold hover:underline"
              >
                {o.title}
              </Link>
              <span className="text-xs bg-gray-100 rounded px-2 py-1">{o.status}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              <Link
                href={`/hirer/opportunities/${o.id}/applications`}
                className="bg-gray-200 rounded px-3 py-1"
              >
                Lihat Applicant
              </Link>
              {o.status === "DRAFT" && (
                <form action={submitReview.bind(null, o.id)}>
                  <button className="bg-green-600 text-white rounded px-3 py-1">
                    Submit Review
                  </button>
                </form>
              )}
              {o.status === "PUBLISHED" && (
                <form action={close.bind(null, o.id)}>
                  <button className="bg-amber-600 text-white rounded px-3 py-1">
                    Close
                  </button>
                </form>
              )}
              {(o.status === "DRAFT" || o.status === "PENDING_REVIEW") && (
                <Link
                  href={`/hirer/opportunities/${o.id}/edit`}
                  className="bg-gray-200 rounded px-3 py-1"
                >
                  Edit
                </Link>
              )}
              {o.status === "DRAFT" && (
                <form action={deleteOpportunity.bind(null, o.id)}>
                  <button className="bg-red-600 text-white rounded px-3 py-1">
                    Hapus
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
