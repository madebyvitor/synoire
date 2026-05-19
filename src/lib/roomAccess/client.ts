import { isSupabaseConfigured } from '@/lib/supabase'
import { isDemoMode } from '@/lib/hubRooms/demo'
import {
  grantRoomAccess as grantLocal,
  hasRoomAccess as hasLocal,
  listGrantsForRoom as listLocal,
  revokeRoomAccessGrant as revokeLocal,
} from './storage'
import { listIncomingRoomInvites } from './listIncomingRoomInvites'
import {
  grantRoomAccessSupabase,
  listRoomAccessSupabase,
  revokeRoomAccessSupabase,
} from './supabaseRoomAccess'
import type { IncomingRoomInvite, RoomAccessGrant, RoomAccessResult } from './types'

export { listIncomingRoomInvites } from './listIncomingRoomInvites'
export {
  subscribeRoomAccessRealtime,
  subscribeRoomAccessStorageSync,
} from './subscribeRoomAccessRealtime'
export type { IncomingRoomInvite } from './types'

function useSupabase(): boolean {
  return isSupabaseConfigured && !isDemoMode
}

export async function grantRoomAccess(
  roomId: string,
  userId: string,
): Promise<RoomAccessResult<RoomAccessGrant>> {
  if (useSupabase()) {
    return grantRoomAccessSupabase(roomId, userId)
  }
  const grant = grantLocal(roomId, userId)
  return { ok: true, data: grant }
}

export async function listRoomAccess(
  roomId: string,
): Promise<RoomAccessResult<RoomAccessGrant[]>> {
  if (useSupabase()) {
    return listRoomAccessSupabase(roomId)
  }
  return { ok: true, data: listLocal(roomId) }
}

export async function revokeRoomAccess(
  roomId: string,
  userId: string,
): Promise<RoomAccessResult<void>> {
  if (useSupabase()) {
    return revokeRoomAccessSupabase(roomId, userId)
  }
  revokeLocal(roomId, userId)
  return { ok: true, data: undefined }
}

export async function fetchIncomingRoomInvites(
  userId: string,
): Promise<RoomAccessResult<IncomingRoomInvite[]>> {
  return listIncomingRoomInvites(userId)
}

export async function hasRoomAccess(roomId: string, userId: string): Promise<boolean> {
  if (useSupabase()) {
    const result = await listRoomAccessSupabase(roomId)
    if (!result.ok) return false
    return result.data.some((g) => g.userId === userId)
  }
  return hasLocal(roomId, userId)
}
