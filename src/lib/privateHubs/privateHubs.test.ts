import { describe, expect, it } from 'vitest'
import { buildPrivateHub } from './buildPrivateHub'
import { validatePrivateHubName } from './validatePrivateHubName'

describe('validatePrivateHubName', () => {
  it('rejects empty name', () => {
    expect(validatePrivateHubName('   ')).toEqual({
      ok: false,
      error: 'Informe o nome do hub.',
    })
  })

  it('rejects name shorter than minimum', () => {
    expect(validatePrivateHubName('ab')).toEqual({
      ok: false,
      error: 'Mínimo de 3 caracteres.',
    })
  })

  it('accepts valid trimmed name', () => {
    expect(validatePrivateHubName('  Mentoria PF  ')).toEqual({
      ok: true,
      value: 'Mentoria PF',
    })
  })
})

describe('buildPrivateHub', () => {
  it('creates private hub with firefly styling and unique slug', () => {
    const hub = buildPrivateHub('Mentoria Polícia Federal', '📚', ['privado-mentoria-policia-federal'])
    expect(hub.isPrivate).toBe(true)
    expect(hub.shortLabel).toBe('Privado')
    expect(hub.iconEmoji).toBe('📚')
    expect(hub.slug).toBe('privado-mentoria-policia-federal-1')
    expect(hub.accentStripe).toContain('firefly')
  })

  it('slugifies accented characters', () => {
    const hub = buildPrivateHub('São Paulo', undefined, [])
    expect(hub.slug).toMatch(/^privado-sao-paulo/)
  })
})
