import { describe, expect, it } from 'vitest'
import { REQUEST_NAME_MAX } from './types'
import { validateRequestName } from './validateRequestName'

describe('validateRequestName', () => {
  it('rejects empty or whitespace-only names', () => {
    expect(validateRequestName('')).toEqual({
      ok: false,
      error: 'Informe o nome do concurso.',
    })
    expect(validateRequestName('   ')).toEqual({
      ok: false,
      error: 'Informe o nome do concurso.',
    })
  })

  it('rejects names shorter than minimum after trim', () => {
    expect(validateRequestName('A')).toEqual({
      ok: false,
      error: 'Mínimo de 2 caracteres.',
    })
  })

  it('rejects names longer than maximum', () => {
    const long = 'x'.repeat(REQUEST_NAME_MAX + 1)
    expect(validateRequestName(long)).toEqual({
      ok: false,
      error: `Máximo de ${REQUEST_NAME_MAX} caracteres.`,
    })
  })

  it('accepts valid trimmed names', () => {
    expect(validateRequestName('  Tribunal de Justiça de SP  ')).toEqual({
      ok: true,
      value: 'Tribunal de Justiça de SP',
    })
  })
})
