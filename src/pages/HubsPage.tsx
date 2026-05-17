import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { CreatePrivateHubModal } from '@/components/hub/CreatePrivateHubModal'
import { HubListCard } from '@/components/hub/HubListCard'
import { HubRequestModal } from '@/components/hub/HubRequestModal'
import { FireflyIcon } from '@/components/landing/FireflyIcon'
import { LockIcon } from '@/components/premium/LockIcon'
import { AppToast } from '@/components/ui/AppToast'
import { useJoinedHubs } from '@/contexts/JoinedHubsContext'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { SAMPLE_HUBS } from '@/data/sampleHubs'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  appendPrivateHub,
  buildPrivateHub,
  readPrivateHubs,
} from '@/lib/privateHubs'
import {
  pageStaggerContainer,
  pageStaggerItem,
  pageStaggerListInner,
} from '@/motion/pageStagger'

const CREATE_DELAY_MS = 1000
const TOAST_MESSAGE = 'Hub Privado criado com sucesso!'

export function HubsPage() {
  const { hasGlowAccess, openPaywall } = useUserPlan()
  const { joinedSlugs, isJoined, joinHub, leaveHub } = useJoinedHubs()
  const [requestOpen, setRequestOpen] = useState(false)
  const [createPrivateOpen, setCreatePrivateOpen] = useState(false)
  const [privateHubs, setPrivateHubs] = useState(() => readPrivateHubs())
  const [toastVisible, setToastVisible] = useState(false)

  const hubs = useMemo(() => [...SAMPLE_HUBS, ...privateHubs], [privateHubs])
  const joinedHubs = useMemo(
    () =>
      joinedSlugs
        .map((slug) => hubs.find((h) => h.slug === slug))
        .filter((h): h is (typeof hubs)[number] => h !== undefined),
    [joinedSlugs, hubs],
  )
  const count = hubs.length
  const reduced = usePrefersReducedMotion()
  const c = pageStaggerContainer(reduced)
  const item = pageStaggerItem(reduced)
  const listInner = pageStaggerListInner(reduced)

  const handleCreatePrivateClick = useCallback(() => {
    if (!hasGlowAccess) {
      openPaywall()
      return
    }
    setCreatePrivateOpen(true)
  }, [hasGlowAccess, openPaywall])

  const handleCreatePrivateHub = useCallback(
    async (payload: { name: string; iconEmoji?: string }) => {
      await new Promise((resolve) => setTimeout(resolve, CREATE_DELAY_MS))
      const existingSlugs = [
        ...SAMPLE_HUBS.map((h) => h.slug),
        ...privateHubs.map((h) => h.slug),
      ]
      const hub = buildPrivateHub(payload.name, payload.iconEmoji, existingSlugs)
      const next = appendPrivateHub(hub)
      setPrivateHubs(next)
      setToastVisible(true)
    },
    [privateHubs],
  )

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      variants={c}
      initial={reduced ? false : 'hidden'}
      animate="visible"
    >
      <motion.header variants={item} className="mb-10">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Hubs por concurso
          </h1>
          <span className="inline-flex items-center rounded-md border border-aqua/35 bg-[#13243a] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
            Beta
          </span>
          <p className="text-sm text-secondary">{count} hubs disponíveis</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary">
          Cada hub agrupa salas e metas alinhadas ao edital — lista estática por
          enquanto.
        </p>
        <button
          type="button"
          onClick={handleCreatePrivateClick}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm text-secondary transition hover:border-firefly/25 hover:text-primary hover:shadow-[0_0_20px_-6px_rgba(216,255,94,0.15)]"
        >
          <LockIcon className="h-4 w-4 text-firefly/70" />
          <FireflyIcon className="h-1.5 w-1.5" />
          <span>+ Criar Hub Privado</span>
        </button>
      </motion.header>

      <motion.section variants={item} className="mb-10">
        <h2 className="text-sm font-medium text-primary">Seus Ambientes de Foco</h2>
        {joinedHubs.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">
            Você ainda não selecionou seus concursos de foco.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joinedHubs.map((hub) => (
              <li key={`joined-${hub.slug}`}>
                <HubListCard
                  hub={hub}
                  isJoined
                  onJoin={() => joinHub(hub.slug)}
                  onLeave={() => leaveHub(hub.slug)}
                />
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      <motion.ul
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={listInner}
      >
        {hubs.map((hub) => (
          <motion.li key={hub.slug} variants={item}>
            <HubListCard
              hub={hub}
              isJoined={isJoined(hub.slug)}
              onJoin={() => joinHub(hub.slug)}
              onLeave={() => leaveHub(hub.slug)}
            />
          </motion.li>
        ))}
        <motion.li variants={item}>
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="flex h-full min-h-[8.5rem] w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-transparent px-5 py-5 text-sm text-secondary transition hover:border-white/20 hover:text-primary"
          >
            + Não encontrou seu concurso?
          </button>
        </motion.li>
      </motion.ul>

      <HubRequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        prefersReducedMotion={reduced}
      />

      <CreatePrivateHubModal
        open={createPrivateOpen}
        onClose={() => setCreatePrivateOpen(false)}
        onCreate={handleCreatePrivateHub}
        prefersReducedMotion={reduced}
      />

      <AppToast
        message={TOAST_MESSAGE}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </motion.div>
  )
}
