import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ImmersiveCanvas } from '@/components/room/ImmersiveCanvas'
import { RoomFocusStage } from '@/components/room/RoomFocusStage'
import { PreRoomLounge } from '@/components/room/PreRoomLounge'
import { RoomChat } from '@/components/room/RoomChat'
import { RoomSessionToolbar } from '@/components/room/RoomSessionToolbar'
import { RoomMediaEmbed } from '@/components/room/RoomMediaEmbed'
import { SessionOnboarding } from '@/components/room/SessionOnboarding'
import { InvitePartnersModal } from '@/components/room/InvitePartnersModal'
import { ThemeSelectorModal } from '@/components/room/ThemeSelectorModal'
import { useAuth } from '@/contexts/AuthContext'
import { useStudyPartners } from '@/contexts/StudyPartnersContext'
import { useAuthenticatedGlobalPresence } from '@/hooks/useAuthenticatedGlobalPresence'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { useGlobalRoomTimer } from '@/hooks/useGlobalRoomTimer'
import { useTabTimerTitle } from '@/hooks/useTabTimerTitle'
import { useTimerSounds } from '@/hooks/useTimerSounds'
import { useImmersiveTheme } from '@/hooks/useImmersiveTheme'
import { usePartialStudyTracking } from '@/hooks/usePartialStudyTracking'
import { useRecordStudySession } from '@/hooks/useRecordStudySession'
import { useStudySessions } from '@/hooks/useStudySessions'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useRoomEntry, type RoomEntryStatus } from '@/hooks/useRoomEntry'
import { formatRoomDisplayTitle } from '@/lib/hubRooms'
import { useRoomChat } from '@/hooks/useRoomChat'
import { useRoomSoundscape } from '@/hooks/useRoomSoundscape'
import { getImmersiveTheme, type ImmersiveThemeId } from '@/lib/immersiveThemes'
import { canSendRoomChat } from '@/lib/roomChat'
import { shouldPromoteLoungeToActive } from '@/lib/roomSession/loungePromotion'
import {
  getSegmentDuration,
  type RoomPhase,
} from '@/lib/roomTimer'
import type { FocusCycle } from '@/lib/hubRooms/types'

type SessionMode = 'onboarding' | 'lounge' | 'active'

/** What the lounge is waiting for before auto-entering the room. */
type LoungeWaitTarget = 'prep' | 'break' | 'focus'

const RITUAL_MS = 2000

type RoomLocationState = {
  sessionStart?: SessionMode
}

function initialSessionMode(state: unknown): SessionMode {
  const s = state as RoomLocationState | null
  if (s?.sessionStart === 'lounge' || s?.sessionStart === 'active') {
    return s.sessionStart
  }
  return 'onboarding'
}

function roomEntrySubtitle(status: RoomEntryStatus): string {
  switch (status) {
    case 'denied_private':
      return 'Peça um convite ao criador da sala para entrar.'
    case 'not_found':
      return 'A sala não existe ou não está mais disponível.'
    case 'error':
      return 'Tente novamente em instantes.'
    case 'loading':
      return 'Verificando acesso…'
    default:
      return ''
  }
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { room: studyRoom, entryStatus, entryMessage, presentCount } = useRoomEntry(roomId)

  useAuthenticatedGlobalPresence({
    enabled: Boolean(roomId),
    pathname: location.pathname,
    roomId,
    room: studyRoom,
    resetToOnlineOnUnmount: true,
  })

  const title = useMemo(
    () =>
      formatRoomDisplayTitle(
        entryStatus === 'ready' ? 'ready' : entryStatus,
        studyRoom?.name ?? null,
        roomId,
      ),
    [entryStatus, studyRoom?.name, roomId],
  )
  const prefersReducedMotion = usePrefersReducedMotion()
  const { user } = useAuth()
  const { hasGlowAccess, openPaywall } = useUserPlan()
  const { acceptedPartners } = useStudyPartners()
  const { selectedThemeId, effectiveThemeId, setTheme } = useImmersiveTheme()
  const timer = useGlobalRoomTimer(roomId, studyRoom)
  const {
    phase,
    remainingSeconds,
    isIdle,
    startFocusTimer,
    isSegmentComplete,
    startedAt,
    cycle,
    cycleCount,
  } = timer
  useTimerSounds({ remainingSeconds, isIdle, enabled: entryStatus === 'ready' })
  useTabTimerTitle({
    remainingSeconds,
    phase,
    isIdle,
    enabled: entryStatus === 'ready',
  })
  const { recordSession } = useStudySessions()

  const [sessionMode, setSessionMode] = useState<SessionMode>(() =>
    initialSessionMode(location.state),
  )

  const { resetJoinTime, handleLeaveRoom, isLeaving } = usePartialStudyTracking({
    roomId,
    userId: user?.id,
    sessionMode,
  })

  const recordSessionWithReset = useCallback(
    async (targetRoomId: string, durationMinutes: number) => {
      const result = await recordSession(targetRoomId, durationMinutes)
      if (result.ok) resetJoinTime()
      return result
    },
    [recordSession, resetJoinTime],
  )

  useRecordStudySession({
    roomId,
    studyRoom,
    sessionMode,
    phase,
    isIdle,
    isSegmentComplete,
    startedAt,
    recordSession: recordSessionWithReset,
  })

  const onLeaveRoom = useCallback(async () => {
    await handleLeaveRoom()
    navigate('/painel')
  }, [handleLeaveRoom, navigate])
  const [syncFlashUntil, setSyncFlashUntil] = useState(0)
  const [ritualGlow, setRitualGlow] = useState(false)
  const [timerRitualFade, setTimerRitualFade] = useState(false)

  const [chromeLit, setChromeLit] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [invitePartnersOpen, setInvitePartnersOpen] = useState(false)
  const ambientRestoredRef = useRef(false)
  const idleTimerRef = useRef<number | null>(null)
  const prevPhaseRef = useRef(phase)
  const loungePromotedRef = useRef(false)
  const loungeWaitTargetRef = useRef<LoungeWaitTarget | null>(null)
  const loungeEnteredPhaseRef = useRef<RoomPhase | 'prep' | null>(null)

  const sound = useRoomSoundscape({ defaultPlaylistAutoplay: hasGlowAccess })

  const handleSelectTheme = useCallback(
    (id: ImmersiveThemeId) => {
      if (!setTheme(id)) return
      const theme = getImmersiveTheme(id)
      if (theme) {
        void sound.playLibraryTrack(theme.audioFile, theme.audioLabel)
      }
    },
    [setTheme, sound],
  )

  useEffect(() => {
    if (ambientRestoredRef.current) return
    ambientRestoredRef.current = true

    async function restoreAmbient() {
      if (hasGlowAccess) {
        const customUrl = sound.readStoredCustomMediaUrl()
        if (customUrl) {
          const result = await sound.restoreCustomMediaUrl(customUrl)
          if (result.ok) return
        }
      }

      const theme = getImmersiveTheme(effectiveThemeId)
      if (theme) {
        await sound.playLibraryTrack(theme.audioFile, theme.audioLabel)
      }
    }

    void restoreAmbient()
  }, [effectiveThemeId, hasGlowAccess, sound])

  const entranceMs = useMemo(() => {
    if (prefersReducedMotion) return 420
    return 700 + Math.floor(Math.random() * 500)
  }, [prefersReducedMotion])

  const isLounge = sessionMode === 'lounge'
  const isActive = sessionMode === 'active'
  const showChrome = isActive
  const chatEnabled = isLounge || isActive

  const isRoomCreator = Boolean(
    user?.id && studyRoom?.creator_id && user.id === studyRoom.creator_id,
  )
  const showInviteButton = Boolean(
    studyRoom && (!studyRoom.is_private || isRoomCreator),
  )
  const inviteLabel = studyRoom?.is_private
    ? 'Convidar parceiros'
    : 'Compartilhar sala'

  const handleInvitePartnersClick = useCallback(() => {
    if (studyRoom?.is_private && !hasGlowAccess) {
      openPaywall('Salas privadas são exclusivas do plano Glow.')
      return
    }
    setInvitePartnersOpen(true)
    setChatOpen(false)
  }, [studyRoom?.is_private, hasGlowAccess, openPaywall])
  const canSendMessage = canSendRoomChat(sessionMode, phase)

  const roomChat = useRoomChat({
    roomId,
    panelOpen: chatOpen,
    enabled: chatEnabled,
  })

  const toggleChat = useCallback(() => {
    setChatOpen((open) => {
      if (!open) setThemeModalOpen(false)
      return !open
    })
  }, [])

  const playCycleStartRitual = useCallback(() => {
    if (prefersReducedMotion) {
      setTimerRitualFade(true)
      window.setTimeout(() => setTimerRitualFade(false), 400)
      return
    }
    const until = performance.now() + RITUAL_MS
    setSyncFlashUntil(until)
    setRitualGlow(true)
    setTimerRitualFade(true)
    window.setTimeout(() => {
      setRitualGlow(false)
      setTimerRitualFade(false)
    }, RITUAL_MS)
  }, [prefersReducedMotion])

  const bumpChrome = useCallback(() => {
    setChromeLit(true)
    if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current)
    idleTimerRef.current = window.setTimeout(() => {
      setChromeLit(false)
      idleTimerRef.current = null
    }, 2600)
  }, [])

  useEffect(() => {
    return () => {
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current)
    }
  }, [])

  useEffect(() => {
    loungePromotedRef.current = false
    if (sessionMode !== 'lounge') {
      loungeWaitTargetRef.current = null
      loungeEnteredPhaseRef.current = null
    }
  }, [sessionMode])

  useEffect(() => {
    if (sessionMode !== 'lounge' || loungeWaitTargetRef.current !== null) return
    if (isIdle) {
      loungeWaitTargetRef.current = 'prep'
      loungeEnteredPhaseRef.current = 'prep'
    }
  }, [sessionMode, isIdle])

  const enterLounge = useCallback(
    (target: LoungeWaitTarget) => {
      loungeWaitTargetRef.current = target
      loungeEnteredPhaseRef.current = isIdle ? 'prep' : phase
      loungePromotedRef.current = false
      setSessionMode('lounge')
    },
    [isIdle, phase],
  )

  /** Start focus only for participants already in the active session (not lounge/onboarding). */
  useEffect(() => {
    if (sessionMode !== 'active') return
    if (!isIdle || remainingSeconds > 0) return
    void startFocusTimer()
  }, [sessionMode, isIdle, remainingSeconds, startFocusTimer])

  useEffect(() => {
    if (sessionMode !== 'lounge') return
    if (loungePromotedRef.current) return

    const target = loungeWaitTargetRef.current
    if (!target) return

    const shouldEnter = shouldPromoteLoungeToActive(
      target,
      loungeEnteredPhaseRef.current,
      phase,
      isIdle,
      remainingSeconds,
    )

    if (!shouldEnter) return

    loungePromotedRef.current = true
    setSessionMode('active')
    playCycleStartRitual()
  }, [sessionMode, isIdle, phase, remainingSeconds, playCycleStartRitual])

  useEffect(() => {
    if (sessionMode !== 'active') {
      prevPhaseRef.current = phase
      return
    }
    if (
      (prevPhaseRef.current === 'break' || prevPhaseRef.current === 'long_break') &&
      phase === 'focus'
    ) {
      playCycleStartRitual()
    }
    prevPhaseRef.current = phase
  }, [phase, sessionMode, playCycleStartRitual])

  const chromeClass = chromeLit
    ? 'opacity-100'
    : 'opacity-[0.38] hover:opacity-100'

  const easeInOut: [number, number, number, number] = [0.42, 0, 0.58, 1]

  const canvasMotionSpeed = isLounge ? 0.35 : 1
  const canvasPulseSpeed = isLounge ? 0.001 : 0.0025
  const canvasBackground = isActive ? 'minimal' : 'full'

  const segmentDuration = getSegmentDuration(phase, cycle)
  const focusCycle: FocusCycle = studyRoom?.focus_cycle ?? '25/5'

  if (entryStatus !== 'ready') {
    const subtitle = entryMessage ?? roomEntrySubtitle(entryStatus)
    return (
      <div
        role="main"
        className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-night px-6 text-primary"
        aria-label={title}
      >
        <h1 className="text-center text-xl font-medium text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-sm text-center text-sm text-secondary">{subtitle}</p>
        )}
        <Link
          to="/painel"
          className="mt-8 rounded-xl border border-firefly/30 bg-firefly/10 px-5 py-2.5 text-sm font-medium text-firefly hover:brightness-110"
        >
          Voltar ao painel
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      role="main"
      aria-label={`Sala de estudo: ${title}`}
      className="fixed inset-0 z-10 overflow-hidden bg-night text-primary"
      onMouseMove={showChrome ? bumpChrome : undefined}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        initial={
          prefersReducedMotion ? { scale: 1 } : { scale: 1.05 }
        }
        animate={
          ritualGlow && !prefersReducedMotion
            ? { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.92] }
            : { scale: 1, opacity: 1 }
        }
        transition={{
          duration: ritualGlow ? RITUAL_MS / 1000 : entranceMs / 1000,
          ease: easeInOut,
        }}
      >
        <ImmersiveCanvas
          presentCount={presentCount}
          background={canvasBackground}
          theme={effectiveThemeId}
          motionSpeed={canvasMotionSpeed}
          pulseSpeed={canvasPulseSpeed}
          syncFlashUntil={syncFlashUntil}
        />
      </motion.div>

      {isActive && (
        <RoomFocusStage
          phase={phase}
          remainingSeconds={remainingSeconds}
          segmentDuration={segmentDuration}
          cycleCount={cycleCount}
          focusCycle={focusCycle}
          prefersReducedMotion={prefersReducedMotion}
          chromeClass={chromeClass}
          timerRitualFade={timerRitualFade}
          isPlaying={sound.isPlaying}
        />
      )}

      {sessionMode === 'onboarding' && (
        <SessionOnboarding
          title={title}
          phase={phase}
          remainingSeconds={remainingSeconds}
          segmentDuration={segmentDuration}
          showTimerProgress={!isIdle}
          presentCount={presentCount}
          prefersReducedMotion={prefersReducedMotion}
          onJoinCurrent={() => {
            setSessionMode('active')
          }}
          onWaitNext={() => {
            if (isIdle) enterLounge('prep')
            else if (phase === 'focus') enterLounge('break')
            else enterLounge('focus')
          }}
        />
      )}

      {sessionMode === 'lounge' && (
        <PreRoomLounge
          remainingSeconds={remainingSeconds}
          segmentDuration={segmentDuration}
          phase={phase}
          isPrep={isIdle}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}

      {showChrome && (
        <RoomSessionToolbar
          variant="active"
          chromeClass={chromeClass}
          presentCount={presentCount}
          prefersReducedMotion={prefersReducedMotion}
          isLeaving={isLeaving}
          onLeave={() => void onLeaveRoom()}
          showInviteButton={showInviteButton}
          inviteLabel={inviteLabel}
          onInvite={handleInvitePartnersClick}
          chatOpen={chatOpen}
          unreadCount={roomChat.unreadCount}
          onToggleChat={toggleChat}
          themeModalOpen={themeModalOpen}
          onOpenTheme={() => {
            setThemeModalOpen(true)
            setChatOpen(false)
          }}
        />
      )}

      {isLounge && (
        <RoomSessionToolbar
          variant="lounge"
          chromeClass=""
          presentCount={presentCount}
          prefersReducedMotion={prefersReducedMotion}
          showInviteButton={showInviteButton}
          inviteLabel={inviteLabel}
          onInvite={handleInvitePartnersClick}
          chatOpen={chatOpen}
          unreadCount={roomChat.unreadCount}
          onToggleChat={toggleChat}
        />
      )}

      {chatEnabled && (
        <RoomChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          canSendMessage={canSendMessage}
          prefersReducedMotion={prefersReducedMotion}
          messages={roomChat.messages}
          loading={roomChat.loading}
          sending={roomChat.sending}
          currentUserId={roomChat.currentUserId}
          onSend={roomChat.sendMessage}
        />
      )}

      <ThemeSelectorModal
        open={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        selectedThemeId={selectedThemeId}
        onSelectTheme={handleSelectTheme}
        sound={sound}
        prefersReducedMotion={prefersReducedMotion}
      />

      {roomId && studyRoom && showInviteButton && (
        <InvitePartnersModal
          open={invitePartnersOpen}
          onClose={() => setInvitePartnersOpen(false)}
          roomId={roomId}
          variant={studyRoom.is_private ? 'private' : 'public'}
          partners={acceptedPartners}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}

      <RoomMediaEmbed
        embed={sound.externalEmbed}
        isPlaying={sound.isPlaying && sound.playbackMode === 'embed'}
      />
    </motion.div>
  )
}
