"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send, X } from "lucide-react";

import { useChatOnly } from "@/components/meeting/collaboration-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_CHAT_LENGTH } from "@/lib/collaboration/protocol";
import { cn } from "@/lib/utils";

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

function formatTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const { messages, sendChat, connected } = useChatOnly();
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 48;
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickToBottom.current) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const submit = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) {
      return;
    }
    if (!connected) {
      setSendError("Chat is unavailable while disconnected.");
      return;
    }

    setSending(true);
    setSendError(null);
    const ok = await sendChat(text);
    setSending(false);

    if (ok) {
      setDraft("");
      stickToBottom.current = true;
    } else {
      setSendError("Message could not be sent. Try again.");
    }
  }, [connected, draft, sendChat, sending]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close chat"
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="meeting-chat-panel"
        aria-label="Meeting chat"
        aria-hidden={!open}
        className={cn(
          "mc-room-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 transition-transform duration-200 md:static md:z-auto md:max-w-none md:w-80 md:shrink-0",
          open ? "translate-x-0" : "translate-x-full md:hidden",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Chat</h2>
            <p className="text-[0.6875rem] text-[var(--room-muted)]">
              Not saved after the call
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[var(--room-muted)] hover:bg-white/10 hover:text-[var(--room-fg)]"
            aria-label="Close chat panel"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div
          ref={listRef}
          onScroll={onScroll}
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 ? (
            <p className="my-auto text-center text-sm text-[var(--room-muted)]">
              No messages yet. Say hello when you&apos;re ready.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "space-y-0.5 text-sm",
                  message.status === "failed" && "opacity-70",
                )}
              >
                <div className="flex items-baseline justify-between gap-2 text-[0.6875rem] text-[var(--room-muted)]">
                  <span className="truncate font-medium text-brand">
                    {message.isLocal ? "You" : message.senderName}
                  </span>
                  <time dateTime={new Date(message.ts).toISOString()}>
                    {formatTime(message.ts)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words leading-relaxed text-[var(--room-fg)]">
                  {message.text}
                </p>
                {message.status === "failed" ? (
                  <p className="text-[0.6875rem] text-danger">Not delivered</p>
                ) : null}
              </div>
            ))
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-white/10 p-3">
          {sendError ? (
            <p role="alert" className="mb-2 text-xs text-danger">
              {sendError}
            </p>
          ) : null}
          {!connected ? (
            <p className="mb-2 text-xs text-[var(--room-muted)]">
              Chat unavailable while disconnected.
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value.slice(0, MAX_CHAT_LENGTH))
              }
              onKeyDown={onKeyDown}
              placeholder="Message the room"
              aria-label="Chat message"
              maxLength={MAX_CHAT_LENGTH}
              disabled={!connected || sending}
              autoComplete="off"
              className="border-white/15 bg-white/5 text-[var(--room-fg)] placeholder:text-[var(--room-muted)]"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              aria-label="Send message"
              disabled={!connected || sending || !draft.trim()}
            >
              <Send className="size-4" aria-hidden />
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
