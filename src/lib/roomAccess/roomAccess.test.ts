import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearRoomAccessForTests,
  grantRoomAccess as grantLocal,
  hasRoomAccess as hasLocal,
  listGrantsForRoom,
} from './storage'
import { grantRoomAccess as grantClient, listRoomAccess } from './client'
import { grantRoomAccessSupabase } from './supabaseRoomAccess'

const singleMock = vi.fn()
const selectMock = vi.fn()
const insertMock = vi.fn()
const eqMock = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({
    from: fromMock,
  }),
}))

vi.mock('@/lib/hubRooms/demo', () => ({
  isDemoMode: false,
}))

describe('roomAccess storage (demo)', () => {
  beforeEach(() => {
    clearRoomAccessForTests()
  })

  it('dedupes grants', () => {
    const first = grantLocal('room-1', 'user-vitor')
    const second = grantLocal('room-1', 'user-vitor')
    expect(first.userId).toBe(second.userId)
    expect(listGrantsForRoom('room-1')).toHaveLength(1)
    expect(hasLocal('room-1', 'user-vitor')).toBe(true)
    expect(hasLocal('room-1', 'user-carla')).toBe(false)
  })
})

describe('roomAccess client (supabase)', () => {
  beforeEach(() => {
    fromMock.mockReset()
    insertMock.mockReset()
    selectMock.mockReset()
    eqMock.mockReset()
    singleMock.mockReset()
  })

  it('grants access via supabase', async () => {
    fromMock.mockReturnValue({ insert: insertMock })
    insertMock.mockReturnValue({ select: selectMock })
    selectMock.mockReturnValue({ single: singleMock })
    singleMock.mockResolvedValue({
      data: {
        room_id: 'room-1',
        user_id: 'user-vitor',
        created_at: '2026-05-16T12:00:00.000Z',
        profiles: { username: 'vitor', avatar_url: null },
      },
      error: null,
    })

    const result = await grantClient('room-1', 'user-vitor')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.userId).toBe('user-vitor')
      expect(result.data.username).toBe('vitor')
    }
  })

  it('lists access rows', async () => {
    fromMock.mockReturnValue({ select: selectMock })
    selectMock.mockReturnValue({ eq: eqMock })
    eqMock.mockResolvedValue({
      data: [
        {
          room_id: 'room-a',
          user_id: 'user-vitor',
          created_at: '2026-05-16T12:00:00.000Z',
          profiles: { username: 'vitor', avatar_url: null },
        },
      ],
      error: null,
    })

    const result = await listRoomAccess('room-a')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toHaveLength(1)
    }
  })
})

describe('grantRoomAccessSupabase duplicate', () => {
  beforeEach(() => {
    fromMock.mockReset()
    insertMock.mockReset()
    selectMock.mockReset()
    singleMock.mockReset()
  })

  it('treats unique violation as already granted', async () => {
    fromMock.mockReturnValue({ insert: insertMock })
    insertMock.mockReturnValue({ select: selectMock })
    selectMock.mockReturnValue({ single: singleMock })
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    })

    const result = await grantRoomAccessSupabase('room-1', 'user-vitor')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.alreadyGranted).toBe(true)
      expect(result.data.userId).toBe('user-vitor')
    }
  })
})
