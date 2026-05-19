export const GLOBAL_PRESENCE_CHANNEL = 'global_presence'

export type GlobalPresenceStatus = 'online' | 'focando'

export type GlobalPresencePayload = {
  user_id: string
  status: GlobalPresenceStatus
  current_room: string | null
  room_id: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePresenceMeta(meta: unknown): GlobalPresencePayload | null {
  if (!isRecord(meta)) return null
  const userId = meta.user_id
  const status = meta.status
  if (typeof userId !== 'string' || !userId) return null
  if (status !== 'online' && status !== 'focando') return null

  return {
    user_id: userId,
    status,
    current_room: typeof meta.current_room === 'string' ? meta.current_room : null,
    room_id: typeof meta.room_id === 'string' ? meta.room_id : null,
  }
}

/** Aggregates Supabase presenceState() into one entry per user_id. */
export function parseGlobalPresenceState(
  state: Record<string, unknown[]>,
): Map<string, GlobalPresencePayload> {
  const map = new Map<string, GlobalPresencePayload>()

  for (const metas of Object.values(state)) {
    if (!Array.isArray(metas)) continue
    for (const meta of metas) {
      const parsed = parsePresenceMeta(meta)
      if (parsed) map.set(parsed.user_id, parsed)
    }
  }

  return map
}
