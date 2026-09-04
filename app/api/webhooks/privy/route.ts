import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { getSignatureProvider } from "@/modules/signature";

export const runtime = "nodejs";

// ponytail: Phase 2 — parse event PrivyID (cari contract by external_signature_id,
// update kolom sign pihak, trigger logika ACTIVE = service.signDocument). Route ini
// hanya utk privy (404 utk provider lain); simulated tak pernah lewat gate. Stub privy
// verifyWebhook=false → Phase 2 wajib implement HMAC utk audit PRIVY_WEBHOOK_RECEIVED.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const provider = getSignatureProvider();
  if (provider.id !== "privy") {
    return new NextResponse(null, { status: 404 });
  }
  const headers = Object.fromEntries(req.headers.entries());
  if (!provider.verifyWebhook(headers, rawBody)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  // logAudit() memakai server client (cookie session, actor_type ADMIN) — tidak
  // cocok utk webhook tanpa sesi; tulis audit SYSTEM via admin client, kolom sama.
  await admin.from("audit_logs").insert({
    actor_id: null,
    actor_type: "SYSTEM",
    action: "PRIVY_WEBHOOK_RECEIVED",
    resource_type: "webhook",
    metadata: { body: rawBody.slice(0, 500) },
  });
  return NextResponse.json({ ok: true });
}
