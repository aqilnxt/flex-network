import { listVerifiedByTalentId } from "@/modules/work_history/queries";

export default async function WorkHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const history = await listVerifiedByTalentId(id);

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight">Work History</h1>

        {history.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-line bg-tint-2 px-5 py-8 text-center text-ink-2">
            Belum ada riwayat kerja yang terverifikasi.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {history.map((item) => (
              <div key={item.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold leading-snug">
                    {item.title ?? "Untitled"}
                  </h2>
                  <span className="text-sm text-ink-2">
                    {item.verified_at
                      ? new Date(item.verified_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-2">
                  {item.duration ?? "-"} ·{" "}
                  {item.compensation
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(item.compensation)
                    : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
