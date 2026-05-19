import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { isDemoMode } from '@/lib/hubRooms/demo'
import { isForbiddenError, mapRoomQueryError } from '@/lib/hubRooms/errors'
import { isRoomInviteAcknowledged } from './inviteAcknowledgment'
import { listGrantsForUser } from './storage'
import type { IncomingRoomInvite, RoomAccessResult } from './types'

type RoomAccessIncomingRow = {
  room_id: string
  created_at: string
  rooms: {
    id: string
    name: string
    is_private: boolean
    creator_id: string
  } | { id: string; name: string; is_private: boolean; creator_id: string }[] | null
}

async function fetchCreatorUsernames(
  creatorIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (creatorIds.length === 0) return map

  const supabase = getSupabase()
  if (!supabase) return map

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', creatorIds)

  if (error || !data) return map
  for (const row of data as { id: string; username: string }[]) {
    map.set(row.id, row.username)
  }
  return map
}

type ResolvedRoom = {
  id: string
  name: string
  is_private: boolean
  creator_id: string
}

function resolveRoom(rooms: RoomAccessIncomingRow['rooms']): ResolvedRoom | null {
  if (!rooms) return null
  if (Array.isArray(rooms)) return rooms[0] ?? null
  return rooms
}

function mapRowsToInvites(
  rows: RoomAccessIncomingRow[],
  creators: Map<string, string>,
): IncomingRoomInvite[] {
  const invites: IncomingRoomInvite[] = []
  for (const row of rows) {
    const room = resolveRoom(row.rooms)
    if (!room?.is_private) continue
    if (isRoomInviteAcknowledged(row.room_id, row.created_at)) continue
    invites.push({
      roomId: row.room_id,
      roomName: room.name,
      inviterUserId: room.creator_id,
      inviterUsername: creators.get(room.creator_id) ?? 'estudante',
      grantedAt: row.created_at,
    })
  }
  return invites
}

export async function listIncomingRoomInvitesSupabase(
  userId: string,
): Promise<RoomAccessResult<IncomingRoomInvite[]>> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data, error } = await supabase
    .from('room_access')
    .select('room_id, created_at, rooms(id, name, is_private, creator_id)')
    .eq('user_id', userId)

  if (error) {
    if (import.meta.env.DEV) console.error('[roomAccess listIncoming]', error)
    if (isForbiddenError(error)) {
      return { ok: false, message: mapRoomQueryError(error.message), code: 'forbidden' }
    }
    return { ok: false, message: mapRoomQueryError(error.message) }
  }

  const rows = (data ?? []) as unknown as RoomAccessIncomingRow[]
  const creatorIds = [
    ...new Set(
      rows
        .map((r) => resolveRoom(r.rooms)?.creator_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const creators = await fetchCreatorUsernames(creatorIds)
  return { ok: true, data: mapRowsToInvites(rows, creators) }
}

function listIncomingRoomInvitesLocal(userId: string): IncomingRoomInvite[] {
  return listGrantsForUser(userId)
    .filter((g) => !isRoomInviteAcknowledged(g.roomId, g.grantedAt))
    .map((g) => ({
      roomId: g.roomId,
      roomName: g.roomName ?? 'Sala privada',
      inviterUserId: g.inviterUserId ?? '',
      inviterUsername: g.inviterUsername ?? 'estudante',
      grantedAt: g.grantedAt,
    }))
}

export async function listIncomingRoomInvites(
  userId: string,
): Promise<RoomAccessResult<IncomingRoomInvite[]>> {
  if (isDemoMode || !isSupabaseConfigured) {
    return { ok: true, data: listIncomingRoomInvitesLocal(userId) }
  }
  return listIncomingRoomInvitesSupabase(userId)
}
