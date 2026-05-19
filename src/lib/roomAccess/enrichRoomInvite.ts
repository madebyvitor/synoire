import { getHubRoomsAdapter } from '@/lib/hubRooms'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { IncomingRoomInvite, RoomAccessRow } from './types'

type RoomAccessInviteRow = {
  room_id: string
  created_at: string
  rooms: {
    id: string
    name: string
    is_private: boolean
    creator_id: string
  } | { id: string; name: string; is_private: boolean; creator_id: string }[] | null
}

function resolveRoom(rooms: RoomAccessInviteRow['rooms']) {
  if (!rooms) return null
  if (Array.isArray(rooms)) return rooms[0] ?? null
  return rooms
}

async function enrichFromSupabaseJoin(
  row: RoomAccessRow,
  invitedUserId: string,
): Promise<IncomingRoomInvite | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('room_access')
    .select('room_id, created_at, rooms(id, name, is_private, creator_id)')
    .eq('room_id', row.room_id)
    .eq('user_id', invitedUserId)
    .maybeSingle()

  if (error || !data) return null

  const accessRow = data as unknown as RoomAccessInviteRow
  const room = resolveRoom(accessRow.rooms)
  if (!room?.is_private) return null

  let inviterUsername = 'estudante'
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', room.creator_id)
    .maybeSingle()

  if (profile && typeof (profile as { username?: string }).username === 'string') {
    inviterUsername = (profile as { username: string }).username
  }

  return {
    roomId: accessRow.room_id,
    roomName: room.name,
    inviterUserId: room.creator_id,
    inviterUsername,
    grantedAt: accessRow.created_at,
  }
}

export async function enrichRoomAccessInvite(
  row: RoomAccessRow,
  invitedUserId: string,
): Promise<IncomingRoomInvite | null> {
  if (row.user_id !== invitedUserId) return null

  if (isSupabaseConfigured) {
    const fromJoin = await enrichFromSupabaseJoin(row, invitedUserId)
    if (fromJoin) return fromJoin
  }

  const room = await getHubRoomsAdapter().getRoom(row.room_id)
  if (!room?.is_private) return null

  let inviterUsername = 'estudante'
  if (isSupabaseConfigured) {
    const supabase = getSupabase()
    if (supabase) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', room.creator_id)
        .maybeSingle()
      if (data && typeof (data as { username?: string }).username === 'string') {
        inviterUsername = (data as { username: string }).username
      }
    }
  }

  return {
    roomId: row.room_id,
    roomName: room.name,
    inviterUserId: room.creator_id,
    inviterUsername,
    grantedAt: row.created_at,
  }
}
