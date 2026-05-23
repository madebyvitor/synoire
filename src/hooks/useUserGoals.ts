import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { minutesForGoal } from '@/lib/dashboard/studyAnalytics'
import {
  createUserGoal,
  listUserGoals,
  type CreateUserGoalInput,
  type UserGoalView,
} from '@/lib/goals'
import { listUserStudySessions } from '@/lib/studySessions'

export function useUserGoals() {
  const { user, isSessionReady } = useAuth()
  const [goals, setGoals] = useState<UserGoalView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const refresh = useCallback(async () => {
    const userId = user?.id
    if (!userId) {
      setGoals([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const [goalsResult, sessionsResult] = await Promise.all([
      listUserGoals(userId),
      listUserStudySessions(userId),
    ])

    if (goalsResult.ok) {
      const sessions = sessionsResult.ok ? sessionsResult.data : []
      const withProgress = goalsResult.data.map((goal) => ({
        ...goal,
        currentHours:
          minutesForGoal(sessions, goal.hubId, goal.period) / 60,
      }))
      setGoals(withProgress)
      setError(null)
    } else {
      setGoals([])
      setError(goalsResult.message)
    }
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!isSessionReady) return
    void refresh()
  }, [isSessionReady, refresh])

  const createGoal = useCallback(
    async (
      input: CreateUserGoalInput,
    ): Promise<{ ok: true } | { ok: false; message: string; code?: 'forbidden' }> => {
      const userId = user?.id
      if (!userId) {
        return { ok: false, message: 'Entre na sua conta para criar uma meta.' }
      }

      setIsCreating(true)
      const result = await createUserGoal(userId, input)
      setIsCreating(false)

      if (result.ok) {
        await refresh()
        return { ok: true }
      }
      return { ok: false, message: result.message, code: result.code }
    },
    [user?.id, refresh],
  )

  return {
    goals,
    isLoading: !isSessionReady || isLoading,
    error,
    isCreating,
    refresh,
    createGoal,
  }
}
