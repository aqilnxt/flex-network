import { z } from "zod";

export const scheduleMeetingSchema = z
  .object({
    applicationId: z.string().uuid(),
    meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
    meetingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam tidak valid"),
    meetingLink: z
      .string()
      .trim()
      .url("Link tidak valid")
      .max(500)
      .optional()
      .or(z.literal("")),
    meetingMethod: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (v) => new Date(`${v.meetingDate}T${v.meetingTime}:00`).getTime() > Date.now(),
    {
      message: "Tanggal & jam meeting harus di masa depan",
      path: ["meetingDate"],
    },
  );

export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;
