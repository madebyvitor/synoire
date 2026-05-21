import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getProfile,
  updateProfile,
  type ProfileView,
  type UpdateProfileInput,
} from '@/lib/profile'

export function useProfile() {
  const { user, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ProfileView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (authLoading) return

      const userId = user?.id
      if (!userId) {
        if (!cancelled) {
          setProfile(null)
          setError(null)
          setIsLoading(false)
        }
        return
      }

      if (!cancelled) {
        setIsLoading(true)
        setError(null)
      }

      const result = await getProfile(userId)
      if (cancelled) return

      if (result.ok) {
        setProfile(result.profile)
        setError(null)
      } else {
        setProfile(null)
        setError(result.message)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id, authLoading])

  const updateProfileState = useCallback(
    async (input: UpdateProfileInput): Promise<{ ok: true } | { ok: false; message: string }> => {
      const userId = user?.id
      if (!userId) {
        return { ok: false, message: 'Entre na sua conta para atualizar o perfil.' }
      }

      setIsSaving(true)
      const result = await updateProfile(userId, input)
      setIsSaving(false)

      if (result.ok) {
        setProfile(result.profile)
        setError(null)
        return { ok: true }
      }
      return { ok: false, message: result.message }
    },
    [user?.id],
  )

  return {
    profile,
    isLoading: authLoading || isLoading,
    error,
    isSaving,
    updateProfile: updateProfileState,
  }
}
