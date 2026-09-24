import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsPlansPage() {
  return (
    <DocsPage
      title="Plans"
      description="Plans live in the database. New users get the Free plan. Limits control concurrent participants and max room duration."
    >
      <section className="space-y-3">
        <h2>Default catalog</h2>
        <p>
          Inserted by migration (admins can edit later). Current seed defaults:
        </p>
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Slug</th>
              <th>Max participants</th>
              <th>Max duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Free</td>
              <td>
                <code>free</code>
              </td>
              <td>5</td>
              <td>60 minutes</td>
            </tr>
            <tr>
              <td>Starter</td>
              <td>
                <code>starter</code>
              </td>
              <td>10</td>
              <td>120 minutes</td>
            </tr>
            <tr>
              <td>Pro</td>
              <td>
                <code>pro</code>
              </td>
              <td>25</td>
              <td>240 minutes</td>
            </tr>
            <tr>
              <td>Business</td>
              <td>
                <code>business</code>
              </td>
              <td>50</td>
              <td>Unlimited within the app technical ceiling</td>
            </tr>
          </tbody>
        </table>
        <p>
          Prices are stored as <code>price_amount</code> in IRR rials. A later
          migration set active plan prices to <strong>0</strong> so checkout
          still runs but fulfills without a gateway while amounts show as{" "}
          <code>0</code>. Admins can change prices again in the admin panel.
        </p>
        <DocsCallout title="Do not hard-code limits in clients">
          Treat the table above as seed defaults. Runtime authority is the{" "}
          <code>plans</code> row attached to the user.
        </DocsCallout>
      </section>

      <section className="space-y-3">
        <h2>Where limits apply</h2>
        <ul>
          <li>
            Creating/editing a room: duration must fit the plan’s max (Business
            uses the app ceiling when duration is null).
          </li>
          <li>
            Joining: room <code>maxParticipants</code> is set from the host
            plan / room config; soft occupancy check before token issue.
          </li>
          <li>
            Platform hard cap remains 50 concurrent participants per room at the
            SFU.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Admin</h2>
        <p>
          Admins can create/edit plans, assign a plan to a user, and review
          orders. Bootstrap trusted emails with <code>ADMIN_EMAILS</code>.
        </p>
      </section>
    </DocsPage>
  );
}
