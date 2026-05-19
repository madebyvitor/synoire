import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PartnerAvatar } from '@/components/dashboard/PartnerAvatar'
import { InvitePartnerModal } from '@/components/dashboard/InvitePartnerModal'
import { AppToast } from '@/components/ui/AppToast'
import { useStudyPartners } from '@/contexts/StudyPartnersContext'
import type { StudyPartnerView } from '@/lib/studyPartners'

export type StudyPartnersSidebarProps = {
  open: boolean
  onClose: () => void
  prefersReducedMotion?: boolean
}

function StreakBadge({ days }: { days: number }) {
  return (
    <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-secondary">
      🔥 {days} {days === 1 ? 'dia' : 'dias'}
    </span>
  )
}

function OnlinePartnerRow({
  partner,
  onJoinRoom,
}: {
  partner: StudyPartnerView
  onJoinRoom: (roomId: string) => void
}) {
  const roomLabel = partner.currentRoomLabel
  const canJoin = Boolean(partner.currentRoomId && roomLabel)

  return (
    <li className="group relative rounded-xl border border-transparent px-2 py-2.5 transition hover:border-white/5 hover:bg-white/[0.03]">
      <div className="flex items-start gap-3">
        <PartnerAvatar partner={partner} showPresenceIndicator />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium text-primary">
              {partner.displayName}
            </span>
            <StreakBadge days={partner.currentStreak} />
          </div>
          {roomLabel && (
            <p className="mt-1 text-xs leading-snug text-firefly">
              Na sala: {roomLabel}
            </p>
          )}
        </div>
      </div>
      {canJoin && (
        <button
          type="button"
          onClick={() => onJoinRoom(partner.currentRoomId!)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-firefly/30 bg-panel/95 px-2.5 py-1.5 text-[11px] font-medium text-firefly opacity-0 shadow-sm transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly/50"
        >
          Entrar na Sala
        </button>
      )}
    </li>
  )
}

function OfflinePartnerRow({ partner }: { partner: StudyPartnerView }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2 opacity-80">
      <PartnerAvatar partner={partner} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-primary">{partner.displayName}</p>
      </div>
      <StreakBadge days={partner.currentStreak} />
    </li>
  )
}

function IncomingInviteRow({
  partner,
  onAccept,
  onDecline,
  disabled,
}: {
  partner: StudyPartnerView
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  disabled?: boolean
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/5 px-2 py-2.5">
      <PartnerAvatar partner={partner} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-primary">@{partner.username}</p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAccept(partner.partnershipId)}
          className="rounded-lg border border-firefly/30 bg-firefly/10 px-2 py-1 text-[11px] font-medium text-firefly hover:brightness-110 disabled:opacity-50"
        >
          Aceitar
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDecline(partner.partnershipId)}
          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-secondary hover:bg-elevated hover:text-primary disabled:opacity-50"
        >
          Recusar
        </button>
      </div>
    </li>
  )
}

function OutgoingInviteRow({ partner }: { partner: StudyPartnerView }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2 opacity-75">
      <PartnerAvatar partner={partner} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-primary">@{partner.username}</p>
        <p className="text-[11px] text-secondary">Aguardando resposta</p>
      </div>
    </li>
  )
}

function Section({
  title,
  children,
  empty,
}: {
  title: string
  children: React.ReactNode
  empty?: string
}) {
  return (
    <section className="border-b border-white/5 px-4 py-4 last:border-b-0">
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-secondary">
        {title}
      </h3>
      {empty ? (
        <p className="text-xs text-secondary/80">{empty}</p>
      ) : (
        <ul className="space-y-1">{children}</ul>
      )}
    </section>
  )
}

export function StudyPartnersSidebar({
  open,
  onClose,
  prefersReducedMotion = false,
}: StudyPartnersSidebarProps) {
  const navigate = useNavigate()
  const {
    onlinePartners,
    offlinePartners,
    incomingInvites,
    outgoingInvites,
    isLoading,
    error,
    sendPartnerInvite,
    acceptInvite,
    declineInvite,
  } = useStudyPartners()

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  })

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true })
  }, [])

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      onClose()
      navigate(`/salas/${roomId}`)
    },
    [navigate, onClose],
  )

  const handleSendInvite = useCallback(
    async (username: string) => {
      const result = await sendPartnerInvite(username)
      if (!result.ok) {
        if (result.error === 'not_found') {
          return { ok: false as const, error: 'Estudante não encontrado. Verifique o @username.' }
        }
        if (result.error === 'already_exists') {
          return {
            ok: false as const,
            error: 'Já existe convite ou parceria com este usuário.',
          }
        }
        if (result.error === 'self_invite') {
          return { ok: false as const, error: 'Você não pode convidar a si mesmo.' }
        }
        return { ok: false as const, error: 'Username inválido.' }
      }
      showToast('Convite enviado.')
      return { ok: true as const }
    },
    [sendPartnerInvite, showToast],
  )

  const handleAccept = useCallback(
    async (partnershipId: string) => {
      setActingId(partnershipId)
      await acceptInvite(partnershipId)
      setActingId(null)
    },
    [acceptInvite],
  )

  const handleDecline = useCallback(
    async (partnershipId: string) => {
      setActingId(partnershipId)
      await declineInvite(partnershipId)
      setActingId(null)
    },
    [declineInvite],
  )

  const slide = prefersReducedMotion
    ? { initial: false, animate: { x: 0 }, exit: { x: 0 } }
    : {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
      }

  return (
    <>
      <AnimatePresence>
        {open && (
            <motion.aside
            role="dialog"
            aria-label="Parceiros de estudo"
            className="pointer-events-auto fixed bottom-0 right-0 top-0 z-40 flex w-[min(100%,22rem)] flex-col border-l border-white/5 bg-panel shadow-xl"
            {...slide}
            transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.42, 0, 0.58, 1] }}
          >
            {error && (
              <p className="border-b border-white/5 px-4 py-2 text-xs text-secondary" role="alert">
                {error}
              </p>
            )}
            <header className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-medium text-primary">Parceiros</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-xs text-secondary hover:bg-white/5 hover:text-primary"
                aria-label="Fechar painel de parceiros"
              >
                Fechar
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="px-4 py-6 text-xs text-secondary">Carregando parceiros…</p>
              ) : (
                <>
              <Section
                title="Focando agora"
                empty={
                  onlinePartners.length === 0
                    ? 'Nenhum parceiro estudando no momento.'
                    : undefined
                }
              >
                {onlinePartners.map((p) => (
                  <OnlinePartnerRow key={p.partnershipId} partner={p} onJoinRoom={handleJoinRoom} />
                ))}
              </Section>

              <Section
                title="Offline"
                empty={
                  offlinePartners.length === 0
                    ? 'Nenhum parceiro offline no momento.'
                    : undefined
                }
              >
                {offlinePartners.map((p) => (
                  <OfflinePartnerRow key={p.partnershipId} partner={p} />
                ))}
              </Section>

              {(incomingInvites.length > 0 || outgoingInvites.length > 0) && (
                <Section title="Convites pendentes">
                  {incomingInvites.map((p) => (
                    <IncomingInviteRow
                      key={p.partnershipId}
                      partner={p}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      disabled={actingId === p.partnershipId}
                    />
                  ))}
                  {outgoingInvites.map((p) => (
                    <OutgoingInviteRow key={p.partnershipId} partner={p} />
                  ))}
                </Section>
              )}
                </>
              )}
            </div>

            <footer className="shrink-0 border-t border-white/5 p-4">
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="w-full rounded-xl border border-firefly/30 bg-firefly/10 py-2.5 text-sm font-medium text-firefly transition hover:border-firefly/50 hover:brightness-110"
              >
                + Convidar Parceiro
              </button>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>

      <InvitePartnerModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        prefersReducedMotion={prefersReducedMotion}
        onSend={handleSendInvite}
      />

      <AppToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </>
  )
}
