import { z } from "zod";

export const paymentStatusSchema = z.enum([
  "PENDING",
  "SIMULATED_PAID",
  "RELEASED",
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
