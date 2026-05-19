import { describe, expect, it } from 'vitest'
import { parseGlobalPresenceState } from './globalPresence'

describe('parseGlobalPresenceState', () => {
  it('aggregates metas by user_id', () => {
    const state = {
      'key-a': [
        {
          user_id: 'user-a',
          status: 'focando',
          current_room: 'Informática • 50/10',
          room_id: 'room-1',
        },
      ],
      'key-b': [
        {
          user_id: 'user-b',
          status: 'online',
          current_room: null,
          room_id: null,
        },
      ],
    }

    const map = parseGlobalPresenceState(state)
    expect(map.size).toBe(2)
    expect(map.get('user-a')).toMatchObject({
      status: 'focando',
      current_room: 'Informática • 50/10',
      room_id: 'room-1',
    })
    expect(map.get('user-b')?.status).toBe('online')
  })

  it('ignores invalid metas', () => {
    const map = parseGlobalPresenceState({
      k: [{ user_id: '', status: 'focando' }, { status: 'unknown' }],
    })
    expect(map.size).toBe(0)
  })

  it('last meta wins for duplicate user_id', () => {
    const map = parseGlobalPresenceState({
      k1: [{ user_id: 'u1', status: 'online', current_room: null, room_id: null }],
      k2: [{ user_id: 'u1', status: 'focando', current_room: 'Sala • 25/5', room_id: 'r2' }],
    })
    expect(map.get('u1')?.status).toBe('focando')
  })
})
