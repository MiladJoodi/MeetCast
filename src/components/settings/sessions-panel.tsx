"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  revokeOtherSessionsAction,
  revokeSessionAction,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";

const initialState: SettingsActionState = { ok: false };

export type SessionRow = {
  id: string;
  createdAtIso: string;
  expiresAtIso: string;
  isCurrent: boolean;
};

type SessionsPanelProps = {
  sessions: SessionRow[];
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function RevokeSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    revokeSessionAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled={pending}
        onClick={(event) => {
          if (
            !window.confirm(
              "Revoke this session? That device will be signed out.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        {pending ? "Revoking…" : "Revoke"}
      </Button>
      {state.message && !state.ok ? (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function RevokeOthersButton({ hasOthers }: { hasOthers: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    revokeOtherSessionsAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <form action={formAction} className="space-y-2">
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="w-full sm:w-auto"
        disabled={pending || !hasOthers}
        onClick={(event) => {
          if (
            !window.confirm(
              "Sign out all other sessions? You will stay signed in here.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        {pending ? "Revoking…" : "Revoke all other sessions"}
      </Button>
      {state.message ? (
        <p
          role="status"
          className={
            state.ok
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function SessionsPanel({ sessions }: SessionsPanelProps) {
  const hasOthers = sessions.some((session) => !session.isCurrent);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active sessions found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-lg border border-border">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
          >
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-medium text-foreground">
                {session.isCurrent ? "Current session" : "Other session"}
              </p>
              <p className="text-muted-foreground">
                Created {formatWhen(session.createdAtIso)}
              </p>
              <p className="text-muted-foreground">
                Expires {formatWhen(session.expiresAtIso)}
              </p>
            </div>
            {session.isCurrent ? (
              <span className="text-xs font-medium text-muted-foreground">
                This device
              </span>
            ) : (
              <RevokeSessionButton sessionId={session.id} />
            )}
          </li>
        ))}
      </ul>
      <RevokeOthersButton hasOthers={hasOthers} />
    </div>
  );
}
