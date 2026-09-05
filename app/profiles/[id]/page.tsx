import { notFound } from "next/navigation";
import { requireUser } from "@/modules/lib/auth";
import { getPublicTalentProfile } from "@/modules/profile/queries";
import { EmptyState } from "@/components/dashboard/dashboard-ui";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const profile = await getPublicTalentProfile(id);
  if (!profile) notFound();

  const isTalent = profile.role === "TALENT";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {profile.fullName ?? "Profil"}
        </h1>
        {profile.bio && <p className="max-w-[65ch] text-ink-2">{profile.bio}</p>}
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
          {profile.location && <span>{profile.location}</span>}
          {isTalent && profile.schoolName && (
            <span className="badge">{profile.schoolName}</span>
          )}
          {isTalent && profile.gradeLevel && (
            <span className="badge">{profile.gradeLevel}</span>
          )}
        </div>
      </header>

      {isTalent && (
        <>
          {(profile.portfolioUrl || profile.cvUrl) && (
            <section className="mt-8">
              <h2 className="text-lg font-bold tracking-tight">Portfolio</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {profile.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline underline-offset-2"
                  >
                    Lihat Portfolio
                  </a>
                )}
                {profile.cvUrl && (
                  <a
                    href={profile.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline underline-offset-2"
                  >
                    CV
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-lg font-bold tracking-tight">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.length === 0 && (
                <EmptyState text="Belum ada skill terdaftar." />
              )}
              {profile.skills.map((skill) => (
                <span key={skill} className="badge">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold tracking-tight">
              Verified Work History
            </h2>
            <div className="card mt-3 divide-y divide-line">
              {profile.workHistory.length === 0 && (
                <div className="p-4">
                  <EmptyState text="Belum ada riwayat kerja terverifikasi." />
                </div>
              )}
              {profile.workHistory.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {w.title ?? "Pekerjaan"}
                    </p>
                    {w.duration && (
                      <p className="mt-0.5 text-sm text-ink-2">{w.duration}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[#EAFBF1] px-2.5 py-1 text-xs font-semibold text-[#15803D]">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
