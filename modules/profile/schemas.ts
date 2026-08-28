import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().max(30).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
