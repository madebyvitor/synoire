import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LockIcon } from '@/components/premium/LockIcon'
import { useUserPlan } from '@/contexts/UserPlanContext'
import type { useRoomSoundscape } from '@/hooks/useRoomSoundscape'
import {
  IMMERSIVE_THEMES,
  type ImmersiveThemeId,
} from '@/lib/immersiveThemes'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

const GLOW_PAYWALL_MESSAGE =
  'Ambientes imersivos são exclusivos do Synoire Glow.'

const THEME_PREVIEW_CLASS: Record<ImmersiveThemeId, string> = {
  firefly:
    'bg-gradient-to-br from-[#0b0f14] via-[#111820] to-[#0d1218]',
  rain: 'bg-gradient-to-br from-[#080c12] via-[#0e1520] to-[#0a1018]',
  forest: 'bg-gradient-to-br from-[#060a08] via-[#0e1810] to-[#0a120c]',
}

type RoomSoundscape = ReturnType<typeof useRoomSoundscape>

type ThemeSelectorModalProps = {
  open: boolean
  onClose: () => void
  selectedThemeId: ImmersiveThemeId
  onSelectTheme: (id: ImmersiveThemeId) => void
  sound: RoomSoundscape
  prefersReducedMotion: boolean
}

type TabId = 'ambientes' | 'musica'

export function ThemeSelectorModal({
  open,
  onClose,
  selectedThemeId,
  onSelectTheme,
  sound,
  prefersReducedMotion,
}: ThemeSelectorModalProps) {
  const { hasGlowAccess, openPaywall } = useUserPlan()
  const [activeTab, setActiveTab] = useState<TabId>('ambientes')
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)

  const triggerPaywall = useCallback(() => {
    onClose()
    openPaywall(GLOW_PAYWALL_MESSAGE)
  }, [onClose, openPaywall])

  const handleClose = useCallback(() => {
    setLinkError(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  const handleThemeClick = (id: ImmersiveThemeId, isPremium: boolean) => {
    if (isPremium && !hasGlowAccess) {
      triggerPaywall()
      return
    }
    onSelectTheme(id)
    handleClose()
  }

  const handleMusicInteraction = () => {
    if (!hasGlowAccess) {
      triggerPaywall()
      return false
    }
    return true
  }

  const handleLinkSubmit = async () => {
    if (!handleMusicInteraction()) return
    setLinkError(null)
    const result = await sound.setExternalEmbed(linkInput)
    if (!result.ok) {
      setLinkError(result.error)
      return
    }
    setLinkInput('')
    handleClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!handleMusicInteraction()) {
      e.target.value = ''
      return
    }
    const f = e.target.files?.[0]
    if (f) void sound.setCustomFile(f)
    e.target.value = ''
    handleClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="theme-selector-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 px-6 backdrop-blur-md"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="pointer-events-auto flex max-h-[min(90dvh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-firefly/20 bg-panel shadow-[0_0_24px_-4px_rgba(163,163,79,0.25)]"
            variants={staggerC}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-white/5 p-6 pb-4">
              <motion.h2
                id="theme-selector-title"
                variants={staggerItem}
                className="text-lg font-semibold text-primary"
              >
                Ambiente imersivo
              </motion.h2>
              <motion.p variants={staggerItem} className="mt-1 text-sm text-secondary">
                Visual e som da sua sala de estudo
              </motion.p>

              <motion.div
                variants={staggerItem}
                className="mt-4 flex gap-1 rounded-lg bg-night/60 p-1"
                role="tablist"
              >
                {(
                  [
                    ['ambientes', 'Ambientes'],
                    ['musica', 'Sua Música'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === id}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                      activeTab === id
                        ? 'bg-elevated text-primary'
                        : 'text-secondary hover:text-primary'
                    }`}
                    onClick={() => setActiveTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            </div>

            <motion.div
              variants={staggerItem}
              className="min-h-0 flex-1 overflow-y-auto p-6 pt-4"
            >
              {activeTab === 'ambientes' ? (
                <ul className="grid gap-3 sm:grid-cols-1">
                  {IMMERSIVE_THEMES.map((theme) => {
                    const locked = theme.isPremium && !hasGlowAccess
                    const selected = selectedThemeId === theme.id
                    return (
                      <li key={theme.id}>
                        <button
                          type="button"
                          className={`relative flex w-full items-center gap-4 overflow-hidden rounded-xl border p-3 text-left transition ${
                            selected
                              ? 'border-firefly/50 bg-firefly/5'
                              : 'border-white/10 hover:border-white/20 hover:bg-elevated/50'
                          }`}
                          onClick={() =>
                            handleThemeClick(theme.id, theme.isPremium)
                          }
                        >
                          <span
                            className={`h-14 w-20 shrink-0 rounded-lg ${THEME_PREVIEW_CLASS[theme.id]}`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-primary">
                                {theme.label}
                              </span>
                              {theme.isPremium && (
                                <span
                                  className="rounded bg-firefly px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-night"
                                >
                                  Glow
                                </span>
                              )}
                            </span>
                            {selected && (
                              <span className="mt-0.5 block text-xs text-aqua">
                                Selecionado
                              </span>
                            )}
                          </span>
                          {locked && (
                            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-night/40">
                              <LockIcon className="h-5 w-5 text-firefly/80" />
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <motion.div className="space-y-4">
                  <label className="block text-sm text-secondary">
                    Cole o link do Spotify ou YouTube
                    <input
                      type="url"
                      value={linkInput}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-lg border border-white/10 bg-night/60 px-3 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-firefly/40 focus:outline-none"
                      onFocus={() => {
                        if (!hasGlowAccess) triggerPaywall()
                      }}
                      onChange={(e) => {
                        if (!hasGlowAccess) return
                        setLinkInput(e.target.value)
                        setLinkError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleLinkSubmit()
                      }}
                    />
                  </label>
                  {linkError && (
                    <p className="text-xs text-red-400" role="alert">
                      {linkError}
                    </p>
                  )}
                  <button
                    type="button"
                    className="w-full rounded-lg border border-firefly/30 py-2.5 text-sm font-medium text-firefly transition hover:bg-firefly/10"
                    onClick={() => void handleLinkSubmit()}
                  >
                    Aplicar link
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="w-full rounded-xl border border-dashed border-border py-5 text-sm text-secondary transition hover:border-aqua/50 hover:bg-elevated"
                    onClick={() => {
                      if (!handleMusicInteraction()) return
                      fileInputRef.current?.click()
                    }}
                  >
                    [ Fazer upload de .mp3 ]
                  </button>
                  <p className="text-xs text-secondary">
                    O ficheiro não é enviado ao servidor — reprodução apenas no
                    seu navegador.
                  </p>
                  {sound.playbackMode === 'embed' && (
                    <p className="text-xs text-aqua">
                      Volume e pausa do link externo dependem do player
                      (YouTube/Spotify).
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="shrink-0 space-y-3 border-t border-white/5 p-6 pt-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-secondary">Volume</span>
                <button
                  type="button"
                  className="text-xs text-aqua hover:underline disabled:opacity-40"
                  disabled={
                    !sound.activeLabel || sound.playbackMode === 'embed'
                  }
                  onClick={() => sound.togglePause()}
                >
                  {sound.isPlaying ? 'Pausar' : 'Retomar'}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={sound.userVolume}
                disabled={sound.playbackMode === 'embed'}
                onChange={(e) =>
                  sound.setUserVolume(Number.parseFloat(e.target.value))
                }
                className="block w-full accent-firefly disabled:opacity-40"
              />
              {sound.activeLabel && (
                <p
                  className="truncate text-xs text-aqua"
                  title={sound.activeLabel}
                >
                  A tocar: {sound.activeLabel}
                </p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
