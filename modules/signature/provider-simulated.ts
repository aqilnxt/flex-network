import { appendSignatureBlock, generateContractDocument } from "./document-generator";
import { downloadPrivateDoc, uploadPrivateDoc } from "@/lib/supabase/storage";
import type { DocumentContractData, PriorSignatures, SignatureProvider } from "./types";

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(bytes).digest("hex");
}

export const simulatedProvider: SignatureProvider = {
  id: "simulated",
  async requestSignature(contractId, data) {
    const { bytes, hash } = await generateContractDocument(data);
    const path = `contracts/${contractId}/unsigned.pdf`;
    await uploadPrivateDoc(path, bytes);
    return { externalId: `SIM-${hash.slice(0, 12)}`, docUrl: path };
  },
  async signDocument(contractId, signedBy, signerName, priorSignatures) {
    const unsignedPath = `contracts/${contractId}/unsigned.pdf`;
    const existing = await downloadPrivateDoc(unsignedPath);
    const signedAt = new Date().toISOString();
    const hash = await hashBytes(existing);
    const merged: PriorSignatures = {
      talent:
        signedBy === "talent"
          ? { name: signerName, at: signedAt }
          : priorSignatures.talent,
      hirer:
        signedBy === "hirer"
          ? { name: signerName, at: signedAt }
          : priorSignatures.hirer,
    };
    const signedBytes = await appendSignatureBlock(existing, hash, merged);
    const signedPath = `contracts/${contractId}/signed.pdf`;
    await uploadPrivateDoc(signedPath, signedBytes);
    const finalHash = await hashBytes(signedBytes);
    return { docUrl: signedPath, hash: finalHash, signedAt };
  },
  verifyWebhook() {
    return true; // simulated: tidak ada webhook eksternal
  },
};
