export type GuestSession = {
  guestId: string;
  roomId: string;
  displayName: string;
  /** Present when the room uses an email allowlist. */
  email?: string;
  expiresAt: number;
};
