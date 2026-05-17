import type { FocusCycle } from './types'

export type CycleDurations = {
  focusSec: number
  breakSec: number
}

const CYCLE_MAP: Record<FocusCycle, CycleDurations> = {
  '25/5': { focusSec: 25 * 60, breakSec: 5 * 60 },
  '50/10': { focusSec: 50 * 60, breakSec: 10 * 60 },
  '90/15': { focusSec: 90 * 60, breakSec: 15 * 60 },
}

export const FOCUS_CYCLE_OPTIONS: { value: FocusCycle; label: string }[] = [
  { value: '25/5', label: '25/5 — Pomodoro clássico' },
  { value: '50/10', label: '50/10 — Foco profundo' },
  { value: '90/15', label: '90/15 — Simulado / ciclo longo' },
]

export function getCycleDurations(cycle: FocusCycle): CycleDurations {
  return CYCLE_MAP[cycle]
}
