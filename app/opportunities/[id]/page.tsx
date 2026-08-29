import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { getOpportunityById } from "@/modules/opportunity/queries";
import { getApplicationStatus } from "@/modules/application/queries";
import { getMatchScoresForTalent } from "@/modules/matching/queries";
import {
  classificationBadgeClass,
  classificationLabel,
} from "@/modules/matching/badge";
import { ApplyForm } from "./apply-form";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const { data, error } = await getOpportunityById(id);

  if (error || !data) notFound();

  const application =
    user.role === "TALENT" ? await getApplicationStatus(user.id, id) : null;

  const match =
    user.role === "TALENT"
      ? ((await getMatchScoresForTalent(user.id, [id])).get(id) ?? null)
      : null;

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/opportunities" className="text-blue-600 text-sm">
        ← Kembali
      </Link>

      <h1 className="text-3xl font-bold mt-2">{data.title}</h1>

      <p className="text-sm text-gray-600 mt-2">
        {data.company_name ?? data.hirer?.full_name ?? "Perusahaan"}
      </p>

      {match && (
        <div className="mt-4 border rounded p-4 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Kecocokan dengan profilmu</span>
            <span
              className={`text-xs rounded px-2 py-1 ${classificationBadgeClass(match.classification)}`}
            >
              {classificationLabel(match.classification)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${match.finalMatchScore}%` }}
              />
            </div>
            <span className="text-sm font-semibold">
              {match.finalMatchScore.toFixed(2)}%
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Skills {match.skillMatchScore.toFixed(0)}% · Interests{" "}
            {match.interestMatchScore.toFixed(0)}% (70/30)
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4 text-sm">
        <span className="bg-gray-100 rounded px-2 py-1">{data.opportunity_type}</span>
        <span className="bg-gray-100 rounded px-2 py-1">{data.work_mode}</span>
        {data.location && <span className="bg-gray-100 rounded px-2 py-1">{data.location}</span>}
        {data.compensation != null && (
          <span className="bg-gray-100 rounded px-2 py-1">
            Rp {data.compensation} · {data.compensation_type}
          </span>
        )}
      </div>

      <p className="mt-6 whitespace-pre-wrap">{data.description}</p>

      {data.requirements && (
        <>
          <h2 className="font-semibold mt-6">Requirements</h2>
          <p className="whitespace-pre-wrap">{data.requirements}</p>
        </>
      )}

      {data.responsibilities && (
        <>
          <h2 className="font-semibold mt-6">Responsibilities</h2>
          <p className="whitespace-pre-wrap">{data.responsibilities}</p>
        </>
      )}

      {data.skills && data.skills.length > 0 && (
        <>
          <h2 className="font-semibold mt-6">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s: { skill: { id: string; name: string } | null }) => (
              <span key={s.skill?.id} className="bg-blue-50 rounded px-2 py-1 text-sm">
                {s.skill?.name}
              </span>
            ))}
          </div>
        </>
      )}

      {data.interests && data.interests.length > 0 && (
        <>
          <h2 className="font-semibold mt-6">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {data.interests.map((s: { interest: { id: string; name: string } | null }) => (
              <span key={s.interest?.id} className="bg-emerald-50 rounded px-2 py-1 text-sm">
                {s.interest?.name}
              </span>
            ))}
          </div>
        </>
      )}

      {data.application_deadline && (
        <p className="mt-6 text-sm text-gray-500">
          Deadline aplikasi:{" "}
          {new Date(data.application_deadline).toLocaleDateString()}
        </p>
      )}

      {user.role === "TALENT" && (
        <ApplyForm opportunityId={id} existingStatus={application?.status ?? null} />
      )}
    </div>
  );
}
