import type { DocumentContractData, SignatureProvider } from "./types";

export const privyProvider: SignatureProvider = {
  id: "privy",
  async requestSignature() {
    throw new Error("PrivyID provider belum dikonfigurasi (Phase 2). Set SIGNATURE_MODE=simulated.");
  },
  async signDocument() {
    throw new Error("PrivyID provider belum dikonfigurasi (Phase 2).");
  },
  verifyWebhook() {
    return false;
  },
};
export type { DocumentContractData };
