import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { computePartialMinutes } from '@/lib/userStats/computePartialMinutes'
import { flushPartialSessionKeepalive } from '@/lib/userStats/flushPartialSessionKeepalive'
import { recordPartialStudyTime } from '@/lib/userStats/recordPartialStudyTime'

const SYNC_INTERVAL_MS = 5 * 60_000

type SessionMode = 'onboarding' | 'lounge' | 'active'

export type SavePartialSessionResult =
  | { ok: true; skipped: true }
  | { ok: true; skipped?: false; minutes: number }
  | { ok: false; message: string }

type UsePartialStudyTrackingArgs = {
  roomId: string | undefined
  userId: string | undefined
  sessionMode: SessionMode
}

export function usePartialStudyTracking({
  roomId,
  userId,
  sessionMode,
}: UsePartialStudyTrackingArgs) {
  const joinTimeRef = useRef<number | null>(null)
  const savingRef = useRef(false)
  const unloadFlushedRef = useRef(false)
  const sessionModeRef = useRef(sessionMode)
  const roomIdRef = useRef(roomId)
  const userIdRef = useRef(userId)
  const [isLeaving, setIsLeaving] = useState(false)

  sessionModeRef.current = sessionMode
  roomIdRef.current = roomId
  userIdRef.current = userId

  const resetJoinTime = useCallback(() => {
    joinTimeRef.current = Date.now()
    unloadFlushedRef.current = false
  }, [])

  const clearJoinTime = useCallback(() => {
    joinTimeRef.current = null
  }, [])

  const savePartialSession = useCallback(async (): Promise<SavePartialSessionResult> => {
    const rid = roomIdRef.current
    const uid = userIdRef.current
    const joinTime = joinTimeRef.current

    if (!rid || !uid || joinTime == null) {
      return { ok: true, skipped: true }
    }

    const minutes = computePartialMinutes(joinTime)
    if (minutes < 1) {
      return { ok: true, skipped: true }
    }

    if (savingRef.current) {
      return { ok: true, skipped: true }
    }

    savingRef.current = true
    const result = await recordPartialStudyTime(uid, rid, minutes)
    savingRef.current = false

    if (!result.ok) {
      return { ok: false, message: result.message }
    }

    joinTimeRef.current = Date.now()
    return { ok: true, minutes }
  }, [])

  const flushOnUnload = useCallback(() => {
    const rid = roomIdRef.current
    const uid = userIdRef.current
    const joinTime = joinTimeRef.current
    if (!rid || !uid || joinTime == null || sessionModeRef.current !== 'active') return

    const minutes = computePartialMinutes(joinTime)
    if (minutes < 1) return

    unloadFlushedRef.current = true
    joinTimeRef.current = Date.now()

    const supabase = getSupabase()
    if (!supabase) return

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return
      flushPartialSessionKeepalive(session.access_token, rid, minutes)
    })
  }, [])

  useEffect(() => {
    if (!roomId || !userId) {
      clearJoinTime()
      return
    }

    if (sessionMode === 'active') {
      if (joinTimeRef.current == null) {
        joinTimeRef.current = Date.now()
        unloadFlushedRef.current = false
      }
      return
    }

    if (joinTimeRef.current == null) return

    let cancelled = false
    void (async () => {
      await savePartialSession()
      if (!cancelled) clearJoinTime()
    })()

    return () => {
      cancelled = true
    }
  }, [roomId, userId, sessionMode, savePartialSession, clearJoinTime])

  useEffect(() => {
    if (sessionMode !== 'active' || !roomId || !userId) return

    const id = window.setInterval(() => {
      void savePartialSession()
    }, SYNC_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [sessionMode, roomId, userId, savePartialSession])

  useEffect(() => {
    const onPageHide = () => flushOnUnload()
    const onBeforeUnload = () => flushOnUnload()

    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (!unloadFlushedRef.current) {
        void savePartialSession()
      }
      unloadFlushedRef.current = false
    }
  }, [flushOnUnload, savePartialSession])

  const handleLeaveRoom = useCallback(async (): Promise<SavePartialSessionResult> => {
    setIsLeaving(true)
    const result = await savePartialSession()
    setIsLeaving(false)
    return result
  }, [savePartialSession])

  return {
    savePartialSession,
    resetJoinTime,
    handleLeaveRoom,
    isLeaving,
  }
}
