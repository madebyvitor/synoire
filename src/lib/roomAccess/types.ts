export const ROOM_ACCESS_STORAGE_KEY = 'synoire_room_access'

export type RoomAccessGrant = {
  roomId: string
  userId: string
  grantedAt: string
  username?: string
  avatarUrl?: string | null
  roomName?: string
  inviterUserId?: string
  inviterUsername?: string
}

export type IncomingRoomInvite = {
  roomId: string
  roomName: string
  inviterUserId: string
  inviterUsername: string
  grantedAt: string
}

export type RoomAccessRow = {
  room_id: string
  user_id: string
  created_at: string
  profiles?: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null
}

export type RoomAccessResult<T> =
  | { ok: true; data: T; alreadyGranted?: boolean }
  | { ok: false; message: string; code?: 'forbidden' }
