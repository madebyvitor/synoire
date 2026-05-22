import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_BIO_LENGTH, uploadAvatar } from '@/lib/profile'
import {
  validateWeeklyGoalHours,
  WEEKLY_GOAL_HOURS_MAX,
  WEEKLY_GOAL_HOURS_MIN,
} from '@/lib/userStats'
import {
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-primary placeholder:text-secondary/60 focus:border-firefly/40 focus:outline-none focus:ring-1 focus:ring-firefly/30'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
const FILE_ACCEPT = 'image/png,image/jpeg,image/webp,image/jpg'

function initialsFromName(name: string): string {
  if (!name.trim()) return 'US'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const a = parts[0][0]
  const b = parts[parts.length - 1][0]
  return `${a}${b}`.toUpperCase()
}

export type EditProfileFormValues = {
  username: string
  targetExam: string
  bio: string
  weeklyGoalHours: string
}

export type EditProfileSavePayload = {
  username: string
  targetExam: string
  bio: string
  weeklyGoalHours: number
  avatarUrl?: string
}

type EditProfileModalProps = {
  open: boolean
  onClose: () => void
  prefersReducedMotion: boolean
  initialValues: EditProfileFormValues
  userId: string
  initialAvatarUrl: string | null
  displayName: string
  onToast: (message: string) => void
  onSave: (
    payload: EditProfileSavePayload,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  isSubmitting?: boolean
}

export function EditProfileModal({
  open,
  onClose,
  prefersReducedMotion,
  initialValues,
  userId,
  initialAvatarUrl,
  displayName,
  onToast,
  onSave,
  isSubmitting = false,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(initialValues.username)
  const [targetExam, setTargetExam] = useState(initialValues.targetExam)
  const [bio, setBio] = useState(initialValues.bio)
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(initialValues.weeklyGoalHours)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const objectUrlRef = useRef<string | null>(null)

  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)
  const isBusy = isSubmitting || isUploading

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setUsername(initialValues.username)
    setTargetExam(initialValues.targetExam)
    setBio(initialValues.bio)
    setWeeklyGoalHours(initialValues.weeklyGoalHours)
    setError(null)
    setSelectedFile(null)
    setFileInputKey((k) => k + 1)
    revokeObjectUrl()
    setPreviewUrl(initialAvatarUrl)
  }, [open, initialValues, initialAvatarUrl, revokeObjectUrl])

  useEffect(() => {
    return () => revokeObjectUrl()
  }, [revokeObjectUrl])

  const handleClose = useCallback(() => {
    setError(null)
    onClose()
  }, [onClose])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > MAX_AVATAR_BYTES) {
        onToast('A imagem deve ter no máximo 2MB.')
        setSelectedFile(null)
        revokeObjectUrl()
        setPreviewUrl(initialAvatarUrl)
        setFileInputKey((k) => k + 1)
        return
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        onToast('Use uma imagem PNG, JPEG ou WebP.')
        setSelectedFile(null)
        revokeObjectUrl()
        setPreviewUrl(initialAvatarUrl)
        setFileInputKey((k) => k + 1)
        return
      }

      revokeObjectUrl()
      const url = URL.createObjectURL(file)
      objectUrlRef.current = url
      setPreviewUrl(url)
      setSelectedFile(file)
      setError(null)
    },
    [initialAvatarUrl, onToast, revokeObjectUrl],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const hours = Number.parseFloat(weeklyGoalHours.replace(',', '.'))
      const validationError = validateWeeklyGoalHours(hours)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)

      let avatarUrl: string | undefined
      if (selectedFile) {
        setIsUploading(true)
        const uploadResult = await uploadAvatar(userId, selectedFile)
        setIsUploading(false)
        if (!uploadResult.ok) {
          setError(uploadResult.message)
          return
        }
        avatarUrl = uploadResult.publicUrl
      }

      const result = await onSave({
        username,
        targetExam,
        bio,
        weeklyGoalHours: hours,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      })
      if (!result.ok) {
        setError(result.message)
      }
    },
    [username, targetExam, bio, weeklyGoalHours, selectedFile, userId, onSave],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isBusy, handleClose])

  const avatarInitials = initialsFromName(displayName || username)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-night/80 px-6 backdrop-blur-sm"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={isBusy ? undefined : handleClose}
        >
          <motion.div
            className="pointer-events-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-panel p-6 shadow-xl"
            variants={staggerC}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={(e) => void handleSubmit(e)}>
              <motion.h2
                id="edit-profile-title"
                variants={staggerItem}
                className="text-lg font-semibold text-primary"
              >
                Editar perfil
              </motion.h2>
              <motion.p variants={staggerItem} className="mt-2 text-sm text-secondary">
                Atualize sua foto, nome, concurso-alvo, bio e meta semanal.
              </motion.p>

              <motion.div variants={staggerItem} className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-night/80">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-secondary">
                      {avatarInitials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-secondary">Foto de perfil</p>
                  <p className="mt-0.5 text-xs text-secondary/70">
                    PNG, JPEG ou WebP — máx. 2MB (opcional)
                  </p>
                  <label className="mt-2 inline-block cursor-pointer rounded-xl border border-white/10 bg-night/60 px-3 py-1.5 text-xs font-medium text-primary transition hover:border-firefly/40 hover:bg-elevated has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                    Escolher imagem
                    <input
                      key={fileInputKey}
                      type="file"
                      accept={FILE_ACCEPT}
                      onChange={handleFileChange}
                      disabled={isBusy}
                      className="sr-only"
                    />
                  </label>
                </div>
              </motion.div>

              <motion.label variants={staggerItem} className="mt-5 block text-sm text-secondary">
                Nome de usuário
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError(null)
                  }}
                  placeholder="seu_usuario"
                  autoComplete="username"
                  className={inputClass}
                  disabled={isBusy}
                />
              </motion.label>

              <motion.label variants={staggerItem} className="mt-4 block text-sm text-secondary">
                Concurso-alvo
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => {
                    setTargetExam(e.target.value)
                    setError(null)
                  }}
                  placeholder="policia-federal"
                  autoComplete="off"
                  className={inputClass}
                  disabled={isBusy}
                />
              </motion.label>

              <motion.label variants={staggerItem} className="mt-4 block text-sm text-secondary">
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    setError(null)
                  }}
                  placeholder="Estudando 4h por dia. Rumo à aprovação!"
                  rows={4}
                  maxLength={MAX_BIO_LENGTH}
                  className={`${inputClass} resize-y`}
                  disabled={isBusy}
                />
              </motion.label>

              <motion.label variants={staggerItem} className="mt-4 block text-sm text-secondary">
                Meta semanal (horas)
                <input
                  type="number"
                  min={WEEKLY_GOAL_HOURS_MIN}
                  max={WEEKLY_GOAL_HOURS_MAX}
                  step={0.5}
                  value={weeklyGoalHours}
                  onChange={(e) => {
                    setWeeklyGoalHours(e.target.value)
                    setError(null)
                  }}
                  placeholder="20"
                  className={inputClass}
                  disabled={isBusy}
                />
              </motion.label>

              {error && (
                <motion.p variants={staggerItem} className="mt-3 text-sm text-coral" role="alert">
                  {error}
                </motion.p>
              )}

              <motion.div variants={staggerItem} className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isBusy}
                  className="rounded-xl px-4 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  aria-busy={isBusy}
                  className="rounded-xl border border-firefly/30 bg-firefly/10 px-4 py-2 text-sm font-medium text-firefly transition hover:border-firefly/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading
                    ? 'Salvando imagem...'
                    : isSubmitting
                      ? 'Salvando…'
                      : 'Salvar alterações'}
                </button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
