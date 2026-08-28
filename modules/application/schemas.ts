import { z } from "zod";

export const createApplicationSchema = z.object({
  opportunityId: z.string().uuid(),
  message: z.string().trim().max(1000).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
