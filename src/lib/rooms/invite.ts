import { randomBytes } from "node:crypto";

import { INVITE_CODE_BYTES } from "@/lib/rooms/constants";

export function generateInviteCode(): string {
  return randomBytes(INVITE_CODE_BYTES).toString("base64url");
}
