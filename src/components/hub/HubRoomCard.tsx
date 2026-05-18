import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatRoomCardTimeLabel } from '@/lib/hubRooms'
import type { StudyRoom } from '@/lib/hubRooms'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type HubRoomCardProps = {
  room: StudyRoom
}

export function HubRoomCard({ room }: HubRoomCardProps) {
  const reduced = usePrefersReducedMotion()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const timeLabel = formatRoomCardTimeLabel(room.current_timer_state, now)

  return (
    <motion.article
      className="group relative rounded-2xl border border-white/5 bg-panel p-5 transition hover:border-white/10"
      whileHover={reduced ? undefined : { y: -2 }}
    >
      <h3 className="text-base font-semibold leading-snug text-primary">{room.name}</h3>

      <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-full bg-firefly shadow-[0_0_8px_rgba(163,163,79,0.65)] ${reduced ? '' : 'landing-firefly'}`}
          aria-hidden
        />
        <span>
          {room.present_count} {room.present_count === 1 ? 'luz' : 'luzes'}
        </span>
      </div>

      <p className="mt-2 text-sm text-secondary">{timeLabel}</p>

      <Link
        to={`/salas/${room.id}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly/50"
        aria-label={`Entrar na sala ${room.name}`}
      >
        <span className="sr-only">Entrar</span>
      </Link>

      <span
        className="pointer-events-none absolute bottom-4 right-4 rounded-lg border border-white/10 bg-night/90 px-3 py-1.5 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
        aria-hidden
      >
        Entrar
      </span>
    </motion.article>
  )
}
