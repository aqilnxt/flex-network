import Link from "next/link";
import { requireRole } from "@/modules/lib/auth";
import { getRecommendations } from "@/modules/matching/queries";
import {
  classificationBadgeClass,
  classificationLabel,
} from "@/modules/matching/badge";

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
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight">
          Rekomendasi Untuk Kamu
        </h1>
        <p className="mt-2 max-w-[60ch] text-ink-2">
          Diurutkan dari skor kecocokan tertinggi - 70% skill, 30% interest.
        </p>

        {items.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-line bg-tint-2 px-5 py-8 text-center text-ink-2">
            Belum ada rekomendasi. Lengkapi skill dan interest di profil kamu
            agar rekomendasi muncul.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {items.map((r) => (
            <Link
              key={r.opportunity.id}
              href={`/opportunities/${r.opportunity.id}`}
              className="card card-hover block p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold leading-snug">
                  {r.opportunity.title}
                </h2>
                <span
                  className={`badge ${classificationBadgeClass(r.classification)}`}
                >
                  {classificationLabel(r.classification)}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-2">
                {r.opportunity.work_mode ?? "-"} · {r.opportunity.location ?? "-"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-tint">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${r.finalMatchScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {r.finalMatchScore.toFixed(2)}%
                </span>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center gap-3">
            {page > 1 && (
              <Link
                href={`/matching/recommendations?page=${page - 1}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                ← Sebelumnya
              </Link>
            )}
            <span className="text-sm text-ink-2 tabular-nums">
              Halaman {page} dari {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/matching/recommendations?page=${page + 1}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Berikutnya →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
