import type { StudyRoom } from '@/lib/hubRooms/types'
import type { GlobalPresenceTrackInput } from './globalPresence'
import { buildRoomPresencePayload } from './buildRoomPresencePayload'

export const ONLINE_PRESENCE: GlobalPresenceTrackInput = {
  status: 'online',
  current_room: null,
  room_id: null,
}

export const ENTERING_ROOM_LABEL = 'Entrando na sala…'

const IN_ROOM_PATH = /^\/salas\/([^/]+)/

export function isRoomPath(pathname: string): boolean {
  return IN_ROOM_PATH.test(pathname)
}

export function roomIdFromPath(pathname: string): string | null {
  const match = pathname.match(IN_ROOM_PATH)
  return match?.[1] ?? null
}

export type ResolveAuthenticatedPresenceInput = {
  pathname: string
  roomId?: string | undefined
  room?: StudyRoom | null
}

/** Maps route + optional loaded room to the global presence payload to publish. */
export function resolveAuthenticatedPresence(
  input: ResolveAuthenticatedPresenceInput,
): GlobalPresenceTrackInput {
  const pathRoomId = roomIdFromPath(input.pathname)
  const inRoom = pathRoomId !== null || Boolean(input.roomId)

  if (!inRoom) {
    return ONLINE_PRESENCE
  }

  if (input.room) {
    return buildRoomPresencePayload(input.room)
  }

  const effectiveRoomId = input.roomId ?? pathRoomId
  if (effectiveRoomId) {
    return {
      status: 'focando',
      current_room: ENTERING_ROOM_LABEL,
      room_id: effectiveRoomId,
    }
  }

  return ONLINE_PRESENCE
}
