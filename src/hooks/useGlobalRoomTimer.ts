import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMockRoomTimerState } from '@/data/mockRoomTimer'
import {
  getHubRoomsAdapter,
  getPrepRemainingSeconds,
  resolveTimerCatchUp,
  timerPayloadToCycleConfig,
  type StudyRoom,
} from '@/lib/hubRooms'
import { isDemoMode } from '@/lib/hubRooms/demo'
import { isSupabaseConfigured } from '@/lib/supabase'
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

function shouldUseMockTimer(
  roomId: string | undefined,
  studyRoom: StudyRoom | null | undefined,
): boolean {
  if (studyRoom) return false
  if (!roomId || roomId === 'demo') return true
  return !isSupabaseConfigured || isDemoMode
}

const safeIdleTimerState = (): RoomTimerState & { isIdle: boolean } => ({
  phase: 'focus',
  startedAt: new Date().toISOString(),
  presentCount: 0,
  cycle: DEFAULT_CYCLE_CONFIG,
  isIdle: true,
})

function studyRoomToTimerState(
  room: StudyRoom,
  now: number,
): RoomTimerState & { isIdle: boolean } {
  const { resolved } = resolveTimerCatchUp(room.current_timer_state, now)
  const cycle = timerPayloadToCycleConfig(resolved)

  if (resolved.status === 'idle') {
    return {
      phase: 'focus',
      startedAt: resolved.started_at ?? new Date(now).toISOString(),
      presentCount: room.present_count,
      cycle,
      cycleCount: resolved.cycle_count ?? 0,
      isIdle: true,
    }
  }

  return {
    phase: resolved.status,
    startedAt: resolved.started_at!,
    presentCount: room.present_count,
    cycle,
    cycleCount: resolved.cycle_count ?? 0,
    isIdle: false,
  }
}

export function useGlobalRoomTimer(
  roomId: string | undefined,
  studyRoom: StudyRoom | null | undefined,
) {
  const id = roomId ?? 'demo'
  const adapter = getHubRoomsAdapter()

  const useMock = shouldUseMockTimer(roomId, studyRoom)

  const [mockState, setMockState] = useState<RoomTimerState>(() =>
    getMockRoomTimerState(roomId),
  )

  useEffect(() => {
    if (studyRoom || !useMock) return
    setMockState(getMockRoomTimerState(roomId))
  }, [roomId, studyRoom, useMock])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(tick)
  }, [])

  const storedPayload = studyRoom?.current_timer_state
  const catchUp = useMemo(() => {
    if (!storedPayload) return { resolved: null as null, changed: false }
    return resolveTimerCatchUp(storedPayload, now)
  }, [storedPayload, now])

  const derived = useMemo(() => {
    if (studyRoom) return studyRoomToTimerState(studyRoom, now)
    if (useMock) {
      return { ...mockState, isIdle: false, cycle: DEFAULT_CYCLE_CONFIG }
    }
    return safeIdleTimerState()
  }, [studyRoom, mockState, useMock, now])

  const config: RoomCycleConfig = derived.cycle ?? DEFAULT_CYCLE_CONFIG
  const isIdle = derived.isIdle
  const timerPayload = catchUp.resolved ?? storedPayload

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

  const syncTimerCatchUp = useCallback(async () => {
    if (!studyRoom || !roomId) return
    await adapter.syncTimerCatchUp(roomId)
  }, [studyRoom, roomId, adapter])

  useEffect(() => {
    if (!studyRoom && !useMock) return
    if (useMock) {
      if (isIdle || !isComplete) return
      if (!tryClaimLeader(id)) return
      void advancePhase()
      return
    }
    if (!catchUp.changed && !isComplete) return
    if (!tryClaimLeader(id)) return
    void syncTimerCatchUp()
  }, [
    catchUp.changed,
    isComplete,
    isIdle,
    id,
    advancePhase,
    syncTimerCatchUp,
    studyRoom,
    useMock,
  ])

  const presentCount = derived.presentCount ?? mockState.presentCount ?? 128

  const cycleCount =
    catchUp.resolved?.cycle_count ??
    storedPayload?.cycle_count ??
    derived.cycleCount ??
    0

  return {
    phase: derived.phase as RoomPhase,
    remainingSeconds,
    secondsUntilNextFocus: untilNextFocus,
    startedAt: derived.startedAt,
    presentCount,
    isSegmentComplete: isComplete,
    isIdle,
    cycle: config,
    cycleCount,
    advancePhase,
    startFocusTimer,
  }
}
