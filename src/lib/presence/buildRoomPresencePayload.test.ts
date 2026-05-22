import { describe, expect, it } from 'vitest'
import { buildRoomPresencePayload } from './buildRoomPresencePayload'

const baseRoom = {
  id: 'room-1',
  hub_slug: 'trt',
  name: 'Direito • 25/5',
  focus_cycle: '25/5' as const,
  is_private: false,
  creator_id: 'u1',
  current_timer_state: {
    status: 'idle' as const,
    started_at: '2026-05-16T12:00:00.000Z',
    focus_sec: 1500,
    break_sec: 300,
  },
  present_count: 1,
  empty_since: null,
  created_at: '2026-05-16T12:00:00.000Z',
}

describe('buildRoomPresencePayload', () => {
  it('uses room name and id for public rooms', () => {
    expect(buildRoomPresencePayload(baseRoom)).toEqual({
      status: 'focando',
      current_room: 'Direito • 25/5',
      room_id: 'room-1',
    })
  })

  it('redacts private rooms without joinable room_id', () => {
    expect(buildRoomPresencePayload({ ...baseRoom, is_private: true })).toEqual({
      status: 'focando',
      current_room: 'Sala privada',
      room_id: null,
    })
  })
})
