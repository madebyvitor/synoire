import { useEffect, useMemo, useRef } from 'react'
import { useGlobalPresence } from '@/contexts/GlobalPresenceContext'
import type { StudyRoom } from '@/lib/hubRooms/types'
import {
  ONLINE_PRESENCE,
  resolveAuthenticatedPresence,
} from '@/lib/presence/resolveAuthenticatedPresence'

export type UseAuthenticatedGlobalPresenceOptions = {
  enabled?: boolean
  pathname: string
  roomId?: string | undefined
  room?: StudyRoom | null
  /** When true, publishes ONLINE on unmount if the hook was enabled (e.g. leaving a room). */
  resetToOnlineOnUnmount?: boolean
}

export function useAuthenticatedGlobalPresence({
  enabled = true,
  pathname,
  roomId,
  room = null,
  resetToOnlineOnUnmount = true,
}: UseAuthenticatedGlobalPresenceOptions): void {
  const { trackPresence } = useGlobalPresence()
  const enabledRef = useRef(enabled)
  const resetOnUnmountRef = useRef(resetToOnlineOnUnmount)
  enabledRef.current = enabled
  resetOnUnmountRef.current = resetToOnlineOnUnmount

  const payload = useMemo(
    () =>
      enabled
        ? resolveAuthenticatedPresence({ pathname, roomId, room })
        : null,
    [enabled, pathname, roomId, room?.id, room?.name, room?.is_private],
  )

  const status = payload?.status ?? null
  const currentRoom = payload?.current_room ?? null
  const trackedRoomId = payload?.room_id ?? null

  useEffect(() => {
    if (!status) return
    trackPresence({
      status,
      current_room: currentRoom,
      room_id: trackedRoomId,
    })
  }, [status, currentRoom, trackedRoomId, trackPresence])

  useEffect(() => {
    return () => {
      if (enabledRef.current && resetOnUnmountRef.current) {
        trackPresence(ONLINE_PRESENCE)
      }
    }
  }, [trackPresence])
}
