import type { CreateRoomInput, HubRoomsAdapter, StudyRoom } from './types'
import { buildCreatePayload, filterVisibleRooms, validateTheme } from './utils'

const STORAGE_KEY = 'synoire-hub-rooms'
const CHANNEL_NAME = 'synoire-hub-rooms'

type Store = Record<string, StudyRoom>

const memoryStore: Store = {}

function loadStore(): Store {
  if (typeof localStorage === 'undefined') return { ...memoryStore }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...memoryStore }
    const parsed = JSON.parse(raw) as Store
    return { ...memoryStore, ...parsed }
  } catch {
    return { ...memoryStore }
  }
}

function saveStore(store: Store) {
  Object.assign(memoryStore, store)
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota or private mode
  }
}

function broadcastChange() {
  if (typeof BroadcastChannel === 'undefined') return
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.postMessage({ type: 'change' })
    ch.close()
  } catch {
    // unsupported
  }
}

function mutateRoom(
  roomId: string,
  updater: (room: StudyRoom) => StudyRoom,
): StudyRoom | null {
  const store = loadStore()
  const room = store[roomId]
  if (!room) return null
  const next = updater(room)
  store[roomId] = next
  saveStore(store)
  broadcastChange()
  return next
}

function createStudyRoom(input: CreateRoomInput): StudyRoom {
  const validation = validateTheme(input.theme)
  if (!validation.ok) throw new Error(validation.error)

  const now = new Date().toISOString()
  const payload = buildCreatePayload(input.hubSlug, validation.value, input.focusCycle, now)
  const room: StudyRoom = {
    id: crypto.randomUUID(),
    hub_slug: input.hubSlug,
    name: payload.name,
    theme: validation.value,
    focus_cycle: input.focusCycle,
    is_private: false,
    current_timer_state: payload.current_timer_state,
    present_count: 0,
    empty_since: now,
    created_at: now,
  }

  const store = loadStore()
  store[room.id] = room
  saveStore(store)
  broadcastChange()
  return room
}

export const mockHubRoomsAdapter: HubRoomsAdapter = {
  async listRooms(hubSlug) {
    const store = loadStore()
    const rooms = Object.values(store).filter((r) => r.hub_slug === hubSlug)
    return filterVisibleRooms(rooms).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  },

  async getRoom(roomId) {
    const store = loadStore()
    const room = store[roomId] ?? null
    if (!room || filterVisibleRooms([room]).length === 0) return null
    return room
  },

  async createRoom(input) {
    return createStudyRoom(input)
  },

  async startFocusTimer(roomId) {
    return mutateRoom(roomId, (room) => {
      if (room.current_timer_state.status !== 'idle') return room
      const now = new Date().toISOString()
      return {
        ...room,
        current_timer_state: {
          ...room.current_timer_state,
          status: 'focus',
          started_at: now,
        },
      }
    })
  },

  async advanceTimerPhase(roomId) {
    return mutateRoom(roomId, (room) => {
      const ts = room.current_timer_state
      if (ts.status === 'idle' || !ts.started_at) return room
      const now = new Date().toISOString()
      if (ts.status === 'focus') {
        return {
          ...room,
          current_timer_state: {
            ...ts,
            status: 'break',
            started_at: now,
          },
        }
      }
      return {
        ...room,
        current_timer_state: {
          ...ts,
          status: 'focus',
          started_at: now,
        },
      }
    })
  },

  async incrementPresence(roomId) {
    mutateRoom(roomId, (room) => ({
      ...room,
      present_count: room.present_count + 1,
      empty_since: null,
    }))
  },

  async decrementPresence(roomId) {
    mutateRoom(roomId, (room) => {
      const nextCount = Math.max(0, room.present_count - 1)
      return {
        ...room,
        present_count: nextCount,
        empty_since: nextCount === 0 ? new Date().toISOString() : room.empty_since,
      }
    })
  },

  subscribe(onChange) {
    if (typeof BroadcastChannel === 'undefined') return () => {}
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.onmessage = () => onChange()
    return () => ch.close()
  },
}
