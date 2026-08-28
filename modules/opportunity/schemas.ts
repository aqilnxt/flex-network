import { z } from "zod";

export const OPPORTUNITY_TYPES = [
  "INTERNSHIP",
  "PKL",
  "CONTRACT",
  "FREELANCE",
  "TEMPORARY_WORK",
  "DAILY_WORK",
  "EVENT_WORK",
  "PART_TIME",
] as const;

export const WORK_MODES = ["ONSITE", "REMOTE", "HYBRID"] as const;
export const COMPENSATION_TYPES = ["PAID", "UNPAID", "NEGOTIABLE"] as const;

export const createOpportunitySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(10),
  opportunityType: z.enum(OPPORTUNITY_TYPES),
  location: z.string().trim().max(200).optional(),
  workMode: z.enum(WORK_MODES).default("ONSITE"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  workingHours: z.string().trim().max(200).optional(),
  duration: z.string().trim().max(200).optional(),
  compensation: z.coerce.number().int().min(0).optional(),
  compensationType: z.enum(COMPENSATION_TYPES).default("NEGOTIABLE"),
  requirements: z.string().trim().optional(),
  responsibilities: z.string().trim().optional(),
  otherTerms: z.string().trim().optional(),
  maxTalent: z.coerce.number().int().min(1).default(1),
  applicationDeadline: z.string().min(1),
  requiresConsent: z.coerce.boolean().default(false),
  cvRequirement: z.coerce.boolean().default(false),
  portfolioRequirement: z.coerce.boolean().default(false),
  interviewRequirement: z.coerce.boolean().default(false),
  meetingMethod: z.string().trim().optional(),
  skillIds: z.array(z.string().uuid()).default([]),
  interestIds: z.array(z.string().uuid()).default([]),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export const moderateSchema = z.object({
  action: z.enum(["APPROVE_PUBLISH", "REQUEST_CHANGES", "CLOSE", "DELETE"]),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type ModerateInput = z.infer<typeof moderateSchema>;
