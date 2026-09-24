import { handlePaymentCallback } from "@/lib/payments/callback";

/**
 * GET /api/payment/callback
 * Gateway browser return URL. Query: orderId, Authority, Status (ZarinPal).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return handlePaymentCallback({
    orderId: url.searchParams.get("orderId"),
    authority:
      url.searchParams.get("Authority") ?? url.searchParams.get("authority"),
    gatewayStatus:
      url.searchParams.get("Status") ?? url.searchParams.get("status"),
  });
}
