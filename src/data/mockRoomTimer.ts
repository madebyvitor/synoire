import type { RoomTimerState } from '@/lib/roomTimer'

function hashRoomId(roomId: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < roomId.length; i++) {
    h ^= roomId.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const MOCK_PRESENT = 128

/**
 * Deterministic mock timer state so demo rooms always show a believable
 * mid-cycle (e.g. ~12 min left in focus). Replace with Supabase fetch +
 * Realtime subscription when backend is ready.
 */
export function getMockRoomTimerState(roomId: string | undefined): RoomTimerState {
  const id = roomId ?? 'demo'
  const hash = hashRoomId(id)
  const elapsedIntoFocus = 13 * 60 + (hash % (8 * 60))
  const startedAt = new Date(Date.now() - elapsedIntoFocus * 1000).toISOString()

  return {
    phase: 'focus',
    startedAt,
    presentCount: MOCK_PRESENT,
  }
}

export { MOCK_PRESENT }
