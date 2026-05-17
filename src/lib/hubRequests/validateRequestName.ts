import { REQUEST_NAME_MAX, REQUEST_NAME_MIN } from './types'

export function validateRequestName(
  name: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const value = name.trim()
  if (!value) {
    return { ok: false, error: 'Informe o nome do concurso.' }
  }
  if (value.length < REQUEST_NAME_MIN) {
    return { ok: false, error: `Mínimo de ${REQUEST_NAME_MIN} caracteres.` }
  }
  if (value.length > REQUEST_NAME_MAX) {
    return { ok: false, error: `Máximo de ${REQUEST_NAME_MAX} caracteres.` }
  }
  return { ok: true, value }
}
