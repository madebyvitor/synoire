import { motion } from 'motion/react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import type { EditProfileSavePayload } from '@/components/profile/EditProfileModal'
import { FavoriteHubCard } from '@/components/profile/FavoriteHubCard'
import { AppToast } from '@/components/ui/AppToast'
import { useJoinedHubs } from '@/contexts/JoinedHubsContext'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useProfile } from '@/hooks/useProfile'
import { useUserStats } from '@/hooks/useUserStats'
import { formatTargetExamSlug } from '@/lib/profile'
import {
  pageStaggerContainer,
  pageStaggerItem,
  pageStaggerListInner,
} from '@/motion/pageStagger'

function initialsFromName(name: string | null): string {
  if (!name?.trim()) return 'US'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const a = parts[0][0]
  const b = parts[parts.length - 1][0]
  return `${a}${b}`.toUpperCase()
}

function FieldBlock({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-secondary/80">
        {label}
      </p>
      <div className="mt-1.5 text-sm text-primary">{children}</div>
    </div>
  )
}

function LightningWatermark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  )
}

export function ProfilePage() {
  const reducedMotion = usePrefersReducedMotion()
  const { profile, isLoading, error, isSaving, updateProfile } = useProfile()
  const {
    stats,
    isLoading: statsLoading,
    isSaving: isSavingGoal,
    saveWeeklyGoal,
  } = useUserStats()
  const { joinedHubs, isLoading: hubsLoading } = useJoinedHubs()
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState({ message: '', visible: false })

  const c = pageStaggerContainer(reducedMotion)
  const item = pageStaggerItem(reducedMotion)
  const listInner = pageStaggerListInner(reducedMotion)

  const dash = '—'
  const displayName = profile?.displayName ?? null
  const initials = useMemo(() => initialsFromName(displayName), [displayName])
  const nameLine = displayName?.trim() || dash
  const examLine = formatTargetExamSlug(profile?.targetExam) ?? profile?.targetExam?.trim() ?? dash
  const bioText = profile?.bio?.trim()

  const editInitialValues = useMemo(
    () => ({
      username: profile?.displayName ?? '',
      targetExam: profile?.targetExam ?? '',
      bio: profile?.bio ?? '',
      weeklyGoalHours:
        stats.weeklyGoalMinutes > 0 ? String(stats.weeklyGoalMinutes / 60) : '',
    }),
    [profile, stats.weeklyGoalMinutes],
  )

  const isSubmitting = isSaving || isSavingGoal

  const handleSaveProfile = useCallback(
    async (
      payload: EditProfileSavePayload,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      const [goalResult, profileResult] = await Promise.all([
        saveWeeklyGoal(payload.weeklyGoalHours),
        updateProfile({
          username: payload.username,
          targetExam: payload.targetExam,
          bio: payload.bio,
        }),
      ])

      if (!goalResult.ok) {
        return { ok: false, message: goalResult.message }
      }
      if (!profileResult.ok) {
        return { ok: false, message: profileResult.message }
      }

      setEditOpen(false)
      setToast({ message: 'Perfil atualizado com sucesso!', visible: true })
      return { ok: true }
    },
    [saveWeeklyGoal, updateProfile],
  )

  if (isLoading || statsLoading) {
    return (
      <motion.div
        className="mx-auto flex max-w-2xl items-center justify-center py-24 text-secondary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        aria-busy="true"
        aria-label="Carregando perfil"
      >
        <span className="text-sm">Carregando…</span>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {error && (
        <p
          className="mb-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral"
          role="alert"
        >
          {error}
        </p>
      )}

      <motion.article
        whileHover={
          reducedMotion
            ? undefined
            : { scale: 1.008, transition: { duration: 0.2 } }
        }
        className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-elevated shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
      >
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-firefly shadow-[0_0_24px_rgba(163,163,79,0.35)]"
          aria-hidden
        />
        <LightningWatermark className="pointer-events-none absolute right-5 top-5 h-9 w-9 text-firefly/[0.12]" />

        <motion.div
          variants={c}
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
          className="relative grid gap-8 p-8 pl-9 md:grid-cols-[auto_1fr] md:gap-10 md:p-10 md:pl-11"
        >
          <motion.div variants={item} className="flex flex-col items-center md:items-start">
            <motion.div className="relative">
              {!reducedMotion && (
                <motion.div
                  className="absolute -inset-3 rounded-full bg-firefly/25 blur-xl"
                  animate={{
                    opacity: [0.35, 0.65, 0.35],
                    scale: [1, 1.12, 1],
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              <motion.div className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-gradient-to-br from-firefly to-aqua text-lg font-bold tracking-tight text-night shadow-[0_0_0_3px_rgba(163,163,79,0.35),0_0_28px_rgba(163,163,79,0.2)]">
                {initials}
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div variants={listInner} className="min-w-0 space-y-8">
            <motion.header variants={item}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-primary">
                    Perfil
                  </h1>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-secondary">
                    Nome público, concurso-alvo e preferências de foco
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="shrink-0 rounded-xl border border-firefly/30 bg-firefly/10 px-4 py-2 text-sm font-medium text-firefly transition hover:border-firefly/50 hover:brightness-110"
                >
                  Editar Perfil
                </button>
              </div>
            </motion.header>

            <motion.div variants={item} className="space-y-6">
              <FieldBlock label="Nome">{nameLine}</FieldBlock>

              <FieldBlock label="Hubs Favoritos">
                {hubsLoading ? (
                  <span className="text-secondary">Carregando…</span>
                ) : joinedHubs.length === 0 ? (
                  <p className="text-secondary">
                    Nenhum hub favorito ainda.{' '}
                    <Link
                      to="/hubs"
                      className="text-firefly underline-offset-2 hover:underline"
                    >
                      Explorar hubs
                    </Link>
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {joinedHubs.map((hub) => (
                      <FavoriteHubCard key={hub.id} hub={hub} />
                    ))}
                  </div>
                )}
              </FieldBlock>

              <FieldBlock label="Concurso-alvo">{examLine}</FieldBlock>

              <FieldBlock label="Bio">
                {bioText ? (
                  <p className="max-w-prose whitespace-pre-wrap leading-relaxed text-secondary">
                    {bioText}
                  </p>
                ) : (
                  <span className="text-secondary">{dash}</span>
                )}
              </FieldBlock>

              <FieldBlock label="XP / nível">
                <motion.span
                  className="inline-flex cursor-default rounded-lg border border-aqua/35 bg-aqua/15 px-2.5 py-1 text-xs font-medium text-aqua"
                  whileHover={
                    reducedMotion ? undefined : { scale: 1.04, filter: 'brightness(1.12)' }
                  }
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  Em breve
                </motion.span>
              </FieldBlock>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.article>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        prefersReducedMotion={reducedMotion}
        initialValues={editInitialValues}
        onSave={handleSaveProfile}
        isSubmitting={isSubmitting}
      />

      <AppToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
