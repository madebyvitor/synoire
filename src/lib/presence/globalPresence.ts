export const GLOBAL_PRESENCE_CHANNEL = 'global_presence'

export type GlobalPresenceStatus = 'online' | 'focando'

export type GlobalPresenceTrackInput = {
  status: GlobalPresenceStatus
  current_room: string | null
  room_id: string | null
}

export type GlobalPresencePayload = GlobalPresenceTrackInput & {
  user_id: string
  tracked_at: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** ISO timestamp for wire payloads; defaults to now. */
export function withTrackedAt(
  input: GlobalPresenceTrackInput,
  trackedAt: string = new Date().toISOString(),
): GlobalPresenceTrackInput & { tracked_at: string } {
  return { ...input, tracked_at: trackedAt }
}

function presenceTimestamp(payload: Pick<GlobalPresencePayload, 'tracked_at'>): number {
  if (!payload.tracked_at) return 0
  const ms = Date.parse(payload.tracked_at)
  return Number.isNaN(ms) ? 0 : ms
}

function parsePresenceMeta(meta: unknown): GlobalPresencePayload | null {
  if (!isRecord(meta)) return null
  const userId = meta.user_id
  const status = meta.status
  if (typeof userId !== 'string' || !userId) return null
  if (status !== 'online' && status !== 'focando') return null

  const tracked_at =
    typeof meta.tracked_at === 'string' ? meta.tracked_at : ''

  return {
    user_id: userId,
    status,
    current_room: typeof meta.current_room === 'string' ? meta.current_room : null,
    room_id: typeof meta.room_id === 'string' ? meta.room_id : null,
    tracked_at,
  }
}

function presenceRank(status: GlobalPresenceStatus): number {
  return status === 'focando' ? 2 : 1
}

/** Merges two payloads for the same user; most recent tracked_at wins. */
export function mergePresenceForUser(
  existing: GlobalPresencePayload | undefined,
  incoming: GlobalPresencePayload,
): GlobalPresencePayload {
  if (!existing) return incoming

  const existingMs = presenceTimestamp(existing)
  const incomingMs = presenceTimestamp(incoming)

  if (incomingMs > existingMs) return incoming
  if (incomingMs < existingMs) return existing

  // Same timestamp (rare): prefer focando for active room display.
  if (presenceRank(incoming.status) > presenceRank(existing.status)) return incoming
  if (presenceRank(incoming.status) < presenceRank(existing.status)) return existing

  return incoming
}

export function isSamePresencePayload(
  a: GlobalPresenceTrackInput,
  b: GlobalPresenceTrackInput | null | undefined,
): boolean {
  if (!b) return false
  return (
    a.status === b.status &&
    a.current_room === b.current_room &&
    a.room_id === b.room_id
  )
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
      if (!parsed) continue
      map.set(parsed.user_id, mergePresenceForUser(map.get(parsed.user_id), parsed))
    }
  }

  return map
}
