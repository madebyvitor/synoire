import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabaseRoomChatAdapter } from './supabaseRoomChatAdapter'
import { ROOM_CHAT_FETCH_LIMIT } from './types'

const singleMock = vi.fn()
const selectAfterInsertMock = vi.fn()
const insertMock = vi.fn()
const limitMock = vi.fn()
const orderMock = vi.fn()
const eqMock = vi.fn()
const selectFetchMock = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({
    from: fromMock,
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  }),
}))

describe('supabaseRoomChatAdapter', () => {
  beforeEach(() => {
    singleMock.mockReset()
    selectAfterInsertMock.mockReset()
    insertMock.mockReset()
    limitMock.mockReset()
    orderMock.mockReset()
    eqMock.mockReset()
    selectFetchMock.mockReset()
    fromMock.mockReset()

    singleMock.mockResolvedValue({ data: null, error: null })
    selectAfterInsertMock.mockReturnValue({ single: singleMock })
    insertMock.mockReturnValue({ select: selectAfterInsertMock })
    limitMock.mockResolvedValue({ data: [], error: null })
    orderMock.mockReturnValue({ limit: limitMock })
    eqMock.mockReturnValue({ order: orderMock })
    selectFetchMock.mockReturnValue({ eq: eqMock })
    fromMock.mockImplementation((table: string) => {
      if (table === 'messages') {
        return { select: selectFetchMock, insert: insertMock }
      }
      return { select: vi.fn() }
    })
  })

  it('fetchRecent queries messages with profile embed, order and limit', async () => {
    limitMock.mockResolvedValue({
      data: [
        {
          id: 'm1',
          room_id: 'room-1',
          user_id: 'u1',
          content: 'oi',
          created_at: '2026-05-18T12:00:00Z',
          profiles: { username: 'ana', avatar_url: null },
        },
      ],
      error: null,
    })

    const msgs = await supabaseRoomChatAdapter.fetchRecent('room-1')

    expect(fromMock).toHaveBeenCalledWith('messages')
    expect(selectFetchMock).toHaveBeenCalledWith('*, profiles(username, avatar_url)')
    expect(eqMock).toHaveBeenCalledWith('room_id', 'room-1')
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(limitMock).toHaveBeenCalledWith(ROOM_CHAT_FETCH_LIMIT)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].author.username).toBe('ana')
  })

  it('send inserts message with user id from caller and returns mapped row', async () => {
    singleMock.mockResolvedValue({
      data: {
        id: 'm2',
        room_id: 'room-1',
        user_id: 'user-abc',
        content: 'Bora focar',
        created_at: '2026-05-18T12:01:00Z',
        profiles: { username: 'você', avatar_url: null },
      },
      error: null,
    })

    const msg = await supabaseRoomChatAdapter.send('room-1', '  Bora focar  ', 'user-abc')

    expect(insertMock).toHaveBeenCalledWith({
      room_id: 'room-1',
      user_id: 'user-abc',
      content: 'Bora focar',
    })
    expect(selectAfterInsertMock).toHaveBeenCalledWith('*, profiles(username, avatar_url)')
    expect(msg.content).toBe('Bora focar')
    expect(msg.user_id).toBe('user-abc')
  })

  it('send rejects empty user id', async () => {
    await expect(supabaseRoomChatAdapter.send('room-1', 'oi', '')).rejects.toThrow(
      'Not authenticated',
    )
    expect(insertMock).not.toHaveBeenCalled()
  })
})
