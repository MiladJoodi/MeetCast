"use client";

import { useState, type KeyboardEvent } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_ROOM_ALLOWED_EMAILS } from "@/lib/rooms/constants";
import { cn } from "@/lib/utils";

type AllowedEmailsFieldProps = {
  initialEmails?: string[];
  disabled?: boolean;
  error?: string;
  /** When false, keep emails in the form but hide the editor (public rooms). */
  active?: boolean;
  /** Extra class on the outer wrapper. */
  className?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmailShape(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AllowedEmailsField({
  initialEmails = [],
  disabled,
  error,
  active = true,
  className,
}: AllowedEmailsFieldProps) {
  const [emails, setEmails] = useState(() =>
    [...new Set(initialEmails.map((email) => normalizeEmail(email)))].filter(
      Boolean,
    ),
  );
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function addEmail(raw: string) {
    const email = normalizeEmail(raw);
    if (!email) return;
    if (!isValidEmailShape(email)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (emails.includes(email)) {
      setLocalError("That email is already on the list.");
      return;
    }
    if (emails.length >= MAX_ROOM_ALLOWED_EMAILS) {
      setLocalError(`At most ${MAX_ROOM_ALLOWED_EMAILS} emails.`);
      return;
    }
    setEmails((prev) => [...prev, email]);
    setDraft("");
    setLocalError(null);
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((item) => item !== email));
    setLocalError(null);
  }

  function onDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addEmail(draft);
    }
  }

  const displayError = localError ?? error;

  return (
    <div className={cn("space-y-2", className)}>
      <input type="hidden" name="allowedEmails" value={emails.join("\n")} />

      {active ? (
        <>
          <div className="space-y-1">
            <Label
              htmlFor="allowed-email-draft"
              className="text-xs text-muted-foreground"
            >
              Guest list
            </Label>
            <p className="text-xs text-muted-foreground">
              Add at least one email. Only those accounts can join. You (the
              host) are always allowed.
            </p>
          </div>

          {emails.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {emails.map((email) => (
                <li
                  key={email}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/40 py-0.5 pr-1 pl-2 text-xs"
                >
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Remove ${email}`}
                    className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-40"
                    onClick={() => removeEmail(email)}
                  >
                    <XIcon className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex gap-2">
            <Input
              id="allowed-email-draft"
              type="email"
              value={draft}
              disabled={disabled || emails.length >= MAX_ROOM_ALLOWED_EMAILS}
              placeholder="name@example.com"
              onChange={(event) => {
                setDraft(event.target.value);
                if (localError) setLocalError(null);
              }}
              onKeyDown={onDraftKeyDown}
              aria-invalid={Boolean(displayError)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={disabled || !draft.trim()}
              onClick={() => addEmail(draft)}
            >
              Add
            </Button>
          </div>

          {displayError ? (
            <p className="text-xs text-destructive">{displayError}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
