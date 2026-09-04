import { z } from "zod";

export const signatureContractSchema = z.object({
  contractId: z.string().uuid(),
});

export type SignatureContractInput = z.infer<typeof signatureContractSchema>;
