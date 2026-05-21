import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUserStats } from '@/hooks/useUserStats'
import { needsWeeklyGoalOnboarding } from '@/lib/userStats'

export function WeeklyGoalGate() {
  const location = useLocation()
  const { stats, isLoading } = useUserStats()

  if (isLoading) {
    return <Outlet />
  }

  if (
    needsWeeklyGoalOnboarding(stats.weeklyGoalMinutes) &&
    location.pathname !== '/painel'
  ) {
    return <Navigate to="/painel" replace />
  }

  return <Outlet />
}
