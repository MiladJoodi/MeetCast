import { z } from "zod";

import {
  GUEST_NAME_MAX_LENGTH,
  getMaxRoomDurationMs,
  MAX_ROOM_ALLOWED_EMAILS,
  MAX_ROOM_PARTICIPANTS,
  MIN_ROOM_DURATION_MS,
  MIN_ROOM_PARTICIPANTS,
  ROOM_TITLE_MAX_LENGTH,
} from "@/lib/rooms/constants";
import { normalizeEmail } from "@/lib/auth/validation";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(
    ROOM_TITLE_MAX_LENGTH,
    `Title must be at most ${ROOM_TITLE_MAX_LENGTH} characters.`,
  );

const maxParticipantsSchema = z.coerce
  .number()
  .int("Maximum participants must be a whole number.")
  .min(
    MIN_ROOM_PARTICIPANTS,
    `Maximum participants must be at least ${MIN_ROOM_PARTICIPANTS}.`,
  )
  .max(
    MAX_ROOM_PARTICIPANTS,
    `Maximum participants cannot exceed ${MAX_ROOM_PARTICIPANTS}.`,
  );

const instantSchema = z.coerce.date();

const visibilitySchema = z.enum(["public", "private"]);

function refineScheduleWindow(
  data: { startTime: Date; endTime: Date },
  ctx: z.RefinementCtx,
  maxDurationMs: number = getMaxRoomDurationMs(),
) {
  if (data.endTime.getTime() <= data.startTime.getTime()) {
    ctx.addIssue({
      code: "custom",
      message: "End time must be after start time.",
      path: ["endTime"],
    });
    return;
  }

  const duration = data.endTime.getTime() - data.startTime.getTime();

  if (duration < MIN_ROOM_DURATION_MS) {
    ctx.addIssue({
      code: "custom",
      message: `Meeting must be at least ${MIN_ROOM_DURATION_MS / 60_000} minutes.`,
      path: ["endTime"],
    });
  }

  const maxDuration = Math.min(getMaxRoomDurationMs(), maxDurationMs);
  if (duration > maxDuration) {
    ctx.addIssue({
      code: "custom",
      message: `Meeting cannot exceed ${maxDuration / 60_000} minutes.`,
      path: ["endTime"],
    });
  }
}

function refineVisibilityEmails(
  data: { visibility: "public" | "private"; allowedEmails: string[] },
  ctx: z.RefinementCtx,
) {
  if (data.visibility === "private" && data.allowedEmails.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Add at least one email for a private meeting.",
      path: ["allowedEmails"],
    });
  }
}

const singleEmailSchema = z
  .string()
  .trim()
  .min(1)
  .email("Enter a valid email address.")
  .transform(normalizeEmail);

/** Parse allowlist from a textarea / comma-separated field. */
export function parseAllowedEmailsInput(raw: string): string[] {
  const parts = raw
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const emails: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const parsed = singleEmailSchema.safeParse(part);
    if (!parsed.success) {
      continue;
    }
    if (seen.has(parsed.data)) continue;
    seen.add(parsed.data);
    emails.push(parsed.data);
    if (emails.length >= MAX_ROOM_ALLOWED_EMAILS) break;
  }
  return emails;
}

const allowedEmailsSchema = z
  .string()
  .optional()
  .transform((value) => parseAllowedEmailsInput(value ?? ""))
  .refine(
    (emails) => emails.length <= MAX_ROOM_ALLOWED_EMAILS,
    `At most ${MAX_ROOM_ALLOWED_EMAILS} emails.`,
  );

export function createRoomSchemaWithMaxDuration(maxDurationMs: number) {
  return z
    .object({
      title: titleSchema,
      maxParticipants: maxParticipantsSchema,
      startTime: instantSchema,
      endTime: instantSchema,
      visibility: visibilitySchema.default("public"),
      allowedEmails: allowedEmailsSchema,
    })
    .superRefine((data, ctx) => {
      refineScheduleWindow(data, ctx, maxDurationMs);
      refineVisibilityEmails(data, ctx);
    });
}

export function updateRoomSchemaWithMaxDuration(maxDurationMs: number) {
  return z
    .object({
      roomId: z.string().uuid("Invalid room."),
      title: titleSchema,
      maxParticipants: maxParticipantsSchema,
      startTime: instantSchema,
      endTime: instantSchema,
      visibility: visibilitySchema.default("public"),
      allowedEmails: allowedEmailsSchema,
    })
    .superRefine((data, ctx) => {
      refineScheduleWindow(data, ctx, maxDurationMs);
      refineVisibilityEmails(data, ctx);
    });
}

export const createRoomSchema = createRoomSchemaWithMaxDuration(
  getMaxRoomDurationMs(),
);

export const updateRoomSchema = updateRoomSchemaWithMaxDuration(
  getMaxRoomDurationMs(),
);

export const roomIdSchema = z.object({
  roomId: z.string().uuid("Invalid room."),
});

export const deleteRoomsSchema = z.object({
  roomIds: z
    .array(z.string().uuid("Invalid room."))
    .min(1, "Select at least one room.")
    .max(50, "Too many rooms selected."),
});

export const inviteCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(16, "Invalid invite link.")
    .max(64, "Invalid invite link."),
});

export const guestJoinSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(16, "Invalid invite link.")
    .max(64, "Invalid invite link."),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(
      GUEST_NAME_MAX_LENGTH,
      `Display name must be at most ${GUEST_NAME_MAX_LENGTH} characters.`,
    ),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
