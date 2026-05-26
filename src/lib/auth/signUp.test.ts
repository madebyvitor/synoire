import { AuthError } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signUp } from './signUp'

const signUpMock = vi.fn()
const updateMock = vi.fn()
const eqMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: { signUp: signUpMock },
    from: () => ({
      update: updateMock.mockReturnValue({ eq: eqMock }),
    }),
  }),
}))

describe('signUp', () => {
  beforeEach(() => {
    signUpMock.mockReset()
    updateMock.mockReset()
    eqMock.mockReset()
    eqMock.mockResolvedValue({ error: null })
  })

  it('returns needsEmailConfirmation when no session', async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: 'u1' }, session: null },
      error: null,
    })
    const result = await signUp({
      email: 'a@b.com',
      password: '12345678',
      username: 'vitor',
    })
    expect(result).toEqual({ ok: true, needsEmailConfirmation: true })
  })

  it('signs up with username metadata only when session exists', async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    })
    const result = await signUp({
      email: 'a@b.com',
      password: '12345678',
      username: 'vitor',
    })
    expect(result).toEqual({ ok: true, needsEmailConfirmation: false })
    expect(signUpMock).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: '12345678',
      options: {
        data: {
          username: 'vitor',
        },
      },
    })
    expect(updateMock).not.toHaveBeenCalled()
    expect(eqMock).not.toHaveBeenCalled()
  })

  it('maps auth errors', async () => {
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthError('User already registered', 400, 'user_already_exists'),
    })
    const result = await signUp({
      email: 'a@b.com',
      password: '12345678',
      username: 'vitor',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('E-mail já cadastrado.')
    }
  })
})
