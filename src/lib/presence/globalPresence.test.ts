import { describe, expect, it } from 'vitest'
import {
  isSamePresencePayload,
  mergePresenceForUser,
  parseGlobalPresenceState,
} from './globalPresence'
import type { GlobalPresenceTrackInput } from './globalPresence'

const T_OLD = '2026-05-20T10:00:00.000Z'
const T_MID = '2026-05-20T11:00:00.000Z'
const T_NEW = '2026-05-20T12:00:00.000Z'

describe('parseGlobalPresenceState', () => {
  it('aggregates metas by user_id', () => {
    const state = {
      'key-a': [
        {
          user_id: 'user-a',
          status: 'focando',
          current_room: 'Informática • 50/10',
          room_id: 'room-1',
          tracked_at: T_NEW,
        },
      ],
      'key-b': [
        {
          user_id: 'user-b',
          status: 'online',
          current_room: null,
          room_id: null,
          tracked_at: T_NEW,
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

  it('prefers newer online over stale focando', () => {
    const map = parseGlobalPresenceState({
      'user-1:tab-a': [
        {
          user_id: 'u1',
          status: 'focando',
          current_room: 'Sala A',
          room_id: 'r1',
          tracked_at: T_OLD,
        },
      ],
      'user-1:tab-b': [
        {
          user_id: 'u1',
          status: 'online',
          current_room: null,
          room_id: null,
          tracked_at: T_NEW,
        },
      ],
    })
    expect(map.get('u1')?.status).toBe('online')
  })

  it('prefers newer focando room B over stale focando room A', () => {
    const map = parseGlobalPresenceState({
      k1: [
        {
          user_id: 'u1',
          status: 'focando',
          current_room: 'Sala A',
          room_id: 'r1',
          tracked_at: T_OLD,
        },
      ],
      k2: [
        {
          user_id: 'u1',
          status: 'focando',
          current_room: 'Sala B',
          room_id: 'r2',
          tracked_at: T_NEW,
        },
      ],
    })
    expect(map.get('u1')).toMatchObject({
      status: 'focando',
      current_room: 'Sala B',
      room_id: 'r2',
    })
  })

  it('legacy meta without tracked_at loses to online with tracked_at', () => {
    const map = parseGlobalPresenceState({
      legacy: [
        {
          user_id: 'u1',
          status: 'focando',
          current_room: 'Stale',
          room_id: 'r1',
        },
      ],
      current: [
        {
          user_id: 'u1',
          status: 'online',
          current_room: null,
          room_id: null,
          tracked_at: T_MID,
        },
      ],
    })
    expect(map.get('u1')?.status).toBe('online')
  })
})

describe('mergePresenceForUser', () => {
  it('newer online beats older focando', () => {
    const merged = mergePresenceForUser(
      {
        user_id: 'u1',
        status: 'focando',
        current_room: 'Sala',
        room_id: 'r1',
        tracked_at: T_OLD,
      },
      {
        user_id: 'u1',
        status: 'online',
        current_room: null,
        room_id: null,
        tracked_at: T_NEW,
      },
    )
    expect(merged.status).toBe('online')
  })

  it('newer focando beats older online', () => {
    const merged = mergePresenceForUser(
      {
        user_id: 'u1',
        status: 'online',
        current_room: null,
        room_id: null,
        tracked_at: T_OLD,
      },
      {
        user_id: 'u1',
        status: 'focando',
        current_room: 'Sala',
        room_id: 'r1',
        tracked_at: T_NEW,
      },
    )
    expect(merged.status).toBe('focando')
  })
})

describe('isSamePresencePayload', () => {
  it('compares status and room fields', () => {
    const a: GlobalPresenceTrackInput = {
      status: 'online',
      current_room: null,
      room_id: null,
    }
    expect(isSamePresencePayload(a, a)).toBe(true)
    expect(
      isSamePresencePayload(a, {
        status: 'focando',
        current_room: null,
        room_id: null,
      }),
    ).toBe(false)
  })
})
