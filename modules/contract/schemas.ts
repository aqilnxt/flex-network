import { z } from "zod";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .optional()
    .or(z.literal(""));

export const createContractSchema = z.object({
  applicationId: z.string().uuid("Application tidak valid"),
  roleTitle: z
    .string()
    .trim()
    .min(3, "Judul peran minimal 3 karakter")
    .max(120, "Judul peran maksimal 120 karakter"),
  description: optionalText(2000, "Deskripsi"),
  responsibilities: optionalText(2000, "Tanggung jawab"),
  duration: optionalText(100, "Durasi"),
  location: optionalText(120, "Lokasi"),
  compensation: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int("Kompensasi tidak valid")
        .min(0, "Kompensasi tidak boleh negatif")
        .max(2_000_000_000, "Kompensasi terlalu besar"),
    ])
    .optional(),
  termsConditions: optionalText(2000, "Syarat & ketentuan"),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema
  .omit({ applicationId: true })
  .partial();

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
