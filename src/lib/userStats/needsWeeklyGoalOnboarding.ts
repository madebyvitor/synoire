export function needsWeeklyGoalOnboarding(minutes: number | null | undefined): boolean {
  return minutes == null || minutes <= 0
}
