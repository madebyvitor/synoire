export type FocusCycle = '25/5' | '50/10' | '90/15'

export type RoomTimerStatus = 'idle' | 'focus' | 'break'

export type RoomTimerPayload = {
  status: RoomTimerStatus
  started_at: string | null
  focus_sec: number
  break_sec: number
}

export type StudyRoom = {
  id: string
  hub_slug: string
  name: string
  theme: string
  focus_cycle: FocusCycle
  is_private: boolean
  current_timer_state: RoomTimerPayload
  present_count: number
  empty_since: string | null
  created_at: string
}

export type CreateRoomInput = {
  hubSlug: string
  theme: string
  focusCycle: FocusCycle
}

export type HubRoomsAdapter = {
  listRooms(hubSlug: string): Promise<StudyRoom[]>
  getRoom(roomId: string): Promise<StudyRoom | null>
  createRoom(input: CreateRoomInput): Promise<StudyRoom>
  startFocusTimer(roomId: string): Promise<StudyRoom | null>
  advanceTimerPhase(roomId: string): Promise<StudyRoom | null>
  incrementPresence(roomId: string): Promise<void>
  decrementPresence(roomId: string): Promise<void>
  subscribe(onChange: () => void): () => void
}

export const THEME_MAX_LENGTH = 25
export const ROOM_EMPTY_TTL_HOURS = 24
/** Fixed prep window before the first focus segment (any cycle). */
export const ROOM_PREP_SECONDS = 60
