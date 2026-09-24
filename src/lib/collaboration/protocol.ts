import { z } from "zod";

/** LiveKit data channel topic for MeetCast collaboration. */
export const COLLAB_TOPIC = "meetcast.collab";

export const MAX_CHAT_LENGTH = 500;
export const MAX_CHAT_MESSAGES = 200;
export const REACTION_TTL_MS = 3200;
export const REACTION_COOLDOWN_MS = 900;
export const MAX_VISIBLE_REACTIONS = 24;

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "👏", "🎉"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

const chatSchema = z.object({
  type: z.literal("chat"),
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(MAX_CHAT_LENGTH),
  ts: z.number().finite(),
});

const raiseHandSchema = z.object({
  type: z.literal("raise_hand"),
  raised: z.boolean(),
  ts: z.number().finite(),
});

const reactionSchema = z.object({
  type: z.literal("reaction"),
  id: z.string().min(1).max(64),
  emoji: z.enum(REACTION_EMOJIS),
  ts: z.number().finite(),
});

export const collabMessageSchema = z.discriminatedUnion("type", [
  chatSchema,
  raiseHandSchema,
  reactionSchema,
]);

export type CollabChatMessage = z.infer<typeof chatSchema>;
export type CollabRaiseHandMessage = z.infer<typeof raiseHandSchema>;
export type CollabReactionMessage = z.infer<typeof reactionSchema>;
export type CollabMessage = z.infer<typeof collabMessageSchema>;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Strip control characters and normalize whitespace for chat text. */
export function sanitizeChatText(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_CHAT_LENGTH);
}

export function encodeCollabMessage(message: CollabMessage): Uint8Array<ArrayBuffer> {
  const encoded = encoder.encode(JSON.stringify(message));
  return new Uint8Array(encoded);
}

/**
 * Parse and validate an incoming payload.
 * Identity/authorization must come from the LiveKit sender, not the payload.
 */
export function decodeCollabMessage(payload: Uint8Array): CollabMessage | null {
  if (payload.byteLength === 0 || payload.byteLength > 8_192) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoder.decode(payload));
  } catch {
    return null;
  }

  const result = collabMessageSchema.safeParse(parsed);
  if (!result.success) {
    return null;
  }

  if (result.data.type === "chat") {
    const text = sanitizeChatText(result.data.text);
    if (!text) {
      return null;
    }
    return { ...result.data, text };
  }

  return result.data;
}

export function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
