import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMockRoomTimerState } from '@/data/mockRoomTimer'
import {
  buildAdvancedState,
  getCyclePosition,
  secondsUntilNextFocus,
  type RoomPhase,
  type RoomTimerState,
} from '@/lib/roomTimer'

const LEADER_TTL_MS = 3000

function leaderKey(roomId: string) {
  return `synoire-timer-leader:${roomId}`
}

function tryClaimLeader(roomId: string): boolean {
  try {
    const key = leaderKey(roomId)
    const raw = sessionStorage.getItem(key)
    const now = Date.now()
    if (raw) {
      const ts = Number.parseInt(raw, 10)
      if (Number.isFinite(ts) && now - ts < LEADER_TTL_MS) return false
    }
    sessionStorage.setItem(key, String(now))
    return true
  } catch {
    return true
  }
}

export function useGlobalRoomTimer(roomId: string | undefined) {
  const id = roomId ?? 'demo'
  const [state, setState] = useState<RoomTimerState>(() =>
    getMockRoomTimerState(roomId),
  )

  useEffect(() => {
    setState(getMockRoomTimerState(roomId))
  }, [roomId])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const { remainingSeconds, isComplete } = useMemo(
    () => getCyclePosition(now, state.startedAt, state.phase),
    [now, state.startedAt, state.phase],
  )

  const untilNextFocus = useMemo(
    () => secondsUntilNextFocus(now, state),
    [now, state],
  )

  const advancePhase = useCallback(() => {
    setState((prev) => buildAdvancedState(prev, new Date()))
  }, [])

  useEffect(() => {
    if (!isComplete) return
    if (!tryClaimLeader(id)) return
    advancePhase()
    // Future: PATCH rooms.current_timer_state via Supabase; peers update via Realtime.
  }, [isComplete, id, advancePhase])

  const presentCount = state.presentCount ?? 128

  return {
    phase: state.phase as RoomPhase,
    remainingSeconds,
    secondsUntilNextFocus: untilNextFocus,
    startedAt: state.startedAt,
    presentCount,
    isSegmentComplete: isComplete,
    advancePhase,
  }
}
