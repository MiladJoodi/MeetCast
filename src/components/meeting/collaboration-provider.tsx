"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import {
  ConnectionState,
  RoomEvent,
  type Participant,
  type RemoteParticipant,
} from "livekit-client";

import { displayNameForParticipant } from "@/components/meeting/grid-utils";
import {
  COLLAB_TOPIC,
  MAX_CHAT_MESSAGES,
  MAX_VISIBLE_REACTIONS,
  REACTION_COOLDOWN_MS,
  REACTION_TTL_MS,
  createMessageId,
  decodeCollabMessage,
  encodeCollabMessage,
  sanitizeChatText,
  type ReactionEmoji,
} from "@/lib/collaboration/protocol";

export type ChatEntry = {
  id: string;
  text: string;
  ts: number;
  senderIdentity: string;
  senderName: string;
  isLocal: boolean;
  status: "sent" | "failed";
};

export type ReactionEntry = {
  id: string;
  emoji: ReactionEmoji;
  senderIdentity: string;
  senderName: string;
  createdAt: number;
};

type ConnectionCollabValue = {
  connected: boolean;
};

type RaisedHandsValue = {
  raisedHands: ReadonlySet<string>;
  localHandRaised: boolean;
  setHandRaised: (raised: boolean) => Promise<boolean>;
};

type ChatValue = {
  messages: ChatEntry[];
  sendChat: (text: string) => Promise<boolean>;
};

type ReactionsValue = {
  reactions: ReactionEntry[];
  sendReaction: (emoji: ReactionEmoji) => Promise<boolean>;
};

const ConnectionCollabContext = createContext<ConnectionCollabValue | null>(
  null,
);
const RaisedHandsContext = createContext<RaisedHandsValue | null>(null);
const ChatContext = createContext<ChatValue | null>(null);
const ReactionsContext = createContext<ReactionsValue | null>(null);

function senderNameFromParticipant(participant: Participant | undefined): string {
  if (!participant) {
    return "Participant";
  }
  return displayNameForParticipant(participant.name, participant.identity);
}

function appendChatMessage(prev: ChatEntry[], entry: ChatEntry): ChatEntry[] {
  if (prev.some((m) => m.id === entry.id)) {
    return prev;
  }
  const next = [...prev, entry];
  if (next.length > MAX_CHAT_MESSAGES) {
    return next.slice(next.length - MAX_CHAT_MESSAGES);
  }
  return next;
}

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const connected = connectionState === ConnectionState.Connected;

  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [raisedHands, setRaisedHands] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [reactions, setReactions] = useState<ReactionEntry[]>([]);
  const localHandRaised = raisedHands.has(localParticipant.identity);

  const lastReactionAt = useRef(0);
  const handRaisedRef = useRef(false);
  const reactionTimersRef = useRef<Set<number>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const timers = reactionTimersRef.current;
    return () => {
      mountedRef.current = false;
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  useEffect(() => {
    handRaisedRef.current = localHandRaised;
  }, [localHandRaised]);

  const clearRemoteEphemeral = useCallback(() => {
    setRaisedHands((prev) => {
      const next = new Set<string>();
      if (handRaisedRef.current) {
        next.add(localParticipant.identity);
      }
      // Preserve only local raised-hand intent across brief disconnects.
      void prev;
      return next;
    });
    setReactions([]);
  }, [localParticipant.identity]);

  const scheduleReactionExpiry = useCallback((reactionId: string) => {
    const timer = window.setTimeout(() => {
      reactionTimersRef.current.delete(timer);
      if (!mountedRef.current) {
        return;
      }
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, REACTION_TTL_MS);
    reactionTimersRef.current.add(timer);
  }, []);

  const publish = useCallback(
    async (
      message: Parameters<typeof encodeCollabMessage>[0],
      reliable: boolean,
    ) => {
      if (room.state !== ConnectionState.Connected) {
        throw new Error("Not connected");
      }
      const data = encodeCollabMessage(message);
      await localParticipant.publishData(data, {
        reliable,
        topic: COLLAB_TOPIC,
      });
    },
    [localParticipant, room],
  );

  useEffect(() => {
    const onData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== undefined && topic !== COLLAB_TOPIC) {
        return;
      }

      const message = decodeCollabMessage(payload);
      if (!message || !participant) {
        return;
      }

      const identity = participant.identity;
      const name = senderNameFromParticipant(participant);

      if (message.type === "chat") {
        setMessages((prev) =>
          appendChatMessage(prev, {
            id: message.id,
            text: message.text,
            ts: message.ts,
            senderIdentity: identity,
            senderName: name,
            isLocal: false,
            status: "sent",
          }),
        );
        return;
      }

      if (message.type === "raise_hand") {
        setRaisedHands((prev) => {
          const next = new Set(prev);
          if (message.raised) {
            next.add(identity);
          } else {
            next.delete(identity);
          }
          return next;
        });
        return;
      }

      if (message.type === "reaction") {
        const entry: ReactionEntry = {
          id: message.id,
          emoji: message.emoji,
          senderIdentity: identity,
          senderName: name,
          createdAt: Date.now(),
        };
        setReactions((prev) => {
          const next = [...prev, entry];
          if (next.length > MAX_VISIBLE_REACTIONS) {
            return next.slice(next.length - MAX_VISIBLE_REACTIONS);
          }
          return next;
        });
        scheduleReactionExpiry(entry.id);
      }
    };

    const onParticipantLeft = (participant: RemoteParticipant) => {
      setRaisedHands((prev) => {
        if (!prev.has(participant.identity)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(participant.identity);
        return next;
      });
    };

    const onDisconnected = () => {
      clearRemoteEphemeral();
    };

    const onConnected = () => {
      if (!handRaisedRef.current || room.state !== ConnectionState.Connected) {
        return;
      }
      setRaisedHands((prev) => {
        if (prev.has(localParticipant.identity)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(localParticipant.identity);
        return next;
      });
      void localParticipant
        .publishData(
          encodeCollabMessage({
            type: "raise_hand",
            raised: true,
            ts: Date.now(),
          }),
          { reliable: true, topic: COLLAB_TOPIC },
        )
        .catch(() => undefined);
    };

    const onParticipantConnected = () => {
      if (!handRaisedRef.current || room.state !== ConnectionState.Connected) {
        return;
      }
      void localParticipant
        .publishData(
          encodeCollabMessage({
            type: "raise_hand",
            raised: true,
            ts: Date.now(),
          }),
          { reliable: true, topic: COLLAB_TOPIC },
        )
        .catch(() => undefined);
    };

    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantLeft);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

    return () => {
      room.off(RoomEvent.DataReceived, onData);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantLeft);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    };
  }, [clearRemoteEphemeral, localParticipant, room, scheduleReactionExpiry]);

  const sendChat = useCallback(
    async (raw: string) => {
      const text = sanitizeChatText(raw);
      if (!text || room.state !== ConnectionState.Connected) {
        return false;
      }

      const id = createMessageId();
      const ts = Date.now();
      const entry: ChatEntry = {
        id,
        text,
        ts,
        senderIdentity: localParticipant.identity,
        senderName: senderNameFromParticipant(localParticipant),
        isLocal: true,
        status: "sent",
      };

      setMessages((prev) => appendChatMessage(prev, entry));

      try {
        await publish({ type: "chat", id, text, ts }, true);
        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: "failed" } : m)),
        );
        return false;
      }
    },
    [localParticipant, publish, room.state],
  );

  const setHandRaised = useCallback(
    async (raised: boolean) => {
      if (room.state !== ConnectionState.Connected) {
        return false;
      }

      const identity = localParticipant.identity;
      setRaisedHands((prev) => {
        const next = new Set(prev);
        if (raised) {
          next.add(identity);
        } else {
          next.delete(identity);
        }
        return next;
      });
      handRaisedRef.current = raised;

      try {
        await publish({ type: "raise_hand", raised, ts: Date.now() }, true);
        return true;
      } catch {
        setRaisedHands((prev) => {
          const next = new Set(prev);
          if (raised) {
            next.delete(identity);
          } else {
            next.add(identity);
          }
          return next;
        });
        handRaisedRef.current = !raised;
        return false;
      }
    },
    [localParticipant.identity, publish, room.state],
  );

  const sendReaction = useCallback(
    async (emoji: ReactionEmoji) => {
      if (room.state !== ConnectionState.Connected) {
        return false;
      }

      const now = Date.now();
      if (now - lastReactionAt.current < REACTION_COOLDOWN_MS) {
        return false;
      }
      lastReactionAt.current = now;

      const id = createMessageId();
      const entry: ReactionEntry = {
        id,
        emoji,
        senderIdentity: localParticipant.identity,
        senderName: senderNameFromParticipant(localParticipant),
        createdAt: now,
      };

      setReactions((prev) => {
        const next = [...prev, entry];
        if (next.length > MAX_VISIBLE_REACTIONS) {
          return next.slice(next.length - MAX_VISIBLE_REACTIONS);
        }
        return next;
      });
      scheduleReactionExpiry(id);

      try {
        await publish({ type: "reaction", id, emoji, ts: now }, false);
        return true;
      } catch {
        setReactions((prev) => prev.filter((r) => r.id !== id));
        return false;
      }
    },
    [localParticipant, publish, room.state, scheduleReactionExpiry],
  );

  const connectionValue = useMemo(
    () => ({ connected }),
    [connected],
  );

  const raisedValue = useMemo(
    () => ({
      raisedHands,
      localHandRaised,
      setHandRaised,
    }),
    [raisedHands, localHandRaised, setHandRaised],
  );

  const chatValue = useMemo(
    () => ({
      messages,
      sendChat,
    }),
    [messages, sendChat],
  );

  const reactionsValue = useMemo(
    () => ({
      reactions,
      sendReaction,
    }),
    [reactions, sendReaction],
  );

  return (
    <ConnectionCollabContext.Provider value={connectionValue}>
      <RaisedHandsContext.Provider value={raisedValue}>
        <ChatContext.Provider value={chatValue}>
          <ReactionsContext.Provider value={reactionsValue}>
            {children}
          </ReactionsContext.Provider>
        </ChatContext.Provider>
      </RaisedHandsContext.Provider>
    </ConnectionCollabContext.Provider>
  );
}

function useConnectionCollab(): ConnectionCollabValue {
  const ctx = useContext(ConnectionCollabContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return ctx;
}

function useRaisedHands(): RaisedHandsValue {
  const ctx = useContext(RaisedHandsContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return ctx;
}

function useChatState(): ChatValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return ctx;
}

function useReactionsState(): ReactionsValue {
  const ctx = useContext(ReactionsContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return ctx;
}

/** Combined hook for controls that need multiple collaboration features. */
export function useCollaboration() {
  const { connected } = useConnectionCollab();
  const { raisedHands, localHandRaised, setHandRaised } = useRaisedHands();
  const { messages, sendChat } = useChatState();
  const { reactions, sendReaction } = useReactionsState();

  return {
    connected,
    raisedHands,
    localHandRaised,
    setHandRaised,
    messages,
    sendChat,
    reactions,
    sendReaction,
  };
}

/** Narrow hook for the control bar — avoids re-render on every chat message. */
export function useMeetingControlsCollab() {
  const { connected } = useConnectionCollab();
  const { localHandRaised, setHandRaised } = useRaisedHands();
  const { sendReaction } = useReactionsState();
  return { connected, localHandRaised, setHandRaised, sendReaction };
}

export function useRaisedHandsOnly() {
  return useRaisedHands();
}

export function useChatOnly() {
  const { connected } = useConnectionCollab();
  const chat = useChatState();
  return { ...chat, connected };
}

export function useReactionsOnly() {
  return useReactionsState();
}
