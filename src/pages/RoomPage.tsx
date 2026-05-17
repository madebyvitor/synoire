import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImmersiveCanvas } from '@/components/room/ImmersiveCanvas'
import { PreRoomLounge } from '@/components/room/PreRoomLounge'
import { SessionOnboarding } from '@/components/room/SessionOnboarding'
import { SAMPLE_HUBS } from '@/data/sampleHubs'
import { DEFAULT_SOUNDSCAPES } from '@/data/defaultSoundscapes'
import { useGlobalRoomTimer } from '@/hooks/useGlobalRoomTimer'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useRoomSoundscape } from '@/hooks/useRoomSoundscape'
import { formatTimerSeconds } from '@/lib/roomTimer'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type SessionMode = 'onboarding' | 'lounge' | 'active'

const RITUAL_MS = 2000

function roomTitle(roomId: string | undefined) {
  if (!roomId) return 'Sala de estudo'
  const hub = SAMPLE_HUBS.find((h) => h.slug === roomId)
  if (hub) return `Sala ${hub.name}`
  if (roomId === 'demo') return ''
  const pretty = roomId.replace(/[-_]/g, ' ')
  return `Sala ${pretty.charAt(0).toUpperCase()}${pretty.slice(1)}`
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const title = useMemo(() => roomTitle(roomId), [roomId])
  const prefersReducedMotion = usePrefersReducedMotion()
  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const timer = useGlobalRoomTimer(roomId)
  const { phase, remainingSeconds, secondsUntilNextFocus, presentCount } = timer

  const [sessionMode, setSessionMode] = useState<SessionMode>('onboarding')
  const [syncFlashUntil, setSyncFlashUntil] = useState(0)
  const [ritualGlow, setRitualGlow] = useState(false)
  const [timerRitualFade, setTimerRitualFade] = useState(false)

  const [chromeLit, setChromeLit] = useState(false)
  const [soundOpen, setSoundOpen] = useState(false)
  const idleTimerRef = useRef<number | null>(null)
  const prevPhaseRef = useRef(phase)
  const loungePromotedRef = useRef(false)

  const sound = useRoomSoundscape()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const entranceMs = useMemo(() => {
    if (prefersReducedMotion) return 420
    return 700 + Math.floor(Math.random() * 500)
  }, [prefersReducedMotion])

  const isLounge = sessionMode === 'lounge'
  const isActive = sessionMode === 'active'
  const showChrome = isActive

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
  }, [sessionMode])

  useEffect(() => {
    if (sessionMode !== 'lounge') return
    if (secondsUntilNextFocus > 0) return
    if (loungePromotedRef.current) return
    loungePromotedRef.current = true
    setSessionMode('active')
    playCycleStartRitual()
  }, [sessionMode, secondsUntilNextFocus, playCycleStartRitual])

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
          onJoinCurrent={() => setSessionMode('active')}
          onWaitNext={() => setSessionMode('lounge')}
        />
      )}

      {sessionMode === 'lounge' && (
        <PreRoomLounge
          secondsUntilNextFocus={secondsUntilNextFocus}
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

      {showChrome && soundOpen && (
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
