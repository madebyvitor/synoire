import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CreateRoomModal } from '@/components/hub/CreateRoomModal'
import { HubRoomList } from '@/components/hub/HubRoomList'
import { getHubBySlug } from '@/data/sampleHubs'
import { useHubRooms } from '@/hooks/useHubRooms'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

export function HubDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const hub = getHubBySlug(slug)
  const reduced = usePrefersReducedMotion()
  const c = pageStaggerContainer(reduced)
  const item = pageStaggerItem(reduced)

  const { rooms, isLoading, error, createRoom } = useHubRooms(slug)
  const [createOpen, setCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!hub) {
    return (
      <motion.div
        className="mx-auto max-w-lg py-16 text-center"
        variants={c}
        initial={reduced ? false : 'hidden'}
        animate="visible"
      >
        <motion.p variants={item} className="text-secondary">
          Hub não encontrado.
        </motion.p>
        <motion.div variants={item}>
          <Link to="/hubs" className="mt-4 inline-block text-sm text-aqua">
            Voltar aos hubs
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  const handleCreate = async (
    theme: string,
    focusCycle: Parameters<typeof createRoom>[1],
    isPrivate: boolean,
  ) => {
    setIsSubmitting(true)
    try {
      const room = await createRoom(theme, focusCycle, isPrivate)
      navigate(`/salas/${room.id}`, { state: { sessionStart: 'lounge' } })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      key={slug}
      className="mx-auto max-w-3xl"
      variants={c}
      initial={reduced ? false : 'hidden'}
      animate="visible"
    >
      <motion.div variants={item}>
        <Link
          to="/hubs"
          className="text-sm text-secondary hover:text-primary"
        >
          ← Hubs
        </Link>
      </motion.div>
      <motion.header variants={item} className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-primary">{hub.name}</h1>
          {hub.isPrivate && (
            <span className="rounded-md border border-firefly/40 bg-firefly/10 px-2 py-0.5 text-xs font-semibold text-firefly">
              Hub Privado
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-secondary">
          Salas de foco criadas por estudantes neste hub. Salas vazias por mais
          de 24 horas somem da lista.
        </p>
      </motion.header>

      {error && (
        <motion.p variants={item} className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </motion.p>
      )}

      <HubRoomList
        rooms={rooms}
        isLoading={isLoading}
        hubName={hub.name}
        onOpenCreate={() => setCreateOpen(true)}
        prefersReducedMotion={reduced}
      />

      <CreateRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        prefersReducedMotion={reduced}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  )
}
