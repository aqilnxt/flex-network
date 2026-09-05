import "server-only";
import { createHash, randomBytes } from "crypto";
import { admin } from "@/lib/supabase/admin";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Upsert token per consent (unique consent_id) — re-request mengganti token lama.
export async function issueConsentToken(consentId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const { error } = await admin.from("consent_tokens").upsert(
    {
      consent_id: consentId,
      token_hash: hashToken(raw),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      used_at: null,
    },
    { onConflict: "consent_id" },
  );
  if (error) throw new Error(`Gagal membuat token: ${error.message}`);
  return raw;
}
