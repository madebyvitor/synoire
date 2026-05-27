import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserStats,
  markWelcomeAsSeen,
  updateWeeklyGoalMinutes,
  type UserStatsView,
} from '@/lib/userStats'

const DEFAULT_STATS: UserStatsView = {
  currentStreak: 0,
  totalHours: 0,
  weeklyGoalMinutes: 0,
  hasSeenWelcome: false,
}

export function useUserStats() {
  const { user, isSessionReady } = useAuth()
  const [stats, setStats] = useState<UserStatsView>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const refresh = useCallback(async () => {
    const userId = user?.id
    if (!userId) {
      setStats(DEFAULT_STATS)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await getUserStats(userId)
    if (result.ok) {
      setStats(result.data)
      setError(null)
    } else {
      setStats(DEFAULT_STATS)
      setError(result.message)
    }
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!isSessionReady) return
    void refresh()
  }, [isSessionReady, refresh])

  const saveWeeklyGoal = useCallback(
    async (hours: number): Promise<{ ok: true } | { ok: false; message: string }> => {
      const userId = user?.id
      if (!userId) {
        return { ok: false, message: 'Entre na sua conta para continuar.' }
      }

      setIsSaving(true)
      const result = await updateWeeklyGoalMinutes(userId, hours)
      setIsSaving(false)

      if (!result.ok) {
        return { ok: false, message: result.message }
      }

      setStats((prev) => ({
        ...prev,
        weeklyGoalMinutes: result.data.weeklyGoalMinutes,
      }))
      return { ok: true }
    },
    [user?.id],
  )

  const completeWelcomeOnboarding = useCallback(
    async (hours: number): Promise<{ ok: true } | { ok: false; message: string }> => {
      const userId = user?.id
      if (!userId) {
        return { ok: false, message: 'Entre na sua conta para continuar.' }
      }

      setIsSaving(true)
      const goalResult = await updateWeeklyGoalMinutes(userId, hours)
      if (!goalResult.ok) {
        setIsSaving(false)
        return { ok: false, message: goalResult.message }
      }

      const welcomeResult = await markWelcomeAsSeen(userId)
      setIsSaving(false)

      if (!welcomeResult.ok) {
        return { ok: false, message: welcomeResult.message }
      }

      setStats((prev) => ({
        ...prev,
        weeklyGoalMinutes: goalResult.data.weeklyGoalMinutes,
        hasSeenWelcome: true,
      }))
      return { ok: true }
    },
    [user?.id],
  )

  return {
    stats,
    isLoading: !isSessionReady || isLoading,
    error,
    isSaving,
    refresh,
    saveWeeklyGoal,
    completeWelcomeOnboarding,
  }
}
