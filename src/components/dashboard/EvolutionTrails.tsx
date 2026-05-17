import { useCallback, useMemo, useState } from 'react'
import { LockIcon } from '@/components/premium/LockIcon'
import { AppToast } from '@/components/ui/AppToast'
import { useJoinedHubs } from '@/contexts/JoinedHubsContext'
import { useUserPlan } from '@/contexts/UserPlanContext'
import {
  goalsForJoinedHubs,
  paywallTeaserGoals,
  type EvolutionGoalWithHub,
} from '@/lib/dashboard/mockEvolutionGoals'

const TOAST_MESSAGE = 'Funcionalidade em desenvolvimento'

const EMPTY_GLOW_MESSAGE =
  'Entre em hubs na página Hubs para ver suas metas semanais.'

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
}

function goalProgress(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, (current / target) * 100)
}

type TrailsContentProps = {
  goals: EvolutionGoalWithHub[]
  onNewGoal: () => void
  emptyMessage?: string
}

function TrailsContent({ goals, onNewGoal, emptyMessage }: TrailsContentProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-primary">Trilhas de Evolução</h2>
        <button
          type="button"
          onClick={onNewGoal}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-secondary transition hover:border-white/20 hover:text-primary"
        >
          + Nova Meta
        </button>
      </div>
      {goals.length === 0 && emptyMessage ? (
        <p className="mt-6 text-sm text-secondary">{emptyMessage}</p>
      ) : (
        <ul className="mt-6 list-none space-y-5 p-0">
          {goals.map((goal) => (
            <GoalRow key={goal.hub_id} goal={goal} />
          ))}
        </ul>
      )}
    </>
  )
}

type GoalRowProps = {
  goal: EvolutionGoalWithHub
}

function GoalRow({ goal }: GoalRowProps) {
  const pct = goalProgress(goal.current_hours, goal.target_hours)
  const complete = pct >= 100

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-primary">{goal.hubName}</span>
        <span className="shrink-0 text-xs tabular-nums text-secondary">
          {formatHours(goal.current_hours)} / {formatHours(goal.target_hours)}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-sm bg-white/10"
        role="progressbar"
        aria-valuenow={goal.current_hours}
        aria-valuemin={0}
        aria-valuemax={goal.target_hours}
        aria-label={`Progresso em ${goal.hubName}`}
      >
        <div
          className={`h-full rounded-sm bg-[#D8FF5E] ${
            complete ? 'shadow-[0_0_10px_#D8FF5E]' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  )
}

export function EvolutionTrails() {
  const { hasGlowAccess, openPaywall } = useUserPlan()
  const { joinedSlugs } = useJoinedHubs()
  const [toastVisible, setToastVisible] = useState(false)

  const joinedGoals = useMemo(
    () => goalsForJoinedHubs(joinedSlugs),
    [joinedSlugs],
  )

  const displayGoals = useMemo(() => {
    if (joinedGoals.length > 0) return joinedGoals
    if (!hasGlowAccess) return paywallTeaserGoals()
    return []
  }, [joinedGoals, hasGlowAccess])

  const emptyMessage =
    hasGlowAccess && joinedGoals.length === 0 ? EMPTY_GLOW_MESSAGE : undefined

  const handleNewGoal = useCallback(() => {
    setToastVisible(true)
  }, [])

  const dismissToast = useCallback(() => setToastVisible(false), [])

  return (
    <section className="rounded-2xl border border-white/5 bg-[#161C24] p-6">
      {hasGlowAccess ? (
        <TrailsContent
          goals={displayGoals}
          onNewGoal={handleNewGoal}
          emptyMessage={emptyMessage}
        />
      ) : (
        <div className="relative">
          <div className="pointer-events-none select-none blur-md">
            <TrailsContent goals={displayGoals} onNewGoal={() => {}} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-night/20 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => openPaywall()}
              className="pointer-events-auto flex items-center gap-2 rounded-xl border border-firefly/30 bg-[#161C24]/90 px-4 py-2.5 text-sm font-medium text-firefly shadow-[0_0_24px_-4px_#D8FF5E40] transition hover:border-firefly/50 hover:brightness-110"
            >
              <LockIcon className="h-4 w-4 text-firefly" />
              Desbloquear Trilhas de Evolução
            </button>
          </div>
        </div>
      )}

      <AppToast
        message={TOAST_MESSAGE}
        visible={toastVisible}
        onDismiss={dismissToast}
      />
    </section>
  )
}
