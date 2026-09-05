import type { ReactNode } from "react";
import { resolveConsentAction } from "@/modules/consent/actions";
import { getConsentPageData } from "@/modules/consent/queries";

export default async function ConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { token } = await params;
  const { done, error } = await searchParams;

  if (done) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">Persetujuan Tercatat</h1>
        <p className="mt-2 text-sm text-ink-2">
          Terima kasih. Keputusan Anda telah disimpan dan talent telah diberi tahu.
        </p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">Link Tidak Dapat Diproses</h1>
        <p className="mt-2 text-sm text-ink-2">{error}</p>
        <p className="mt-1 text-sm text-ink-2">
          Minta talent mengirim ulang link persetujuan bila diperlukan.
        </p>
      </Shell>
    );
  }

  const data = await getConsentPageData(token);
  if (!data) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">Link Tidak Valid atau Kedaluwarsa</h1>
        <p className="mt-2 text-sm text-ink-2">
          Link persetujuan ini sudah digunakan, kedaluwarsa, atau tidak dikenal.
          Minta talent mengirim ulang link persetujuan.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold tracking-tight">Persetujuan Wali</h1>
      <p className="mt-1 text-sm text-ink-2">
        {data.talentName} meminta persetujuan Anda untuk opportunity berikut:
      </p>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Role</dt>
          <dd className="font-medium">{data.roleTitle ?? "-"}</dd>
        </div>
        {data.organization && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Organisasi</dt>
            <dd className="font-medium">{data.organization}</dd>
          </div>
        )}
        {data.compensation != null && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Kompensasi</dt>
            <dd className="font-medium">Rp {data.compensation}</dd>
          </div>
        )}
      </dl>
      <div className="mt-6 flex gap-3">
        <form action={resolveConsentAction.bind(null, token, "APPROVED")}>
          <button className="btn-primary h-11 px-5 text-sm">Setujui</button>
        </form>
        <form action={resolveConsentAction.bind(null, token, "REJECTED")}>
          <button className="btn-danger h-11 px-5 text-sm">Tolak</button>
        </form>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="card p-6">{children}</div>
    </div>
  );
}
