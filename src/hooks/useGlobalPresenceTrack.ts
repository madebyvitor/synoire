import { useEffect } from 'react'
import { useGlobalPresence } from '@/contexts/GlobalPresenceContext'
import type { GlobalPresenceTrackInput } from '@/lib/presence/globalPresence'

export type { GlobalPresenceTrackInput }

export function useGlobalPresenceTrack(input: GlobalPresenceTrackInput | null) {
  const { trackPresence } = useGlobalPresence()
  const status = input?.status ?? null
  const currentRoom = input?.current_room ?? null
  const roomId = input?.room_id ?? null

  useEffect(() => {
    if (!status) return
    trackPresence({
      status,
      current_room: currentRoom,
      room_id: roomId,
    })
  }, [status, currentRoom, roomId, trackPresence])
}
