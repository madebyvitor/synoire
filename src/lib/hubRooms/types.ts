export type FocusCycle = '25/5' | '50/10' | '90/15'

export type RoomTimerStatus = 'idle' | 'focus' | 'break' | 'long_break'

export type RoomTimerPayload = {
  status: RoomTimerStatus
  started_at: string | null
  focus_sec: number
  break_sec: number
  /** Completed focus segments in the current Pomodoro block (defaults to 0 if absent). */
  cycle_count?: number
}

/** JSONB column `current_timer_state` on `rooms`. */
export type PersistedTimerState = RoomTimerPayload & {
  focus_cycle: FocusCycle
}

/** Row from Supabase `rooms` table. */
export type RoomRow = {
  id: string
  hub_id: string
  name: string
  is_private: boolean
  creator_id: string
  current_timer_state: PersistedTimerState
  created_at: string
}

/** UI model — ephemeral presence fields are merged in hooks. */
export type StudyRoom = {
  id: string
  hub_slug: string
  name: string
  focus_cycle: FocusCycle
  is_private: boolean
  creator_id: string
  current_timer_state: RoomTimerPayload
  present_count: number
  empty_since: string | null
  created_at: string
}

export type RoomsResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: 'forbidden' }

export type CreateRoomInput = {
  hubSlug: string
  hubId: string
  creatorId: string
  theme: string
  focusCycle: FocusCycle
  isPrivate?: boolean
}

export type HubRoomsAdapter = {
  listRooms(hubSlug: string): Promise<StudyRoom[]>
  getRoom(roomId: string): Promise<StudyRoom | null>
  createRoom(input: CreateRoomInput): Promise<StudyRoom>
  startFocusTimer(roomId: string): Promise<StudyRoom | null>
  advanceTimerPhase(roomId: string): Promise<StudyRoom | null>
  /** Persists timer state after wall-clock catch-up (empty rooms, late joiners). */
  syncTimerCatchUp(roomId: string): Promise<StudyRoom | null>
  incrementPresence(roomId: string): Promise<void>
  decrementPresence(roomId: string): Promise<void>
  subscribe(onChange: () => void, hubSlug?: string): () => void
}

export const THEME_MAX_LENGTH = 25
export const ROOM_EMPTY_TTL_HOURS = 24
/** Fixed prep window before the first focus segment (any cycle). */
export const ROOM_PREP_SECONDS = 60

export const EMPTY_SINCE_STORAGE_KEY = 'synoire-room-empty-since'
