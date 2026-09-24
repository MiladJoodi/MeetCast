import type { Metadata } from "next";
import Link from "next/link";

import { AdminAuditLogsFilters } from "@/components/admin/admin-audit-logs-filters";
import { EmptyState } from "@/components/meetcast/empty-state";
import { Button } from "@/components/ui/button";
import {
  formatAuditActionLabel,
  formatAuditDetails,
  formatAuditTargetTypeLabel,
} from "@/lib/admin/audit-labels";
import { listAuditLogsPage, totalPages } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin audit logs",
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    action?: string;
    targetType?: string;
    from?: string;
    to?: string;
  }>;
};

function parseDateParam(value: string | undefined): string {
  const raw = value?.trim() ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function formatWhen(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function pageHref(input: {
  page: number;
  q: string;
  action: string;
  targetType: string;
  from: string;
  to: string;
}) {
  const params = new URLSearchParams();
  if (input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.action) params.set("action", input.action);
  if (input.targetType) params.set("targetType", input.targetType);
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  const qs = params.toString();
  return qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs";
}

export default async function AdminAuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const q = (params.q ?? "").trim();
  const action = (params.action ?? "").trim();
  const targetType = (params.targetType ?? "").trim();
  const from = parseDateParam(params.from);
  const to = parseDateParam(params.to);
  const hasFilters = Boolean(q || action || targetType || from || to);

  const { rows, total, page: currentPage } = await listAuditLogsPage({
    page,
    query: q,
    action: action || undefined,
    targetType: targetType || undefined,
    from: from || undefined,
    to: to || undefined,
  });
  const pages = totalPages(total);
  const safePage = Math.min(currentPage, pages);

  const hrefBase = { q, action, targetType, from, to };

  return (
    <div className="space-y-4">
      <AdminAuditLogsFilters
        total={total}
        q={q}
        action={action}
        targetType={targetType}
        from={from}
        to={to}
      />

      {rows.length === 0 && !hasFilters ? (
        <EmptyState
          title="No audit logs"
          description="Admin actions will show up here as they happen."
        />
      ) : rows.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5 font-medium sm:px-4">Event</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Admin
                </th>
                <th className="px-3 py-2.5 text-center font-medium sm:px-4">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center sm:px-4">
                  <p className="text-sm text-muted-foreground">
                    No logs match these filters.
                  </p>
                  <Link
                    href="/admin/audit-logs"
                    className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
                  >
                    Clear filters
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5 font-medium sm:px-4">Event</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Admin
                </th>
                <th className="px-3 py-2.5 text-center font-medium sm:px-4">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const details = formatAuditDetails(row.action, row.metadata);
                const targetLabel = formatAuditTargetTypeLabel(row.targetType);
                const eventLabel = formatAuditActionLabel(row.action);

                return (
                  <tr
                    key={row.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/35"
                  >
                    <td className="px-3 py-2.5 sm:px-4">
                      <div
                        title={details ?? undefined}
                        className="flex min-w-0 items-center gap-2"
                      >
                        <span className="truncate font-semibold tracking-tight">
                          {eventLabel}
                        </span>
                        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
                          {targetLabel}
                        </span>
                      </div>
                    </td>
                    <td className="hidden max-w-[9rem] truncate px-3 py-2.5 text-muted-foreground sm:table-cell sm:px-4">
                      {row.actorName ?? "Deleted admin"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-xs tabular-nums text-muted-foreground sm:px-4 sm:text-sm">
                      {formatWhen(row.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {pages}
          </p>
          <div className="flex gap-2">
            {safePage > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageHref({ ...hrefBase, page: safePage - 1 })}>
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            {safePage < pages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageHref({ ...hrefBase, page: safePage + 1 })}>
                  Next
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
