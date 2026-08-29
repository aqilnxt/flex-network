import Link from "next/link";
import { requireUser } from "@/modules/lib/auth";
import { listPublished } from "@/modules/opportunity/queries";
import { OPPORTUNITY_TYPES, WORK_MODES } from "@/modules/opportunity/schemas";
import { getMatchScoresForTalent } from "@/modules/matching/queries";
import {
  classificationBadgeClass,
  classificationLabel,
} from "@/modules/matching/badge";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const search = typeof params.search === "string" ? params.search : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const workMode = typeof params.workMode === "string" ? params.workMode : undefined;

  const { data, error } = await listPublished({ search, type, workMode });

  const opportunities = data ?? [];
  const matchScores =
    user.role === "TALENT" && opportunities.length > 0
      ? await getMatchScoresForTalent(
          user.id,
          opportunities.map((o) => o.id),
        )
      : null;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Opportunities</h1>

      <form method="get" className="flex flex-wrap gap-2 mb-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Cari judul / deskripsi"
          className="border rounded px-3 py-1"
        />
        <select name="type" defaultValue={type ?? ""} className="border rounded px-3 py-1">
          <option value="">Semua tipe</option>
          {OPPORTUNITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="workMode" defaultValue={workMode ?? ""} className="border rounded px-3 py-1">
          <option value="">Semua mode</option>
          {WORK_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-1">
          Filter
        </button>
      </form>

      {error && <p className="text-red-500">Gagal memuat opportunity.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((o) => {
          const match = matchScores?.get(o.id) ?? null;
          return (
            <Link
              key={o.id}
              href={`/opportunities/${o.id}`}
              className="border rounded p-4 hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{o.title}</h2>
                {match && (
                  <span
                    className={`text-xs rounded px-2 py-1 whitespace-nowrap ${classificationBadgeClass(match.classification)}`}
                  >
                    {classificationLabel(match.classification)} ·{" "}
                    {match.finalMatchScore.toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{o.work_mode}</p>
              <p className="text-sm text-gray-600">{o.location ?? "-"}</p>
              <p className="text-sm font-medium">
                {o.compensation != null ? `Rp ${o.compensation}` : "—"} · {o.compensation_type}
              </p>
              {o.application_deadline && (
                <p className="text-xs text-gray-500">
                  Deadline: {new Date(o.application_deadline).toLocaleDateString()}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
