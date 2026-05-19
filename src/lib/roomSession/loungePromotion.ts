import type { RoomPhase } from '@/lib/roomTimer'

export type LoungeWaitTarget = 'prep' | 'break' | 'focus'

export type LoungeEnteredPhase = RoomPhase | 'prep' | null

/**
 * Whether someone waiting in the pre-room lounge should enter the active session.
 */
export function shouldPromoteLoungeToActive(
  target: LoungeWaitTarget,
  enteredPhase: LoungeEnteredPhase,
  phase: RoomPhase,
  isIdle: boolean,
  remainingSeconds: number,
): boolean {
  if (target === 'prep') {
    if (isIdle && remainingSeconds === 0) return true
    // Prep ended elsewhere (e.g. another participant) — catch up to the live segment.
    if (!isIdle) return true
    return false
  }

  if (target === 'break') {
    return phase === 'break'
  }

  if (target === 'focus') {
    return phase === 'focus' && !isIdle && enteredPhase === 'break'
  }

  return false
}
