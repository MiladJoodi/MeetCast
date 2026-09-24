import "server-only";

import { RoomServiceClient } from "livekit-server-sdk";

import { getLiveKitServerConfig } from "@/lib/livekit/config";

/** Shared RoomService client — API secret never leaves the server. */
export function createRoomServiceClient(): RoomServiceClient {
  const { url, apiKey, apiSecret } = getLiveKitServerConfig();
  const httpUrl = url.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
  return new RoomServiceClient(httpUrl, apiKey, apiSecret);
}
