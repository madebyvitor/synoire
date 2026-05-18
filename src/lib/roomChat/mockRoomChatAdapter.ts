import type { RoomChatAdapter, RoomChatMessage } from './types'
import { DEMO_PEER_USER_ID, DEMO_USER_ID } from './types'

const STORAGE_KEY = 'synoire-room-chat'
const CHANNEL_NAME = 'synoire-room-chat'

type StoredRooms = Record<string, RoomChatMessage[]>

type BroadcastPayload = {
  type: 'insert'
  message: RoomChatMessage
}

const memoryStore: StoredRooms = {}

function loadStore(): StoredRooms {
  if (typeof sessionStorage === 'undefined') return { ...memoryStore }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...memoryStore }
    const parsed = JSON.parse(raw) as StoredRooms
    return { ...memoryStore, ...parsed }
  } catch {
    return { ...memoryStore }
  }
}

function saveStore(store: StoredRooms) {
  Object.assign(memoryStore, store)
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota or private mode
  }
}

function getRoomMessages(store: StoredRooms, roomId: string): RoomChatMessage[] {
  return store[roomId] ?? []
}

function seedDemoMessages(roomId: string): RoomChatMessage[] {
  const now = Date.now()
  return [
    {
      id: `seed-${roomId}-1`,
      room_id: roomId,
      user_id: DEMO_PEER_USER_ID,
      content: 'Boa sessão — foco no edital de hoje.',
      created_at: new Date(now - 8 * 60_000).toISOString(),
      author: { username: 'marina_foco', avatar_url: null },
    },
    {
      id: `seed-${roomId}-2`,
      room_id: roomId,
      user_id: DEMO_PEER_USER_ID,
      content: 'Na pausa a gente troca uma ideia rápida.',
      created_at: new Date(now - 3 * 60_000).toISOString(),
      author: { username: 'marina_foco', avatar_url: null },
    },
  ]
}

function ensureSeeded(store: StoredRooms, roomId: string): RoomChatMessage[] {
  let list = getRoomMessages(store, roomId)
  if (list.length === 0 && roomId === 'demo') {
    list = seedDemoMessages(roomId)
    store[roomId] = list
    saveStore(store)
  }
  return list
}

function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(CHANNEL_NAME)
}

export const mockRoomChatAdapter: RoomChatAdapter = {
  async fetchRecent(roomId, limit = 50) {
    const store = loadStore()
    const list = ensureSeeded(store, roomId)
    return [...list]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, limit)
      .reverse()
  },

  async send(roomId, content, userId) {
    const trimmed = content.trim()
    if (!trimmed) throw new Error('Empty message')

    const message: RoomChatMessage = {
      id: createId(),
      room_id: roomId,
      user_id: userId || DEMO_USER_ID,
      content: trimmed,
      created_at: new Date().toISOString(),
      author: { username: 'você', avatar_url: null },
    }

    const store = loadStore()
    const list = ensureSeeded(store, roomId)
    store[roomId] = [...list, message]
    saveStore(store)

    const channel = getBroadcastChannel()
    channel?.postMessage({ type: 'insert', message } satisfies BroadcastPayload)
    channel?.close()

    return message
  },

  subscribe(roomId, onInsert) {
    const channel = getBroadcastChannel()
    if (!channel) return () => {}

    const handler = (event: MessageEvent<BroadcastPayload>) => {
      const data = event.data
      if (data?.type !== 'insert') return
      if (data.message.room_id !== roomId) return
      onInsert(data.message)
    }

    channel.addEventListener('message', handler)
    return () => {
      channel.removeEventListener('message', handler)
      channel.close()
    }
  },
}
