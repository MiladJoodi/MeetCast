/**
 * Maps application room IDs to LiveKit room names.
 * Clients never choose the LiveKit room name — the server derives it after authz.
 */
export function toLiveKitRoomName(applicationRoomId: string): string {
  return `meetcast_${applicationRoomId}`;
}
