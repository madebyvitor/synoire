import { useEffect, useState } from 'react'
import { getHubRoomsAdapter, type StudyRoom } from '@/lib/hubRooms'

export function useStudyRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }

    const adapter = getHubRoomsAdapter()
    let cancelled = false

    const load = async () => {
      try {
        const r = await adapter.getRoom(roomId)
        if (!cancelled) setRoom(r)
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

  useEffect(() => {
    if (!roomId) return
    const adapter = getHubRoomsAdapter()
    void adapter.incrementPresence(roomId)

    const onUnload = () => {
      void adapter.decrementPresence(roomId)
    }
    window.addEventListener('beforeunload', onUnload)

    return () => {
      window.removeEventListener('beforeunload', onUnload)
      void adapter.decrementPresence(roomId)
    }
  }, [roomId])

  return { room, loading }
}
