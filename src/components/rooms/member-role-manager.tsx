"use client";

import { useActionState } from "react";

import {
  setMemberRoleAction,
  type RoomActionState,
} from "@/app/actions/rooms";
import { Button } from "@/components/ui/button";
import type { RoomMemberListItem } from "@/lib/rooms/queries";

const initialState: RoomActionState = { ok: false };

type MemberRoleManagerProps = {
  roomId: string;
  hostUserId: string;
  members: RoomMemberListItem[];
};

function RoleForm({
  roomId,
  userId,
  nextRole,
  label,
}: {
  roomId: string;
  userId: string;
  nextRole: "moderator" | "participant";
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    setMemberRoleAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={nextRole} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Updating…" : label}
      </Button>
      {state.message && !state.ok ? (
        <span className="ml-2 text-xs text-destructive">{state.message}</span>
      ) : null}
    </form>
  );
}

export function MemberRoleManager({
  roomId,
  hostUserId,
  members,
}: MemberRoleManagerProps) {
  return (
    <ul className="divide-y divide-border" role="list">
      {members.map((member) => {
        const isHostMember = member.userId === hostUserId || member.role === "host";
        return (
          <li
            key={member.userId}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {member.email}
                {" · "}
                <span className="capitalize">{member.role}</span>
              </p>
            </div>
            {isHostMember ? (
              <span className="text-xs text-muted-foreground">Host</span>
            ) : member.role === "moderator" ? (
              <RoleForm
                roomId={roomId}
                userId={member.userId}
                nextRole="participant"
                label="Demote"
              />
            ) : (
              <RoleForm
                roomId={roomId}
                userId={member.userId}
                nextRole="moderator"
                label="Make moderator"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
