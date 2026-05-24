import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStudyRoom } from '@/hooks/useStudyRoom'
import { canJoinRoom, type CanJoinRoomResult } from '@/lib/roomAccess/canJoinRoom'
import type { StudyRoom } from '@/lib/hubRooms'

export type RoomEntryStatus =
  | 'loading'
  | 'ready'
  | 'denied_private'
  | 'not_found'
  | 'error'

export function useRoomEntry(roomId: string | undefined): {
  room: StudyRoom | null
  entryStatus: RoomEntryStatus
  entryMessage: string | null
  roomLoading: boolean
  presentCount: number
} {
  const { user } = useAuth()
  const { room, loading: roomLoading, presentCount } = useStudyRoom(roomId)
  const [joinResult, setJoinResult] = useState<CanJoinRoomResult | null>(null)
  const [joinLoading, setJoinLoading] = useState(Boolean(roomId && user?.id))

  useEffect(() => {
    if (!roomId) {
      setJoinResult(null)
      setJoinLoading(false)
      return
    }

    if (!user?.id) {
      setJoinResult({ status: 'denied_private' })
      setJoinLoading(false)
      return
    }

    let cancelled = false
    setJoinLoading(true)

    void canJoinRoom(roomId, user.id).then((result) => {
      if (!cancelled) {
        setJoinResult(result)
        setJoinLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [roomId, user?.id])

  const entryStatus = useMemo((): RoomEntryStatus => {
    if (!roomId) return 'not_found'
    if (roomLoading || joinLoading) return 'loading'

    if (joinResult?.status === 'error') return 'error'
    if (joinResult?.status === 'denied_private') return 'denied_private'
    if (joinResult?.status === 'not_found') return 'not_found'

    if (joinResult?.status === 'allowed') {
      if (room) return 'ready'
      return 'not_found'
    }

    return 'not_found'
  }, [roomId, roomLoading, joinLoading, joinResult, room])

  const entryMessage =
    joinResult?.status === 'error' ? joinResult.message : null

  return {
    room: entryStatus === 'ready' ? room : null,
    entryStatus,
    entryMessage,
    roomLoading: roomLoading || joinLoading,
    presentCount,
  }
}
