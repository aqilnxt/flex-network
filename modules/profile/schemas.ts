import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().max(30).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

const optionalUrl = z
  .string()
  .trim()
  .max(255)
  .refine((v) => v === "" || /^https?:\/\/.+\..+/.test(v), "URL tidak valid")
  .optional();

export const updateTalentProfileSchema = z.object({
  portfolioUrl: optionalUrl,
  cvUrl: optionalUrl,
  schoolName: z.string().trim().max(120).optional(),
  gradeLevel: z.string().trim().max(60).optional(),
});

export type UpdateTalentProfileInput = z.infer<typeof updateTalentProfileSchema>;
