import "server-only";

import { assertProductionEnv, getRequiredEnv } from "@/lib/env";

export type LiveKitServerConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

function assertLiveKitUrl(url: string): void {
  if (!/^(ws|wss|http|https):\/\//i.test(url)) {
    throw new Error(
      "LIVEKIT_URL must start with ws://, wss://, http://, or https://.",
    );
  }
}

export function getLiveKitServerConfig(): LiveKitServerConfig {
  assertProductionEnv();

  const url = getRequiredEnv("LIVEKIT_URL");
  assertLiveKitUrl(url);

  return {
    url,
    apiKey: getRequiredEnv("LIVEKIT_API_KEY"),
    apiSecret: getRequiredEnv("LIVEKIT_API_SECRET"),
  };
}
