import { useEffect, useMemo, useState } from 'react'
import { getHubRoomsAdapter, type StudyRoom } from '@/lib/hubRooms'
import { filterVisibleRooms } from '@/lib/hubRooms/utils'
import { useRoomPresence } from '@/hooks/useRoomPresence'

export function useStudyRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const { presentCount, emptySince } = useRoomPresence(roomId)

  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }

    setRoom(null)
    setLoading(true)

    const adapter = getHubRoomsAdapter()
    let cancelled = false

    const load = async () => {
      try {
        const r = await adapter.getRoom(roomId)
        if (!cancelled) setRoom(r)
        if (r && !cancelled) {
          const synced = await adapter.syncTimerCatchUp(roomId)
          if (!cancelled && synced) setRoom(synced)
        }
      } catch {
        if (!cancelled) setRoom(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const unsub = adapter.subscribe(() => {
      void load()
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [roomId])

  const roomWithPresence = useMemo(() => {
    if (!room) return null
    const merged: StudyRoom = {
      ...room,
      present_count: presentCount,
      empty_since: emptySince,
    }
    if (filterVisibleRooms([merged]).length === 0) return null
    return merged
  }, [room, presentCount, emptySince])

  return { room: roomWithPresence, loading, presentCount }
}
