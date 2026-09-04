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
    <div className="p-8">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
        <p className="mt-2 text-ink-2">
          Temukan pengalaman kerja nyata yang cocok dengan skill dan interest
          kamu.
        </p>

        <form method="get" className="mt-6 flex flex-wrap items-center gap-2.5">
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari judul / deskripsi"
            aria-label="Cari judul atau deskripsi"
            className="py-2"
          />
          <select name="type" defaultValue={type ?? ""} aria-label="Tipe opportunity" className="py-2">
            <option value="">Semua tipe</option>
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select name="workMode" defaultValue={workMode ?? ""} aria-label="Mode kerja" className="py-2">
            <option value="">Semua mode</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn-primary h-10 px-5 text-[15px] disabled:opacity-55"
          >
            Filter
          </button>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]"
          >
            Gagal memuat opportunity.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((o) => {
            const match = matchScores?.get(o.id) ?? null;
            return (
              <Link
                key={o.id}
                href={`/opportunities/${o.id}`}
                className="card card-hover flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-snug">{o.title}</h2>
                  {match && (
                    <span
                      className={`badge ${classificationBadgeClass(match.classification)}`}
                    >
                      {classificationLabel(match.classification)} ·{" "}
                      {match.finalMatchScore.toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-ink-2">
                  {o.work_mode} · {o.location ?? "-"}
                </p>
                <p className="mt-2 text-[15px] font-semibold tabular-nums">
                  {o.compensation != null
                    ? `Rp ${o.compensation.toLocaleString("id-ID")}`
                    : "-"}{" "}
                  <span className="font-normal text-ink-2">
                    · {o.compensation_type}
                  </span>
                </p>
                {o.application_deadline && (
                  <p className="mt-2 text-xs text-ink-2">
                    Deadline:{" "}
                    {new Date(o.application_deadline).toLocaleDateString(
                      "id-ID",
                    )}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {opportunities.length === 0 && !error && (
          <p className="mt-8 rounded-xl border border-dashed border-line bg-tint-2 px-5 py-8 text-center text-ink-2">
            Belum ada opportunity yang cocok dengan pencarian atau filter.
          </p>
        )}
      </div>
    </div>
  );
}
