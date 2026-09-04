export type SignatureProviderId = "simulated" | "privy";

export type DocumentContractData = {
  contractNumber: string;
  roleTitle: string | null;
  description: string | null;
  responsibilities: string | null;
  duration: string | null;
  location: string | null;
  compensation: number | null;
  termsConditions: string | null;
  talentName: string;
  hirerName: string;
};

export type ServiceResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

export type SignatureProvider = {
  id: SignatureProviderId;
  requestSignature(
    contractId: string,
    data: DocumentContractData,
    talentEmail: string,
    hirerEmail: string,
  ): Promise<{ externalId: string | null; docUrl: string }>;
  signDocument(
    contractId: string,
    existingDocBytes: Uint8Array,
    signedBy: "talent" | "hirer",
    signerName: string,
  ): Promise<{ docUrl: string; hash: string; signedAt: string }>;
  verifyWebhook(headers: Record<string, string>, rawBody: string): boolean;
};
