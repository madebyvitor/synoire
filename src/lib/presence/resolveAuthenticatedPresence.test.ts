import { describe, expect, it } from 'vitest'
import {
  ENTERING_ROOM_LABEL,
  ONLINE_PRESENCE,
  resolveAuthenticatedPresence,
} from './resolveAuthenticatedPresence'

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
  present_count: 3,
  empty_since: null,
  created_at: '2026-05-16T12:00:00.000Z',
}

describe('resolveAuthenticatedPresence', () => {
  it('returns online outside room routes', () => {
    expect(
      resolveAuthenticatedPresence({ pathname: '/painel' }),
    ).toEqual(ONLINE_PRESENCE)
  })

  it('returns entering focando when on room route before room loads', () => {
    expect(
      resolveAuthenticatedPresence({
        pathname: '/salas/room-1',
      }),
    ).toEqual({
      status: 'focando',
      current_room: ENTERING_ROOM_LABEL,
      room_id: 'room-1',
    })
  })

  it('returns entering focando when only roomId is provided', () => {
    expect(
      resolveAuthenticatedPresence({
        pathname: '/painel',
        roomId: 'room-2',
      }),
    ).toEqual({
      status: 'focando',
      current_room: ENTERING_ROOM_LABEL,
      room_id: 'room-2',
    })
  })

  it('uses loaded room for focando payload', () => {
    expect(
      resolveAuthenticatedPresence({
        pathname: '/salas/room-1',
        room: baseRoom,
      }),
    ).toEqual({
      status: 'focando',
      current_room: 'Direito • 25/5',
      room_id: 'room-1',
    })
  })

  it('does not change payload when only present_count differs', () => {
    const withCount = resolveAuthenticatedPresence({
      pathname: '/salas/room-1',
      room: { ...baseRoom, present_count: 1 },
    })
    const withOtherCount = resolveAuthenticatedPresence({
      pathname: '/salas/room-1',
      room: { ...baseRoom, present_count: 99 },
    })
    expect(withCount).toEqual(withOtherCount)
  })
})
