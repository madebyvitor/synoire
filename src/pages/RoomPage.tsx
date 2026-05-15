import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const FOCUS_MINUTES = 25
const BREAK_MINUTES = 5

type Phase = 'focus' | 'break'

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [phase, setPhase] = useState<Phase>('focus')
  const [remaining, setRemaining] = useState(FOCUS_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const phaseRef = useRef(phase)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const clearTick = useCallback(() => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!running) {
      clearTick()
      return
    }
    tickRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1
        const nextPhase: Phase =
          phaseRef.current === 'focus' ? 'break' : 'focus'
        phaseRef.current = nextPhase
        setPhase(nextPhase)
        return (
          (nextPhase === 'focus' ? FOCUS_MINUTES : BREAK_MINUTES) * 60
        )
      })
    }, 1000)
    return clearTick
  }, [running, clearTick])

  const reset = () => {
    setRunning(false)
    phaseRef.current = 'focus'
    setPhase('focus')
    setRemaining(FOCUS_MINUTES * 60)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-8">
      <Link
        to="/painel"
        className="self-start text-sm text-muted hover:text-foreground"
      >
        ← Painel
      </Link>
      <p className="mt-8 text-xs uppercase tracking-widest text-muted">
        Sala {roomId ?? '—'}
      </p>
      <h1 className="mt-2 text-center text-xl font-semibold text-foreground">
        Pomodoro (local)
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Sincronização entre participantes virá com{' '}
        <span className="text-foreground/80">Supabase Realtime</span>.
      </p>
      <div className="mt-12 flex flex-col items-center rounded-3xl border border-border bg-surface-1 px-12 py-14">
        <p className="text-sm font-medium text-accent">
          {phase === 'focus' ? 'Foco' : 'Pausa'}
        </p>
        <p className="mt-4 text-6xl font-semibold tabular-nums tracking-tight text-foreground md:text-7xl">
          {formatTime(remaining)}
        </p>
        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-surface-0 hover:brightness-110"
          >
            {running ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Resetar
          </button>
        </div>
      </div>
    </div>
  )
}
