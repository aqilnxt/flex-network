import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { getRecommendations } from "@/modules/matching/queries";
import type { MatchClassification } from "@/modules/matching/service";

function classificationBadge(c: MatchClassification) {
  switch (c) {
    case "STRONG_MATCH":
      return "bg-green-100 text-green-700";
    case "GOOD_MATCH":
      return "bg-blue-100 text-blue-700";
    case "WEAK_MATCH":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("TALENT");
  const params = await searchParams;

  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = 12;

  const { items, total } = await getRecommendations(user.id, { page, limit });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Rekomendasi Untuk Kamu</h1>

      {items.length === 0 && (
        <p className="text-gray-500">Belum ada rekomendasi.</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((r) => (
          <Link
            key={r.opportunity.id}
            href={`/opportunities/${r.opportunity.id}`}
            className="border rounded p-4 hover:shadow"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{r.opportunity.title}</h2>
              <span
                className={`text-xs rounded px-2 py-1 ${classificationBadge(r.classification)}`}
              >
                {r.classification.replace("_MATCH", "")}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {r.opportunity.work_mode ?? "-"} · {r.opportunity.location ?? "-"}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${r.finalMatchScore}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {r.finalMatchScore.toFixed(2)}%
              </span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-6">
          {page > 1 && (
            <Link
              href={`/matching/recommendations?page=${page - 1}`}
              className="text-blue-600"
            >
              ← Sebelumnya
            </Link>
          )}
          <span className="text-sm text-gray-600">
            Halaman {page} dari {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/matching/recommendations?page=${page + 1}`}
              className="text-blue-600"
            >
              Berikutnya →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
