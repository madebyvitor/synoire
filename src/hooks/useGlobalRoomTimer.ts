import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMockRoomTimerState } from '@/data/mockRoomTimer'
import {
  getHubRoomsAdapter,
  getPrepRemainingSeconds,
  timerPayloadToCycleConfig,
  type StudyRoom,
} from '@/lib/hubRooms'
import {
  buildAdvancedState,
  DEFAULT_CYCLE_CONFIG,
  getCyclePosition,
  secondsUntilNextFocus,
  type RoomCycleConfig,
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

function studyRoomToTimerState(room: StudyRoom): RoomTimerState & { isIdle: boolean } {
  const ts = room.current_timer_state
  const cycle = timerPayloadToCycleConfig(ts)

  if (ts.status === 'idle') {
    return {
      phase: 'focus',
      startedAt: ts.started_at ?? new Date().toISOString(),
      presentCount: room.present_count,
      cycle,
      isIdle: true,
    }
  }

  return {
    phase: ts.status,
    startedAt: ts.started_at!,
    presentCount: room.present_count,
    cycle,
    isIdle: false,
  }
}

export function useGlobalRoomTimer(
  roomId: string | undefined,
  studyRoom: StudyRoom | null | undefined,
) {
  const id = roomId ?? 'demo'
  const adapter = getHubRoomsAdapter()

  const [mockState, setMockState] = useState<RoomTimerState>(() =>
    getMockRoomTimerState(roomId),
  )

  useEffect(() => {
    if (studyRoom) return
    setMockState(getMockRoomTimerState(roomId))
  }, [roomId, studyRoom])

  const derived = useMemo(() => {
    if (studyRoom) return studyRoomToTimerState(studyRoom)
    return { ...mockState, isIdle: false, cycle: DEFAULT_CYCLE_CONFIG }
  }, [studyRoom, mockState])

  const config: RoomCycleConfig = derived.cycle ?? DEFAULT_CYCLE_CONFIG
  const isIdle = derived.isIdle
  const timerPayload = studyRoom?.current_timer_state

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(tick)
  }, [])

  const prepRemaining = useMemo(() => {
    if (!isIdle || !timerPayload) return null
    return getPrepRemainingSeconds(timerPayload, now)
  }, [isIdle, timerPayload, now])

  const { remainingSeconds, isComplete } = useMemo(() => {
    if (isIdle && prepRemaining !== null) {
      return {
        remainingSeconds: prepRemaining,
        isComplete: prepRemaining === 0,
      }
    }
    return getCyclePosition(now, derived.startedAt, derived.phase, config)
  }, [now, derived.startedAt, derived.phase, config, isIdle, prepRemaining])

  const untilNextFocus = useMemo(() => {
    if (isIdle && prepRemaining !== null) return prepRemaining
    return secondsUntilNextFocus(
      now,
      { phase: derived.phase, startedAt: derived.startedAt },
      config,
    )
  }, [now, derived.phase, derived.startedAt, config, isIdle, prepRemaining])

  const advancePhase = useCallback(async () => {
    if (studyRoom && roomId) {
      await adapter.advanceTimerPhase(roomId)
      return
    }
    setMockState((prev) =>
      buildAdvancedState(prev, new Date(), prev.cycle ?? DEFAULT_CYCLE_CONFIG),
    )
  }, [studyRoom, roomId, adapter])

  const startFocusTimer = useCallback(async () => {
    if (!studyRoom || !roomId) return
    await adapter.startFocusTimer(roomId)
  }, [studyRoom, roomId, adapter])

  useEffect(() => {
    if (isIdle || !isComplete) return
    if (!tryClaimLeader(id)) return
    void advancePhase()
  }, [isComplete, isIdle, id, advancePhase])

  const presentCount = derived.presentCount ?? mockState.presentCount ?? 128

  return {
    phase: derived.phase as RoomPhase,
    remainingSeconds,
    secondsUntilNextFocus: untilNextFocus,
    startedAt: derived.startedAt,
    presentCount,
    isSegmentComplete: isComplete,
    isIdle,
    cycle: config,
    advancePhase,
    startFocusTimer,
  }
}
