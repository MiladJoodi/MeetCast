import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/meetcast/empty-state";
import { CreateRoomDialog } from "@/components/rooms/create-room-dialog";
import { HostedRoomsTable } from "@/components/rooms/hosted-rooms-table";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getEffectiveMaxRoomDurationMs } from "@/lib/plans/limits";
import { getUserPlan } from "@/lib/plans/queries";
import {
  countHostedRooms,
  HOSTED_ROOMS_PAGE_SIZE,
  listHostedRoomsPage,
} from "@/lib/rooms/queries";
import {
  deriveRoomStatus,
  formatRoomInstant,
  roomStatusLabel,
} from "@/lib/rooms/schedule";

export const metadata: Metadata = {
  title: "Rooms",
};

type RoomsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function MyRoomsPage({ searchParams }: RoomsPageProps) {
  const user = await requireUser();
  const { page: pageParam } = await searchParams;
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [plan, total] = await Promise.all([
    getUserPlan(user.id),
    countHostedRooms(user.id),
  ]);
  const maxDurationMinutes = getEffectiveMaxRoomDurationMs(plan) / 60_000;
  const planMaxParticipants = plan.maxConcurrentParticipants;
  const totalPages = Math.max(1, Math.ceil(total / HOSTED_ROOMS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const hostedRooms = await listHostedRoomsPage(
    user.id,
    currentPage,
    HOSTED_ROOMS_PAGE_SIZE,
  );
  const rowOffset = (currentPage - 1) * HOSTED_ROOMS_PAGE_SIZE;

  const rows = hostedRooms.map((room, index) => {
    const status = deriveRoomStatus(room);
    return {
      id: room.id,
      title: room.title,
      status,
      statusLabel: roomStatusLabel(status),
      startLabel: formatRoomInstant(room.startTime),
      endLabel: formatRoomInstant(room.endTime),
      startAt: room.startTime.toISOString(),
      endAt: room.endTime.toISOString(),
      inviteCode: room.inviteCode,
      maxParticipants: room.maxParticipants,
      visibility: room.visibility,
      rowNumber: rowOffset + index + 1,
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <header className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
            Rooms
          </h1>
          <CreateRoomDialog
            maxDurationMinutes={maxDurationMinutes}
            planMaxParticipants={planMaxParticipants}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "Create a room and share the invite."
            : `${total} room${total === 1 ? "" : "s"} you host`}
          {totalPages > 1 ? ` · page ${currentPage}/${totalPages}` : null}
        </p>
      </header>

      {total === 0 ? (
        <EmptyState
          title="No meetings yet"
          description="Create a room, set when it opens, and share the invite."
          action={
            <CreateRoomDialog
              maxDurationMinutes={maxDurationMinutes}
              planMaxParticipants={planMaxParticipants}
            />
          }
        />
      ) : (
        <section className="space-y-4">
          <HostedRoomsTable rooms={rows} />

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {currentPage > 1 ? (
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                    <Link
                      href={
                        currentPage === 2
                          ? "/dashboard/rooms"
                          : `/dashboard/rooms?page=${currentPage - 1}`
                      }
                    >
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled
                  >
                    Previous
                  </Button>
                )}
                {currentPage < totalPages ? (
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                    <Link href={`/dashboard/rooms?page=${currentPage + 1}`}>
                      Next
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
