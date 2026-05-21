import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProfile } from './getProfile'
import { updateProfile } from './updateProfile'
import { updateProfileFocus } from './updateProfileFocus'

const maybeSingleMock = vi.fn()
const singleMock = vi.fn()
const eqGetMock = vi.fn()
const eqUpdateMock = vi.fn()
const selectMock = vi.fn()
const updateMock = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({
    from: fromMock,
  }),
}))

describe('getProfile', () => {
  beforeEach(() => {
    maybeSingleMock.mockReset()
    eqGetMock.mockReset()
    fromMock.mockReset()
    fromMock.mockReturnValue({
      select: () => ({
        eq: eqGetMock.mockReturnValue({ maybeSingle: maybeSingleMock }),
      }),
    })
  })

  it('returns profile on success', async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        id: 'u1',
        username: 'vitor',
        avatar_url: null,
        target_exam: 'policia-federal',
        bio: 'Estudando 4h por dia.',
      },
      error: null,
    })
    const result = await getProfile('u1')
    expect(result).toEqual({
      ok: true,
      profile: {
        displayName: 'vitor',
        targetExam: 'policia-federal',
        bio: 'Estudando 4h por dia.',
        avatarUrl: null,
      },
    })
    expect(eqGetMock).toHaveBeenCalledWith('id', 'u1')
  })

  it('returns message when profile missing', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null })
    const result = await getProfile('u1')
    expect(result).toEqual({ ok: false, message: 'Perfil não encontrado.' })
  })

  it('maps query errors', async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: 'JWT expired' },
    })
    const result = await getProfile('u1')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('Entre na sua conta para ver o perfil.')
    }
  })
})

describe('updateProfileFocus', () => {
  beforeEach(() => {
    singleMock.mockReset()
    eqUpdateMock.mockReset()
    selectMock.mockReset()
    updateMock.mockReset()
    fromMock.mockReset()
    selectMock.mockReturnValue({ single: singleMock })
    eqUpdateMock.mockReturnValue({ select: selectMock })
    updateMock.mockReturnValue({ eq: eqUpdateMock })
    fromMock.mockReturnValue({ update: updateMock })
  })

  it('validates empty target exam', async () => {
    const result = await updateProfileFocus('u1', { targetExam: '  ', bio: '' })
    expect(result).toEqual({ ok: false, message: 'Informe o concurso-alvo.' })
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns updated profile on success', async () => {
    singleMock.mockResolvedValue({
      data: {
        id: 'u1',
        username: 'vitor',
        avatar_url: null,
        target_exam: 'policia-federal',
        bio: 'Rumo à aprovação!',
      },
      error: null,
    })
    const result = await updateProfileFocus('u1', {
      targetExam: 'policia-federal',
      bio: 'Rumo à aprovação!',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile.targetExam).toBe('policia-federal')
      expect(result.profile.bio).toBe('Rumo à aprovação!')
    }
    expect(updateMock).toHaveBeenCalledWith({
      target_exam: 'policia-federal',
      bio: 'Rumo à aprovação!',
    })
    expect(eqUpdateMock).toHaveBeenCalledWith('id', 'u1')
  })

  it('maps blocked update (RLS / no row)', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' },
    })
    const result = await updateProfileFocus('u1', {
      targetExam: 'bb',
      bio: 'Bio',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('Não foi possível atualizar o perfil.')
    }
  })
})

describe('updateProfile', () => {
  beforeEach(() => {
    singleMock.mockReset()
    eqUpdateMock.mockReset()
    selectMock.mockReset()
    updateMock.mockReset()
    fromMock.mockReset()
    selectMock.mockReturnValue({ single: singleMock })
    eqUpdateMock.mockReturnValue({ select: selectMock })
    updateMock.mockReturnValue({ eq: eqUpdateMock })
    fromMock.mockReturnValue({ update: updateMock })
  })

  it('validates short username', async () => {
    const result = await updateProfile('u1', {
      username: 'a',
      targetExam: 'bb',
      bio: '',
    })
    expect(result).toEqual({
      ok: false,
      message: 'Nome de usuário deve ter entre 2 e 32 caracteres.',
    })
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns updated profile on success', async () => {
    singleMock.mockResolvedValue({
      data: {
        id: 'u1',
        username: 'novo_user',
        avatar_url: null,
        target_exam: 'policia-federal',
        bio: 'Bio atualizada',
      },
      error: null,
    })
    const result = await updateProfile('u1', {
      username: 'novo_user',
      targetExam: 'policia-federal',
      bio: 'Bio atualizada',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile.displayName).toBe('novo_user')
      expect(result.profile.targetExam).toBe('policia-federal')
      expect(result.profile.bio).toBe('Bio atualizada')
    }
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'novo_user',
        target_exam: 'policia-federal',
        bio: 'Bio atualizada',
        updated_at: expect.any(String),
      }),
    )
    expect(eqUpdateMock).toHaveBeenCalledWith('id', 'u1')
  })

  it('maps supabase errors', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { message: 'JWT expired' },
    })
    const result = await updateProfile('u1', {
      username: 'vitor',
      targetExam: 'bb',
      bio: '',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('Entre na sua conta para atualizar o perfil.')
    }
  })
})
