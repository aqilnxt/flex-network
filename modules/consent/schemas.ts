import { z } from "zod";

export const createConsentSchema = z.object({
  applicationId: z.string().uuid("Application tidak valid"),
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
