import { describe, expect, it } from 'vitest'
import { mockRoomChatAdapter } from './mockRoomChatAdapter'
import {
  appendMessageIfNew,
  canSendRoomChat,
  dedupeMessagesById,
  formatMessageTime,
  isValidChatContent,
} from './utils'
import type { RoomChatMessage } from './types'

const sampleMsg = (id: string, userId = 'u1'): RoomChatMessage => ({
  id,
  room_id: 'demo',
  user_id: userId,
  content: 'hello',
  created_at: '2026-05-17T15:34:00.000Z',
  author: { username: 'test', avatar_url: null },
})

describe('canSendRoomChat', () => {
  it('allows send in lounge', () => {
    expect(canSendRoomChat('lounge', 'focus')).toBe(true)
  })

  it('allows send in active break', () => {
    expect(canSendRoomChat('active', 'break')).toBe(true)
  })

  it('blocks send in active focus', () => {
    expect(canSendRoomChat('active', 'focus')).toBe(false)
  })

  it('blocks send in onboarding', () => {
    expect(canSendRoomChat('onboarding', 'break')).toBe(false)
  })
})

describe('formatMessageTime', () => {
  it('formats ISO time in pt-BR 24h', () => {
    const formatted = formatMessageTime('2026-05-17T15:34:00.000Z')
    expect(formatted).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns placeholder for invalid date', () => {
    expect(formatMessageTime('invalid')).toBe('--:--')
  })
})

describe('dedupeMessagesById', () => {
  it('removes duplicate ids keeping first', () => {
    const list = [sampleMsg('a'), sampleMsg('b'), sampleMsg('a')]
    expect(dedupeMessagesById(list)).toHaveLength(2)
    expect(dedupeMessagesById(list)[0].id).toBe('a')
  })
})

describe('appendMessageIfNew', () => {
  it('appends when id is new', () => {
    const prev = [sampleMsg('a')]
    const next = appendMessageIfNew(prev, sampleMsg('b'))
    expect(next).toHaveLength(2)
  })

  it('skips duplicate id', () => {
    const prev = [sampleMsg('a')]
    expect(appendMessageIfNew(prev, sampleMsg('a'))).toBe(prev)
  })
})

describe('isValidChatContent', () => {
  it('rejects empty and whitespace', () => {
    expect(isValidChatContent('')).toBe(false)
    expect(isValidChatContent('   ')).toBe(false)
  })

  it('accepts trimmed content within limit', () => {
    expect(isValidChatContent('  oi  ')).toBe(true)
    expect(isValidChatContent('x'.repeat(500))).toBe(true)
    expect(isValidChatContent('x'.repeat(501))).toBe(false)
  })
})

describe('mockRoomChatAdapter', () => {
  it('fetchRecent returns seeded demo messages', async () => {
    const roomId = `test-demo-${Date.now()}`
    const msgs = await mockRoomChatAdapter.fetchRecent(roomId)
    expect(msgs.length).toBe(0)

    await mockRoomChatAdapter.send(roomId, 'test message', 'demo-local-user')
    const after = await mockRoomChatAdapter.fetchRecent(roomId)
    expect(after.some((m) => m.content === 'test message')).toBe(true)
  })
})
