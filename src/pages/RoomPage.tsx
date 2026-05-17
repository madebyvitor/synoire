import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ImmersiveCanvas } from '@/components/room/ImmersiveCanvas'
import { PreRoomLounge } from '@/components/room/PreRoomLounge'
import { RoomChat, RoomChatToggleButton } from '@/components/room/RoomChat'
import { SessionOnboarding } from '@/components/room/SessionOnboarding'
import { SAMPLE_HUBS } from '@/data/sampleHubs'
import { DEFAULT_SOUNDSCAPES } from '@/data/defaultSoundscapes'
import { useGlobalRoomTimer } from '@/hooks/useGlobalRoomTimer'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useStudyRoom } from '@/hooks/useStudyRoom'
import { useRoomChat } from '@/hooks/useRoomChat'
import { useRoomSoundscape } from '@/hooks/useRoomSoundscape'
import { canSendRoomChat } from '@/lib/roomChat'
import { formatTimerSeconds, type RoomPhase } from '@/lib/roomTimer'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type SessionMode = 'onboarding' | 'lounge' | 'active'

/** What the lounge is waiting for before auto-entering the room. */
type LoungeWaitTarget = 'prep' | 'break' | 'focus'

const RITUAL_MS = 2000

type RoomLocationState = {
  sessionStart?: SessionMode
}

function roomTitle(roomId: string | undefined, studyName: string | null) {
  if (studyName) return studyName
  if (!roomId) return 'Sala de estudo'
  const hub = SAMPLE_HUBS.find((h) => h.slug === roomId)
  if (hub) return `Sala ${hub.name}`
  if (roomId === 'demo') return ''
  const pretty = roomId.replace(/[-_]/g, ' ')
  return `Sala ${pretty.charAt(0).toUpperCase()}${pretty.slice(1)}`
}

function initialSessionMode(state: unknown): SessionMode {
  const s = state as RoomLocationState | null
  if (s?.sessionStart === 'lounge' || s?.sessionStart === 'active') {
    return s.sessionStart
  }
  return 'onboarding'
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const { room: studyRoom } = useStudyRoom(roomId)
  const title = useMemo(
    () => roomTitle(roomId, studyRoom?.name ?? null),
    [roomId, studyRoom?.name],
  )
  const prefersReducedMotion = usePrefersReducedMotion()
  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const timer = useGlobalRoomTimer(roomId, studyRoom)
  const { phase, remainingSeconds, presentCount, isIdle, startFocusTimer } = timer

  const [sessionMode, setSessionMode] = useState<SessionMode>(() =>
    initialSessionMode(location.state),
  )
  const [syncFlashUntil, setSyncFlashUntil] = useState(0)
  const [ritualGlow, setRitualGlow] = useState(false)
  const [timerRitualFade, setTimerRitualFade] = useState(false)

  const [chromeLit, setChromeLit] = useState(false)
  const [soundOpen, setSoundOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const idleTimerRef = useRef<number | null>(null)
  const prevPhaseRef = useRef(phase)
  const loungePromotedRef = useRef(false)
  const loungeWaitTargetRef = useRef<LoungeWaitTarget | null>(null)
  const loungeEnteredPhaseRef = useRef<RoomPhase | 'prep' | null>(null)

  const sound = useRoomSoundscape()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const entranceMs = useMemo(() => {
    if (prefersReducedMotion) return 420
    return 700 + Math.floor(Math.random() * 500)
  }, [prefersReducedMotion])

  const isLounge = sessionMode === 'lounge'
  const isActive = sessionMode === 'active'
  const showChrome = isActive
  const chatEnabled = isLounge || isActive
  const canSendMessage = canSendRoomChat(sessionMode, phase)

  const roomChat = useRoomChat({
    roomId,
    panelOpen: chatOpen,
    enabled: chatEnabled,
  })

  const toggleChat = useCallback(() => {
    setChatOpen((open) => {
      if (!open) setSoundOpen(false)
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
    void sound.playFocusChime()
    window.setTimeout(() => {
      setRitualGlow(false)
      setTimerRitualFade(false)
    }, RITUAL_MS)
  }, [prefersReducedMotion, sound])

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

  useEffect(() => {
    if (sessionMode !== 'active') return
    if (!isIdle) return
    void startFocusTimer()
  }, [sessionMode, isIdle, startFocusTimer])

  /** After 1 min prep, start focus even if user is not in lounge yet. */
  useEffect(() => {
    if (!isIdle || remainingSeconds > 0) return
    void startFocusTimer()
  }, [isIdle, remainingSeconds, startFocusTimer])

  useEffect(() => {
    if (sessionMode !== 'lounge') return
    if (loungePromotedRef.current) return

    const target = loungeWaitTargetRef.current
    if (!target) return

    const shouldEnter =
      (target === 'prep' && isIdle && remainingSeconds === 0) ||
      (target === 'break' &&
        phase === 'break' &&
        loungeEnteredPhaseRef.current === 'focus') ||
      (target === 'focus' &&
        phase === 'focus' &&
        !isIdle &&
        loungeEnteredPhaseRef.current === 'break')

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
    if (prevPhaseRef.current === 'break' && phase === 'focus') {
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
          motionSpeed={canvasMotionSpeed}
          pulseSpeed={canvasPulseSpeed}
          syncFlashUntil={syncFlashUntil}
        />
      </motion.div>

      {isActive && (
        <motion.div
          key={roomId ?? 'room'}
          className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 pb-24 pt-16"
          variants={staggerC}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
        >
          <motion.p
            variants={staggerItem}
            className={`text-center text-xs font-medium uppercase tracking-[0.2em] transition-opacity duration-500 ${chromeClass} ${
              phase === 'focus' ? 'text-firefly' : 'text-aqua'
            }`}
          >
            {phase === 'focus' ? 'Sessão de foco' : 'Pausa curta'}
          </motion.p>

          <motion.h1
            variants={staggerItem}
            className="mt-3 text-center text-lg font-normal text-secondary transition-opacity duration-500 sm:text-xl"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className={`mt-2 text-center text-sm text-secondary transition-opacity duration-500 ${chromeClass}`}
          >
            {presentCount} presentes
          </motion.p>

          <motion.p
            variants={staggerItem}
            className={`mt-14 font-mono text-6xl font-light tabular-nums tracking-tight sm:text-7xl md:text-8xl ${phase === 'focus' ? 'text-primary' : 'text-aqua'}`}
            initial={timerRitualFade ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: timerRitualFade ? 0.3 : 0, duration: 0.6 }}
          >
            {formatTimerSeconds(remainingSeconds)}
          </motion.p>
        </motion.div>
      )}

      {sessionMode === 'onboarding' && (
        <SessionOnboarding
          title={title}
          phase={phase}
          remainingSeconds={remainingSeconds}
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
          phase={phase}
          isPrep={isIdle}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}

      {showChrome && (
        <motion.div
          role="toolbar"
          aria-label="Ações da sala"
          className={`pointer-events-none fixed left-0 right-0 top-0 z-20 flex items-start justify-between gap-3 p-4 transition-opacity duration-500 sm:p-6 ${chromeClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Link
            to="/painel"
            className="pointer-events-auto rounded-lg px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary"
          >
            Sair
          </Link>
          <motion.div className="pointer-events-auto flex items-center gap-2">
            <RoomChatToggleButton
              open={chatOpen}
              unreadCount={roomChat.unreadCount}
              onClick={toggleChat}
            />
            <button
              type="button"
              onClick={() => setSoundOpen((o) => !o)}
              className="rounded-lg px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary"
              aria-expanded={soundOpen}
            >
              Som
            </button>
          </motion.div>
        </motion.div>
      )}

      {isLounge && (
        <div className="pointer-events-none fixed right-0 top-0 z-20 p-4 sm:p-6">
          <RoomChatToggleButton
            open={chatOpen}
            unreadCount={roomChat.unreadCount}
            onClick={toggleChat}
            className="pointer-events-auto"
          />
        </div>
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

      {showChrome && soundOpen && !chatOpen && (
        <div
          className="pointer-events-auto fixed right-4 top-14 z-30 w-[min(100%-2rem,20rem)] rounded-2xl border border-border bg-surface p-4 shadow-lg sm:right-6"
          role="dialog"
          aria-label="Configurar som ambiente"
        >
          <motion.div
            className="flex items-center justify-between gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm font-medium text-primary">Ambiente</p>
            <button
              type="button"
              className="text-xs text-aqua hover:underline"
              onClick={() => sound.togglePause()}
              disabled={!sound.activeLabel}
            >
              {sound.isPlaying ? 'Pausar áudio' : 'Retomar'}
            </button>
          </motion.div>

          <label className="mt-4 block text-xs text-secondary">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={sound.userVolume}
              onChange={(e) =>
                sound.setUserVolume(Number.parseFloat(e.target.value))
              }
              className="mt-1 block w-full accent-firefly"
            />
          </label>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-secondary">
            Synoire default
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
            {DEFAULT_SOUNDSCAPES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-2 text-left text-primary hover:bg-elevated"
                  onClick={() => void sound.playLibraryTrack(t.file, t.label)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-secondary">
            MP3 local (não enviado ao servidor)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void sound.setCustomFile(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="mt-2 w-full rounded-xl border border-dashed border-border py-6 text-sm text-secondary hover:border-aqua/50 hover:bg-elevated"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f?.type === 'audio/mpeg' || f.name.toLowerCase().endsWith('.mp3')) {
                void sound.setCustomFile(f)
              }
            }}
          >
            Arrastar MP3 ou clicar para escolher
          </button>
          {sound.activeLabel && (
            <p className="mt-2 truncate text-xs text-aqua" title={sound.activeLabel}>
              A tocar: {sound.activeLabel}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}
