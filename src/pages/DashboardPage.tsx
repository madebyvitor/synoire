import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OnboardingGoalModal } from '@/components/dashboard/OnboardingGoalModal'
import { AppToast } from '@/components/ui/AppToast'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { motion, type Variants } from 'motion/react'
import { EvolutionTrails } from '@/components/dashboard/EvolutionTrails'
import { FocusPatterns } from '@/components/dashboard/FocusPatterns'
import { StreakPredictionCard } from '@/components/dashboard/StreakPredictionCard'
import { YearHeatmap } from '@/components/dashboard/YearHeatmap'
import { GlowLockedOverlay } from '@/components/premium/GlowLockedOverlay'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useStudySessions } from '@/hooks/useStudySessions'
import { useUserStats } from '@/hooks/useUserStats'
import {
  buildWeeklyBars,
  formatStudyHours,
  minutesStudiedLast7Days,
  minutesStudiedToday,
  toSessionPoints,
} from '@/lib/dashboard/studyAnalytics'
import { needsWeeklyGoalOnboarding } from '@/lib/userStats'
import {
  pageStaggerContainer,
  pageStaggerItem,
  pageStaggerListInner,
} from '@/motion/pageStagger'

function MetricColumn({
  label,
  value,
  hint,
  variants,
  progressPercent,
}: {
  label: string
  value: string
  hint: string
  variants: Variants
  progressPercent?: number
}) {
  return (
    <motion.div variants={variants} className="py-2 sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <p className="text-xs font-medium uppercase tracking-widest text-firefly">{label}</p>
      <p className="mt-3 text-4xl font-semibold tabular-nums text-primary">{value}</p>
      {progressPercent !== undefined && (
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-chart-track"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso da meta semanal: ${progressPercent}%`}
        >
          <div
            className="h-full rounded-full bg-firefly transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      <p className="mt-2 text-sm text-secondary">{hint}</p>
    </motion.div>
  )
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { waitForGlowActivation } = useUserPlan()
  const [toast, setToast] = useState({ message: '', visible: false })
  const paymentHandledRef = useRef(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (paymentHandledRef.current) return
    const payment = searchParams.get('payment')
    if (payment !== 'success' && payment !== 'cancelled') return

    paymentHandledRef.current = true

    if (payment === 'success') {
      void (async () => {
        const activated = await waitForGlowActivation({ clearDevOverride: true })
        setToast({
          message:
            activated ?
              'Bem-vindo ao Synoire Glow! Seus recursos premium foram ativados.'
            : 'Pagamento recebido. A ativação pode levar alguns instantes — atualize a página em breve.',
          visible: true,
        })
      })()
    } else {
      setToast({
        message: 'O pagamento não foi concluído. Você pode tentar novamente quando quiser.',
        visible: true,
      })
    }

    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, waitForGlowActivation])
  const c = pageStaggerContainer(reduced)
  const item = pageStaggerItem(reduced)
  const listInner = pageStaggerListInner(reduced)

  const { sessions, isLoading: sessionsLoading } = useStudySessions()
  const { stats, isLoading: statsLoading, isSaving, saveWeeklyGoal } = useUserStats()
  const isLoading = sessionsLoading || statsLoading

  const needsOnboarding = needsWeeklyGoalOnboarding(stats.weeklyGoalMinutes)

  const points = useMemo(() => toSessionPoints(sessions), [sessions])

  const todayMinutes = useMemo(() => minutesStudiedToday(points), [points])
  const weeklyMinutes = useMemo(() => minutesStudiedLast7Days(points), [points])
  const weeklyBars = useMemo(() => buildWeeklyBars(points), [points])

  const weeklyGoalMinutes = stats.weeklyGoalMinutes
  const weeklyTargetLabel = formatStudyHours(weeklyGoalMinutes)
  const weeklyProgressPct =
    weeklyGoalMinutes > 0 ?
      Math.min(100, Math.round((weeklyMinutes / weeklyGoalMinutes) * 100))
    : 0

  const highlightBarIndex = useMemo(() => {
    if (weeklyBars.length === 0) return -1
    let maxIdx = 0
    for (let i = 1; i < weeklyBars.length; i++) {
      if (weeklyBars[i].minutes > weeklyBars[maxIdx].minutes) maxIdx = i
    }
    return weeklyBars[maxIdx].minutes > 0 ? maxIdx : -1
  }, [weeklyBars])

  const growthPercent = useMemo(() => {
    if (weeklyBars.length < 7) return null
    const recent = weeklyBars.slice(4).reduce((s, b) => s + b.minutes, 0)
    const prior = weeklyBars.slice(0, 3).reduce((s, b) => s + b.minutes, 0)
    if (prior <= 0) return recent > 0 ? 100 : null
    return Math.round(((recent - prior) / prior) * 100)
  }, [weeklyBars])

  const streakDays = stats.currentStreak
  const streakLabel = streakDays === 1 ? '1 dia' : `${streakDays} dias`

  const showOnboardingModal = needsOnboarding && !statsLoading

  return (
    <>
      <OnboardingGoalModal
        open={showOnboardingModal}
        onSave={saveWeeklyGoal}
        prefersReducedMotion={reduced}
        isSubmitting={isSaving}
      />

      <motion.div
        className={[
          'mx-auto max-w-5xl',
          showOnboardingModal ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
        variants={c}
        initial={reduced ? false : 'hidden'}
        animate="visible"
        aria-hidden={showOnboardingModal}
      >
        <motion.header variants={item} className="mb-10">
          <h1 className="text-2xl font-semibold text-primary">
            <span className="text-firefly">|</span> Painel
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Visão rápida da sua constância de estudos.
          </p>
        </motion.header>

        <motion.div
          variants={listInner}
          className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          <MetricColumn
            variants={item}
            label="Hoje"
            value={isLoading ? '—' : formatStudyHours(todayMinutes)}
            hint="Horas estudadas hoje"
          />
          <MetricColumn
            variants={item}
            label="Streak"
            value={isLoading ? '—' : streakLabel}
            hint="Sua sequência atual de consistência"
          />
          <MetricColumn
            variants={item}
            label="Meta semanal"
            value={
              isLoading || needsOnboarding ?
                '—'
              : `${formatStudyHours(weeklyMinutes)} / ${weeklyTargetLabel}`
            }
            hint={
              needsOnboarding ?
                'Defina sua meta para acompanhar o progresso'
              : `${weeklyProgressPct}% da meta nos últimos 7 dias`
            }
            progressPercent={needsOnboarding || isLoading ? undefined : weeklyProgressPct}
          />
        </motion.div>

        <motion.section variants={item} className="mt-12">
          <motion.div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium text-primary">Evolução semanal</h2>
              <span className="rounded-full border border-firefly/40 bg-firefly/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-firefly">
                Live
              </span>
            </div>
            {growthPercent !== null && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-elevated/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                <span className="text-firefly" aria-hidden>
                  {growthPercent >= 0 ? '\u2191' : '\u2193'}
                </span>
                {growthPercent >= 0 ? '+' : ''}
                {growthPercent}% crescimento
              </div>
            )}
          </motion.div>
          <div className="mt-8 flex h-36 items-end gap-2 sm:gap-3">
            {weeklyBars.map((bar, i) => {
              const isHighlight = i === highlightBarIndex
              const height = bar.minutes === 0 ? 4 : Math.max(bar.percent, 8)
              return (
                <motion.div
                  key={bar.label}
                  className="relative flex h-full flex-1 flex-col justify-end"
                  variants={item}
                  title={`${bar.label}: ${formatStudyHours(bar.minutes)}`}
                >
                  <div className="absolute inset-0 rounded-t-sm bg-chart-track" aria-hidden />
                  <div
                    className={[
                      'relative w-full rounded-t-sm',
                      isHighlight ? 'bg-chart-highlight' : 'bg-chart-fill',
                    ].join(' ')}
                    style={{ height: `${height}%` }}
                  >
                    {isHighlight && (
                      <span
                        className="absolute inset-x-0 top-0 h-px bg-white/80 shadow-[0_0_8px_rgba(245,245,240,0.6)]"
                        aria-hidden
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        <motion.div variants={item}>
          <StreakPredictionCard
            sessions={points}
            weeklyBars={weeklyBars}
            currentStreak={streakDays}
            isLoading={isLoading}
          />
        </motion.div>

        <motion.section
          variants={item}
          className="mt-6 rounded-2xl border border-border bg-surface p-6"
        >
          <h2 className="text-sm font-medium text-primary">Heatmap de constância</h2>
          <p className="mt-2 text-sm text-secondary">
            Intensidade de foco por dia em {new Date().getFullYear()}.
          </p>
          <GlowLockedOverlay className="mt-6">
            <YearHeatmap sessions={points} />
          </GlowLockedOverlay>
        </motion.section>

        <motion.section variants={item} className="mt-6">
          <FocusPatterns sessions={sessions} isLoading={sessionsLoading} />
        </motion.section>

        <motion.section variants={item} className="mt-6">
          <EvolutionTrails />
        </motion.section>

        <AppToast
          message={toast.message}
          visible={toast.visible}
          onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
        />
      </motion.div>
    </>
  )
}
