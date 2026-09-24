/**
 * Pure session revoke rules — kept free of server-only so unit tests can import.
 */

export function canRevokeIndividualSession(input: {
  sessionId: string;
  currentSessionId: string;
}): boolean {
  return input.sessionId !== input.currentSessionId;
}

export function filterSessionsToRevokeOthers(input: {
  sessionIds: string[];
  currentSessionId: string;
}): string[] {
  return input.sessionIds.filter((id) => id !== input.currentSessionId);
}

export function sessionIdsOverCap(
  sessionIdsOldestFirst: string[],
  maxSessions: number,
): string[] {
  if (sessionIdsOldestFirst.length <= maxSessions) {
    return [];
  }
  const overflow = sessionIdsOldestFirst.length - maxSessions;
  return sessionIdsOldestFirst.slice(0, overflow);
}
