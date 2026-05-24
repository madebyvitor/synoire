import type { FocusCycle } from '@/lib/hubRooms/types'
import type { RoomPhase } from '@/lib/roomTimer'
import { RoomAmbientWaveform } from '@/components/room/RoomAmbientWaveform'

type RoomSessionFooterProps = {
  phase: RoomPhase
  focusCycle: FocusCycle
  isPlaying: boolean
  /** When true, positions relative to a parent container (e.g. landing preview). */
  embedded?: boolean
  chromeClass?: string
  prefersReducedMotion?: boolean
  className?: string
}

export function RoomSessionFooter({
  phase,
  focusCycle,
  isPlaying,
  embedded = false,
  chromeClass = '',
  prefersReducedMotion = false,
  className = '',
}: RoomSessionFooterProps) {
  const phaseLabel =
    phase === 'focus'
      ? 'Sessão de foco'
      : phase === 'long_break'
        ? 'Pausa longa'
        : 'Pausa curta'
  const positionClass = embedded ? 'absolute inset-x-0 bottom-8' : 'fixed inset-x-0 bottom-8'

  return (
    <footer
      className={`pointer-events-none z-10 flex flex-col items-center gap-4 px-6 transition-opacity duration-500 ${positionClass} ${chromeClass} ${className}`}
    >
      <p
        className={`text-center text-[0.65rem] font-medium uppercase tracking-[0.2em] sm:text-xs ${
          phase === 'focus'
            ? 'text-firefly/90'
            : phase === 'long_break'
              ? 'text-sky-300/90'
              : 'text-aqua/90'
        }`}
      >
        {phaseLabel} · {focusCycle}
      </p>
      <RoomAmbientWaveform
        isPlaying={isPlaying}
        phaseAccent={phase === 'focus' ? 'focus' : 'break'}
        prefersReducedMotion={prefersReducedMotion}
        className="opacity-80"
      />
    </footer>
  )
}
