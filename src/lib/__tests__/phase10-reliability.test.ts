import { describe, expect, it } from "vitest";

import {
  decodeCollabMessage,
  encodeCollabMessage,
  sanitizeChatText,
  MAX_CHAT_LENGTH,
} from "@/lib/collaboration/protocol";
import { parseLiveKitIdentity } from "@/lib/livekit/parse-identity";
import { AppError } from "@/lib/errors";
import {
  assertCanManageModeratorRole,
  assertCanModerateTarget,
} from "@/lib/rooms/moderation-rules";
import type { RoomAccessActor } from "@/lib/rooms/actors";
import { assertJoinCapacityAvailable } from "@/lib/rooms/capacity";
import type { Room } from "@/db/schema";

describe("sanitizeChatText", () => {
  it("strips control characters and trims", () => {
    expect(sanitizeChatText("  hello\u0000world  ")).toBe("helloworld");
  });

  it("enforces max length", () => {
    const long = "a".repeat(MAX_CHAT_LENGTH + 50);
    expect(sanitizeChatText(long).length).toBe(MAX_CHAT_LENGTH);
  });
});

describe("collab protocol", () => {
  it("round-trips a valid chat message", () => {
    const encoded = encodeCollabMessage({
      type: "chat",
      id: "msg-1",
      text: "Hello",
      ts: 1,
    });
    expect(decodeCollabMessage(encoded)).toEqual({
      type: "chat",
      id: "msg-1",
      text: "Hello",
      ts: 1,
    });
  });

  it("rejects malformed payloads", () => {
    expect(decodeCollabMessage(new TextEncoder().encode("{not-json"))).toBeNull();
    expect(
      decodeCollabMessage(
        new TextEncoder().encode(JSON.stringify({ type: "chat" })),
      ),
    ).toBeNull();
    expect(
      decodeCollabMessage(
        new TextEncoder().encode(
          JSON.stringify({ type: "reaction", id: "1", emoji: "🚀", ts: 1 }),
        ),
      ),
    ).toBeNull();
  });
});

describe("parseLiveKitIdentity", () => {
  it("parses user and guest identities", () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const roomId = "22222222-2222-4222-8222-222222222222";
    expect(parseLiveKitIdentity(`user:${userId}`)).toEqual({
      kind: "user",
      userId,
    });
    expect(parseLiveKitIdentity(`guest:${roomId}:abc`)).toEqual({
      kind: "guest",
      roomId,
      guestId: "abc",
    });
  });

  it("rejects invalid identities", () => {
    expect(parseLiveKitIdentity("user:not-a-uuid")).toBeNull();
    expect(parseLiveKitIdentity("guest:bad")).toBeNull();
    expect(parseLiveKitIdentity("other:x")).toBeNull();
  });
});

describe("moderation authorization", () => {
  const hostActor: RoomAccessActor = {
    kind: "user",
    user: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Host",
      email: "h@example.com",
      role: "user",
      planId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      createdAt: new Date(),
    },
    role: "host",
  };

  const moderatorActor: RoomAccessActor = {
    kind: "user",
    user: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Mod",
      email: "m@example.com",
      role: "user",
      planId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      createdAt: new Date(),
    },
    role: "moderator",
  };

  const participantActor: RoomAccessActor = {
    kind: "user",
    user: {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      name: "Part",
      email: "p@example.com",
      role: "user",
      planId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      createdAt: new Date(),
    },
    role: "participant",
  };

  it("blocks participants from moderating", () => {
    expect(() =>
      assertCanModerateTarget({
        actor: participantActor,
        targetRole: "participant",
        targetIdentity: "user:dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        actorIdentity: "user:cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      }),
    ).toThrow(AppError);
  });

  it("blocks moderating the host", () => {
    expect(() =>
      assertCanModerateTarget({
        actor: moderatorActor,
        targetRole: "host",
        targetIdentity: "user:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        actorIdentity: "user:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      }),
    ).toThrow(AppError);
  });

  it("blocks moderators from moderating other moderators", () => {
    expect(() =>
      assertCanModerateTarget({
        actor: moderatorActor,
        targetRole: "moderator",
        targetIdentity: "user:eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        actorIdentity: "user:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      }),
    ).toThrow(AppError);
  });

  it("allows host to manage moderator roles only", () => {
    expect(() => assertCanManageModeratorRole(hostActor)).not.toThrow();
    expect(() => assertCanManageModeratorRole(moderatorActor)).toThrow(
      AppError,
    );
  });
});

describe("join capacity", () => {
  const room = {
    id: "33333333-3333-4333-8333-333333333333",
    maxParticipants: 50,
  } as Room;

  it("allows joins under the limit", async () => {
    await expect(assertJoinCapacityAvailable(room, 49)).resolves.toBeUndefined();
  });

  it("rejects when full", async () => {
    await expect(assertJoinCapacityAvailable(room, 50)).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
