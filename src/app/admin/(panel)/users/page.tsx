import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AdminUsersFilters } from "@/components/admin/admin-users-filters";
import { EmptyState } from "@/components/meetcast/empty-state";
import { Button } from "@/components/ui/button";
import {
  listUsersPage,
  totalPages,
  type AdminUserRoleFilter,
} from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin users",
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    role?: string;
    from?: string;
    to?: string;
  }>;
};

function parseRole(value: string | undefined): AdminUserRoleFilter | undefined {
  if (value === "user" || value === "admin") return value;
  return undefined;
}

function parseDateParam(value: string | undefined): string {
  const raw = value?.trim() ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function pageHref(input: {
  page: number;
  q: string;
  role: string;
  from: string;
  to: string;
}) {
  const params = new URLSearchParams();
  if (input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.role) params.set("role", input.role);
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const q = (params.q ?? "").trim();
  const role = parseRole(params.role);
  const from = parseDateParam(params.from);
  const to = parseDateParam(params.to);
  const hasFilters = Boolean(q || role || from || to);

  const { rows, total, page: currentPage } = await listUsersPage({
    page,
    query: q,
    role,
    from: from || undefined,
    to: to || undefined,
  });
  const pages = totalPages(total);
  const safePage = Math.min(currentPage, pages);
  const hrefBase = {
    q,
    role: role ?? "",
    from,
    to,
  };

  return (
    <div className="space-y-4">
      <AdminUsersFilters
        total={total}
        q={q}
        role={role ?? ""}
        from={from}
        to={to}
      />

      {rows.length === 0 && !hasFilters ? (
        <EmptyState
          title="No users"
          description="Registered accounts will show up here."
        />
      ) : rows.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5 font-medium sm:px-4">User</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Email
                </th>
                <th className="px-3 py-2.5 text-center font-medium sm:px-4">
                  Created
                </th>
                <th className="w-8 px-2 py-2.5 sm:px-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center sm:px-4">
                  <p className="text-sm text-muted-foreground">
                    No users match these filters.
                  </p>
                  <Link
                    href="/admin/users"
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
                <th className="px-3 py-2.5 font-medium sm:px-4">User</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Email
                </th>
                <th className="px-3 py-2.5 text-center font-medium sm:px-4">
                  Created
                </th>
                <th className="w-8 px-2 py-2.5 sm:px-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/70 last:border-0 hover:bg-muted/35"
                >
                  <td className="px-3 py-2.5 sm:px-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <span className="truncate font-semibold tracking-tight">
                        {user.name}
                      </span>
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium capitalize text-muted-foreground">
                        {user.role}
                      </span>
                      {user.blockedAt ? (
                        <span className="shrink-0 rounded-md bg-danger/15 px-1.5 py-0.5 text-[0.7rem] font-medium text-danger">
                          Blocked
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="hidden max-w-[14rem] truncate px-3 py-2.5 text-muted-foreground sm:table-cell sm:px-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="block truncate"
                    >
                      {user.email}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-xs tabular-nums text-muted-foreground sm:px-4 sm:text-sm">
                    <Link href={`/admin/users/${user.id}`} className="block">
                      {formatDate(user.createdAt)}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 sm:px-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex justify-end"
                      aria-label={`Open ${user.name}`}
                    >
                      <ChevronRight
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  </td>
                </tr>
              ))}
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
