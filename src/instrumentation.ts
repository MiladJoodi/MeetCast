export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionAuthSecrets } = await import("@/lib/env");
    assertProductionAuthSecrets();
  }
}
