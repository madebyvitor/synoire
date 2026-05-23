import { AuthError } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signInWithGoogle } from './signInWithGoogle'

const signInWithOAuthMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: { signInWithOAuth: signInWithOAuthMock },
  }),
}))

describe('signInWithGoogle', () => {
  beforeEach(() => {
    signInWithOAuthMock.mockReset()
    vi.stubGlobal('location', { origin: 'http://localhost:5173' })
  })

  it('calls signInWithOAuth with google and redirectTo /painel', async () => {
    signInWithOAuthMock.mockResolvedValue({ error: null })
    const result = await signInWithGoogle()
    expect(result).toEqual({ ok: true })
    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:5173/painel' },
    })
  })

  it('maps errors', async () => {
    signInWithOAuthMock.mockResolvedValue({
      error: new AuthError('OAuth failed', 400, 'unexpected_failure'),
    })
    const result = await signInWithGoogle()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBeTruthy()
    }
  })
})
