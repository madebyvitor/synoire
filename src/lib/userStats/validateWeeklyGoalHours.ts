export const WEEKLY_GOAL_HOURS_MIN = 1
export const WEEKLY_GOAL_HOURS_MAX = 168

export function validateWeeklyGoalHours(hours: number): string | null {
  if (!Number.isFinite(hours)) {
    return 'Informe um número válido de horas.'
  }
  if (hours < WEEKLY_GOAL_HOURS_MIN) {
    return `A meta deve ser de pelo menos ${WEEKLY_GOAL_HOURS_MIN} hora por semana.`
  }
  if (hours > WEEKLY_GOAL_HOURS_MAX) {
    return `A meta não pode passar de ${WEEKLY_GOAL_HOURS_MAX} horas por semana.`
  }
  return null
}

export function weeklyGoalHoursToMinutes(hours: number): number {
  return Math.round(hours * 60)
}
