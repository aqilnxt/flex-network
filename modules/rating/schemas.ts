import { z } from "zod";

export const ratingTypeSchema = z.enum([
  "TALENT_RATES_HIRER",
  "HIRER_RATES_TALENT",
]);

export const ratingSchema = z.object({
  contractId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  reviewText: z.string().trim().max(2000).optional(),
});

export type RatingType = z.infer<typeof ratingTypeSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
