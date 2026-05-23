import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createStudySession,
  listUserStudySessions,
  type StudySessionView,
} from '@/lib/studySessions'

export function useStudySessions() {
  const { user, isSessionReady } = useAuth()
  const [sessions, setSessions] = useState<StudySessionView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const refresh = useCallback(async () => {
    const userId = user?.id
    if (!userId) {
      setSessions([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await listUserStudySessions(userId)
    if (result.ok) {
      setSessions(result.data)
      setError(null)
    } else {
      setSessions([])
      setError(result.message)
    }
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!isSessionReady) return
    void refresh()
  }, [isSessionReady, refresh])

  const recordSession = useCallback(
    async (
      roomId: string,
      durationMinutes: number,
    ): Promise<{ ok: true; data: StudySessionView } | { ok: false; message: string }> => {
      const userId = user?.id
      if (!userId) {
        return { ok: false, message: 'Entre na sua conta para registrar a sessão.' }
      }

      setIsRecording(true)
      const result = await createStudySession(userId, { roomId, durationMinutes })
      setIsRecording(false)

      if (result.ok) {
        setSessions((prev) => [result.data, ...prev])
        setError(null)
        return { ok: true, data: result.data }
      }
      return { ok: false, message: result.message }
    },
    [user?.id],
  )

  return {
    sessions,
    isLoading: !isSessionReady || isLoading,
    error,
    isRecording,
    refresh,
    recordSession,
  }
}
