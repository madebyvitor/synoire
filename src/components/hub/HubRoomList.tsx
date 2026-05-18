import { motion } from 'motion/react'
import { HubRoomCard } from '@/components/hub/HubRoomCard'
import type { StudyRoom } from '@/lib/hubRooms'
import {
  pageStaggerContainer,
  pageStaggerItem,
  pageStaggerListInner,
} from '@/motion/pageStagger'

type HubRoomListProps = {
  rooms: StudyRoom[]
  isLoading: boolean
  hubName: string
  onOpenCreate: () => void
  prefersReducedMotion: boolean
}

export function HubRoomList({
  rooms,
  isLoading,
  hubName,
  onOpenCreate,
  prefersReducedMotion,
}: HubRoomListProps) {
  const c = pageStaggerContainer(prefersReducedMotion)
  const item = pageStaggerItem(prefersReducedMotion)
  const listInner = pageStaggerListInner(prefersReducedMotion)

  return (
    <motion.section variants={item} className="mt-8">
      <motion.div
        variants={item}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">
          Salas ativas
        </h2>
        <button
          type="button"
          onClick={onOpenCreate}
          className="rounded-xl border border-firefly/30 bg-firefly/10 px-4 py-2 text-sm font-medium text-firefly transition hover:border-firefly/50 hover:bg-firefly/15"
        >
          + Criar sala
        </button>
      </motion.div>

      {isLoading ? (
        <p className="mt-6 text-sm text-secondary">Carregando salas…</p>
      ) : rooms.length === 0 ? (
        <motion.div
          variants={c}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
          className="mt-6 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center"
        >
          <p className="text-sm text-secondary">
            Nenhuma sala ativa em {hubName} ainda.
          </p>
          <p className="mt-2 text-xs text-secondary/80">
            Crie uma sala e comece um ciclo de foco com quem estiver online.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-6 rounded-xl bg-firefly px-5 py-2.5 text-sm font-medium text-night hover:brightness-110"
          >
            + Nova sala
          </button>
        </motion.div>
      ) : (
        <motion.ul
          className="mt-6 grid gap-4 sm:grid-cols-2"
          variants={listInner}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
        >
          {rooms.map((room) => (
            <motion.li key={room.id} variants={item}>
              <HubRoomCard room={room} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.section>
  )
}
