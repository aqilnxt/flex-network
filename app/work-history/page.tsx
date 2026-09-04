import { requireRole } from "@/modules/lib/auth";
import { listByTalentId } from "@/modules/work_history/queries";

export default async function WorkHistoryPage() {
  const user = await requireRole("TALENT");
  const history = await listByTalentId(user.id);

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    VERIFIED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Kerja Kamu</h1>
        
        {history.length === 0 ? (
          <p className="mt-6 text-ink-2">Belum ada riwayat kerja.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {history.map((item) => (
              <div key={item.id} className="card p-6 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.verification_status]}`}>
                    {item.verification_status}
                  </span>
                </div>
                
                <div className="flex gap-4 text-sm text-ink-2">
                  <span>Durasi: {item.duration || "-"}</span>
                  <span>Kompensasi: {item.compensation ? `Rp ${item.compensation.toLocaleString("id-ID")}` : "-"}</span>
                </div>

                {item.verified_at && (
                  <p className="text-xs text-ink-3">
                    Terverifikasi pada: {new Date(item.verified_at).toLocaleDateString("id-ID")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
