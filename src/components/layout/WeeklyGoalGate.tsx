import { Outlet } from 'react-router-dom'
import { OnboardingGoalModal } from '@/components/dashboard/OnboardingGoalModal'
import { WelcomeModal } from '@/components/dashboard/WelcomeModal'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useUserStats } from '@/hooks/useUserStats'
import { needsWeeklyGoalOnboarding } from '@/lib/userStats'

export function WeeklyGoalGate() {
  const { stats, isLoading, isSaving, saveWeeklyGoal, completeWelcomeOnboarding } =
    useUserStats()
  const prefersReducedMotion = usePrefersReducedMotion()

  const shouldShowWelcome = !isLoading && !stats.hasSeenWelcome
  const shouldShowGoalOnboarding =
    !isLoading &&
    stats.hasSeenWelcome &&
    needsWeeklyGoalOnboarding(stats.weeklyGoalMinutes)
  const isOnboardingBlocking = shouldShowWelcome || shouldShowGoalOnboarding

  return (
    <>
      <WelcomeModal
        open={shouldShowWelcome}
        onComplete={completeWelcomeOnboarding}
        prefersReducedMotion={prefersReducedMotion}
        isSubmitting={isSaving}
      />
      <OnboardingGoalModal
        open={shouldShowGoalOnboarding}
        onSave={saveWeeklyGoal}
        prefersReducedMotion={prefersReducedMotion}
        isSubmitting={isSaving}
      />
      <div
        className={isOnboardingBlocking ? 'pointer-events-none opacity-40' : ''}
        aria-hidden={isOnboardingBlocking ? true : undefined}
      >
        <Outlet />
      </div>
    </>
  )
}
