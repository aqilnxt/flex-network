import { requireRole } from "@/modules/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderate } from "@/modules/opportunity/actions";

export default async function AdminOpportunitiesPage() {
  await requireRole("ADMIN");
  const supabase = await createSupabaseServerClient();

  const { data: queue } = await supabase
    .from("opportunities")
    .select("*, hirer:hirer_id(full_name)")
    .eq("status", "PENDING_REVIEW")
    .order("submitted_for_review_at", { ascending: true });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Moderasi Opportunity</h1>

      {(queue ?? []).length === 0 && (
        <p className="text-ink-2">Tidak ada opportunity menunggu review.</p>
      )}

      <div className="flex flex-col gap-4">
        {(queue ?? []).map((o) => (
          <div key={o.id} className="card p-4">
            <h2 className="font-semibold">{o.title}</h2>
            <p className="text-sm text-ink-2">Hirer: {o.hirer?.full_name ?? "-"}</p>
            <p className="text-sm mt-2 whitespace-pre-wrap">
              {o.description?.slice(0, 300)}
            </p>

            <form action={moderate.bind(null, o.id)} className="flex flex-col gap-2 mt-4">
              <select name="action" className="border border-line rounded-xl px-3 py-2">
                <option value="APPROVE_PUBLISH">Approve (PUBLISHED)</option>
                <option value="REQUEST_CHANGES">Request Changes (DRAFT)</option>
                <option value="DELETE">Delete</option>
              </select>
              <input
                name="notes"
                placeholder="Catatan moderasi (opsional)"
                className="border border-line rounded-xl px-3 py-2"
              />
              <button className="btn-primary px-4 py-2 self-start">
                Terapkan
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
