import { ROOM_ACCESS_STORAGE_KEY, type RoomAccessGrant } from './types'

export const ROOM_ACCESS_CHANGED_EVENT = 'synoire:room-access-changed'

export type RoomAccessLocalChange =
  | { type: 'INSERT'; grant: RoomAccessGrant }
  | { type: 'DELETE'; roomId: string; userId: string }

function notifyRoomAccessChanged(detail: RoomAccessLocalChange): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ROOM_ACCESS_CHANGED_EVENT, { detail }))
}

function readGrants(): RoomAccessGrant[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(ROOM_ACCESS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidGrant)
  } catch {
    return []
  }
}

function writeGrants(grants: RoomAccessGrant[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(ROOM_ACCESS_STORAGE_KEY, JSON.stringify(grants))
  } catch {
    // quota or private mode
  }
}

function isValidGrant(item: unknown): item is RoomAccessGrant {
  if (!item || typeof item !== 'object') return false
  const g = item as RoomAccessGrant
  return (
    typeof g.roomId === 'string' &&
    typeof g.userId === 'string' &&
    typeof g.grantedAt === 'string'
  )
}

export function grantRoomAccess(roomId: string, userId: string): RoomAccessGrant {
  const grants = readGrants()
  const existing = grants.find((g) => g.roomId === roomId && g.userId === userId)
  if (existing) return existing

  const grant: RoomAccessGrant = {
    roomId,
    userId,
    grantedAt: new Date().toISOString(),
  }
  writeGrants([...grants, grant])
  notifyRoomAccessChanged({ type: 'INSERT', grant })
  return grant
}

export function hasRoomAccess(roomId: string, userId: string): boolean {
  return readGrants().some((g) => g.roomId === roomId && g.userId === userId)
}

export function listGrantsForRoom(roomId: string): RoomAccessGrant[] {
  return readGrants().filter((g) => g.roomId === roomId)
}

export function listGrantsForUser(userId: string): RoomAccessGrant[] {
  return readGrants().filter((g) => g.userId === userId)
}

export function revokeRoomAccessGrant(roomId: string, userId: string): boolean {
  const grants = readGrants()
  const next = grants.filter((g) => !(g.roomId === roomId && g.userId === userId))
  if (next.length === grants.length) return false
  writeGrants(next)
  notifyRoomAccessChanged({ type: 'DELETE', roomId, userId })
  return true
}

export function clearRoomAccessForTests(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(ROOM_ACCESS_STORAGE_KEY)
}
