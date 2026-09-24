import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsBillingPage() {
  return (
    <DocsPage
      title="Billing"
      description="Checkout creates an order from the plan row, then pays (or immediately fulfills zero-price plans). Fulfillment is idempotent."
    >
      <section className="space-y-3">
        <h2>Flow</h2>
        <CodeBlock
          language="text"
          code={`Plans → Checkout → Create/reuse Order
   ↓
amount = plan.priceAmount (never from the client)
   ↓
If amount is 0 → fulfillPaidOrder → billing result
Else → payment provider (ZarinPal or mock)
   ↓
Callback / verify
   ↓
fulfillPaidOrder (idempotent) → assign plan`}
        />
      </section>

      <section className="space-y-3">
        <h2>Orders</h2>
        <p>
          An order snapshots plan name, amount, and currency. Status:{" "}
          <code>pending</code>, <code>paid</code>, <code>failed</code>,{" "}
          <code>cancelled</code>. Idempotency keys prevent duplicate pending
          checkouts for the same attempt.
        </p>
        <p>
          Billing history is under <code>/billing</code>. There is no admin
          “mark as paid” shortcut — paid state comes from verified payment or
          zero-price fulfill.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Providers</h2>
        <ul>
          <li>
            <strong>ZarinPal</strong> — when <code>ZARINPAL_MERCHANT_ID</code> is
            set. Sandbox defaults outside production unless{" "}
            <code>ZARINPAL_SANDBOX</code> overrides.
          </li>
          <li>
            <strong>Mock</strong> — in-app simulated gateway at{" "}
            <code>/billing/pay/[orderId]</code> when merchant is unset in
            non-production, or when <code>PAYMENT_PROVIDER=mock</code>.
          </li>
        </ul>
        <p>
          Browser callback <code>GET /api/payment/callback</code> is untrusted
          until server-to-server verify succeeds.
        </p>
        <DocsCallout title="Production" variant="warning">
          Production does not fall back to mock unless you explicitly set{" "}
          <code>PAYMENT_PROVIDER=mock</code>. Configure ZarinPal (or keep prices
          at zero) before real checkouts.
        </DocsCallout>
      </section>
    </DocsPage>
  );
}
