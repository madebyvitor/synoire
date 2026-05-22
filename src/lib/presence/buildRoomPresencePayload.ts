import type { StudyRoom } from '@/lib/hubRooms/types'
import type { GlobalPresenceTrackInput } from './globalPresence'

export type RoomPresenceTrackInput = GlobalPresenceTrackInput

export function buildRoomPresencePayload(room: StudyRoom): RoomPresenceTrackInput {
  if (room.is_private) {
    return {
      status: 'focando',
      current_room: 'Sala privada',
      room_id: null,
    }
  }
  return {
    status: 'focando',
    current_room: room.name,
    room_id: room.id,
  }
}
