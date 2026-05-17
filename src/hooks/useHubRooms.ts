import { useCallback, useEffect, useState } from 'react'
import {
  getHubRoomsAdapter,
  type CreateRoomInput,
  type FocusCycle,
  type StudyRoom,
} from '@/lib/hubRooms'

export function useHubRooms(hubSlug: string | undefined) {
  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const adapter = getHubRoomsAdapter()

  const refresh = useCallback(async () => {
    if (!hubSlug) {
      setRooms([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const list = await adapter.listRooms(hubSlug)
      setRooms(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar salas')
    } finally {
      setIsLoading(false)
    }
  }, [hubSlug, adapter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    return adapter.subscribe(() => {
      void refresh()
    })
  }, [adapter, refresh])

  const createRoom = useCallback(
    async (theme: string, focusCycle: FocusCycle) => {
      if (!hubSlug) throw new Error('Hub inválido')
      const input: CreateRoomInput = { hubSlug, theme, focusCycle }
      const room = await adapter.createRoom(input)
      await refresh()
      return room
    },
    [hubSlug, adapter, refresh],
  )

  return { rooms, isLoading, error, createRoom, refresh }
}
