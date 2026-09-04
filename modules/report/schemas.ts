import { z } from "zod";

export const reportSchema = z.object({
  reason: z.string().min(10, "Alasan minimal 10 karakter").max(1000),
  targetUserId: z.string().uuid().optional(),
  targetOpportunityId: z.string().uuid().optional(),
  targetApplicationId: z.string().uuid().optional(),
}).refine(d => !!(d.targetUserId || d.targetOpportunityId || d.targetApplicationId), {
  message: "Pilih minimal satu target laporan",
});

export type ReportInput = z.infer<typeof reportSchema>;
