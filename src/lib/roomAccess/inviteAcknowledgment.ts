const STORAGE_KEY = 'synoire_acknowledged_room_invites'

export function inviteAckKey(roomId: string, grantedAt: string): string {
  return `${roomId}:${grantedAt}`
}

function readKeys(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((k): k is string => typeof k === 'string'))
  } catch {
    return new Set()
  }
}

function writeKeys(keys: Set<string>): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]))
  } catch {
    // quota or private mode
  }
}

export function isRoomInviteAcknowledged(roomId: string, grantedAt: string): boolean {
  return readKeys().has(inviteAckKey(roomId, grantedAt))
}

export function acknowledgeRoomInvite(roomId: string, grantedAt: string): void {
  const keys = readKeys()
  keys.add(inviteAckKey(roomId, grantedAt))
  writeKeys(keys)
}

export function clearRoomInviteAcknowledgmentsForTests(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
