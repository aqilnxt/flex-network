import { z } from "zod";

export const workStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

export type WorkStatus = z.infer<typeof workStatusSchema>;
