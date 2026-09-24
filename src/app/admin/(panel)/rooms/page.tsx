import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AdminRoomsFilters } from "@/components/admin/admin-rooms-filters";
import { EmptyState } from "@/components/meetcast/empty-state";
import { RoomStatusBadge } from "@/components/rooms/room-status-badge";
import { Button } from "@/components/ui/button";
import {
  listRoomsPage,
  totalPages,
  type AdminRoomStatusFilter,
} from "@/lib/admin/queries";
import { deriveRoomStatus } from "@/lib/rooms/schedule";

export const metadata: Metadata = {
  title: "Admin rooms",
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
};

function parseStatus(
  value: string | undefined,
): AdminRoomStatusFilter | undefined {
  if (value === "live" || value === "scheduled" || value === "ended") {
    return value;
  }
  return undefined;
}

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
  status: string;
  from: string;
  to: string;
}) {
  const params = new URLSearchParams();
  if (input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  const qs = params.toString();
  return qs ? `/admin/rooms?${qs}` : "/admin/rooms";
}

export default async function AdminRoomsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const q = (params.q ?? "").trim();
  const status = parseStatus(params.status);
  const from = parseDateParam(params.from);
  const to = parseDateParam(params.to);
  const hasFilters = Boolean(q || status || from || to);

  const { rows, total, page: currentPage } = await listRoomsPage({
    page,
    query: q,
    status,
    from: from || undefined,
    to: to || undefined,
  });
  const pages = totalPages(total);
  const safePage = Math.min(currentPage, pages);

  const hrefBase = {
    q,
    status: status ?? "",
    from,
    to,
  };

  return (
    <div className="space-y-4">
      <AdminRoomsFilters
        total={total}
        q={q}
        status={status ?? ""}
        from={from}
        to={to}
      />

      {rows.length === 0 && !hasFilters ? (
        <EmptyState
          title="No rooms"
          description="Rooms will show up here when hosts create them."
        />
      ) : rows.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5 font-medium sm:px-4">Room</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Host
                </th>
                <th className="px-3 py-2.5 text-center font-medium sm:px-4">
                  Schedule
                </th>
                <th className="w-8 px-2 py-2.5 sm:px-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center sm:px-4"
                >
                  <p className="text-sm text-muted-foreground">
                    No rooms match these filters.
                  </p>
                  <Link
                    href="/admin/rooms"
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
                <th className="px-3 py-2.5 font-medium sm:px-4">Room</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Host
                </th>
                <th className="px-3 py-2.5 text-center font-medium sm:px-4">
                  Schedule
                </th>
                <th className="w-8 px-2 py-2.5 sm:px-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((room) => {
                const derived = deriveRoomStatus(room);
                return (
                  <tr
                    key={room.id}
                    className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/35"
                  >
                    <td className="px-3 py-2.5 sm:px-4">
                      <Link
                        href={`/admin/rooms/${room.id}`}
                        className="flex min-w-0 items-center gap-2"
                      >
                        <span className="truncate font-semibold tracking-tight">
                          {room.title}
                        </span>
                        <RoomStatusBadge
                          status={derived}
                          className="shrink-0"
                        />
                      </Link>
                    </td>
                    <td className="hidden max-w-[9rem] truncate px-3 py-2.5 text-muted-foreground sm:table-cell sm:px-4">
                      <Link
                        href={`/admin/rooms/${room.id}`}
                        className="block truncate"
                      >
                        {room.hostName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-xs tabular-nums text-muted-foreground sm:px-4 sm:text-sm">
                      <Link href={`/admin/rooms/${room.id}`} className="block">
                        {formatWhen(room.startTime)}
                        <span className="mx-1 text-border">→</span>
                        {formatWhen(room.endTime)}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 sm:px-3">
                      <Link
                        href={`/admin/rooms/${room.id}`}
                        className="flex justify-end"
                        aria-label={`Open ${room.title}`}
                      >
                        <ChevronRight
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                      </Link>
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
