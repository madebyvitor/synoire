import { GlowLockedOverlay } from '@/components/premium/GlowLockedOverlay'
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight'
import {
  hasSessionToday,
  type StudySessionPoint,
  type WeeklyBar,
} from '@/lib/dashboard/studyAnalytics'

type StreakPredictionCardProps = {
  sessions: StudySessionPoint[]
  weeklyBars: WeeklyBar[]
  currentStreak: number
  isLoading: boolean
}

export function StreakPredictionCard({
  sessions,
  weeklyBars,
  currentStreak,
  isLoading,
}: StreakPredictionCardProps) {
  const studiedToday = hasSessionToday(sessions)
  const countdown = useCountdownToMidnight()
  const streakLabel =
    currentStreak === 1 ? '1 dia' : `${currentStreak} dias`

  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-primary">Previsão de Streak</h2>
      <p className="mt-2 text-sm text-secondary">
        {studiedToday ?
          'Sua ofensiva está segura por hoje.'
        : currentStreak > 0 ?
          'Estude antes da meia-noite para manter sua sequência.'
        : 'Projeção com base no seu ritmo recente.'}
      </p>
      <GlowLockedOverlay className="mt-6">
        {isLoading ?
          <p className="text-sm text-secondary">Carregando...</p>
        : currentStreak === 0 && !studiedToday ?
          <p className="text-sm text-secondary">
            Complete um pomodoro em uma sala para iniciar sua ofensiva.
          </p>
        : (
          <StreakBody
            studiedToday={studiedToday}
            currentStreak={currentStreak}
            streakLabel={streakLabel}
            countdown={countdown}
            weeklyBars={weeklyBars}
          />
        )}
      </GlowLockedOverlay>
    </section>
  )
}

function StreakBody({
  studiedToday,
  currentStreak,
  streakLabel,
  countdown,
  weeklyBars,
}: {
  studiedToday: boolean
  currentStreak: number
  streakLabel: string
  countdown: string
  weeklyBars: WeeklyBar[]
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        {studiedToday ?
          <span className="text-2xl font-semibold tabular-nums text-firefly">
            {streakLabel}
          </span>
        : currentStreak > 0 ?
          <div>
            <span className="text-2xl font-semibold tabular-nums text-firefly">
              {countdown}
            </span>
            <p className="mt-1 text-xs text-secondary">até a meia-noite (SP)</p>
          </div>
        : (
          <span className="text-2xl font-semibold tabular-nums text-firefly">
            —
          </span>
        )}
      </div>
      <div className="flex h-24 items-end gap-1">
        {weeklyBars.map((bar) => {
          const h = bar.minutes === 0 ? 8 : bar.percent
          return (
            <div
              key={`streak-${bar.label}`}
              className="flex-1 rounded-t bg-aqua/25"
              style={{ height: `${h}%` }}
              title={bar.label}
            />
          )
        })}
      </div>
      <p className="text-xs text-secondary">
        {studiedToday ?
          `Você está com ${streakLabel} de ofensiva. Continue estudando para manter o ritmo.`
        : currentStreak > 0 ?
          `Estude hoje para não perder sua ofensiva de ${streakLabel}. Restam ${countdown} (horário de Brasília).`
        : 'Complete um pomodoro em uma sala para iniciar sua ofensiva.'}
      </p>
    </div>
  )
}
