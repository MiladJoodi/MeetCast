import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug is required.")
  .max(64, "Slug is too long.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  maxConcurrentParticipants: z.coerce
    .number()
    .int()
    .min(1, "Must be at least 1.")
    .max(50, "Cannot exceed 50."),
  maxRoomDurationMinutes: z
    .union([
      z.literal(""),
      z.coerce.number().int().min(5, "Must be at least 5 minutes.").max(240),
    ])
    .transform((value) => (value === "" ? null : value)),
  priceAmount: z.coerce
    .number()
    .int("Price must be a whole number.")
    .min(0, "Price cannot be negative.")
    .max(100_000_000_000, "Price is too large."),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .default("IRR")
    .refine((value) => value === "IRR", "Only IRR is supported."),
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export const updatePlanSchema = createPlanSchema.extend({
  planId: z.string().uuid("Invalid plan."),
});

export const assignPlanSchema = z.object({
  userId: z.string().uuid("Invalid user."),
  planId: z.string().uuid("Invalid plan."),
});

export const planIdSchema = z.object({
  planId: z.string().uuid("Invalid plan."),
});
