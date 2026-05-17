import { PRIVATE_HUB_NAME_MAX, PRIVATE_HUB_NAME_MIN } from './types'

export function validatePrivateHubName(
  name: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const value = name.trim()
  if (!value) {
    return { ok: false, error: 'Informe o nome do hub.' }
  }
  if (value.length < PRIVATE_HUB_NAME_MIN) {
    return { ok: false, error: `Mínimo de ${PRIVATE_HUB_NAME_MIN} caracteres.` }
  }
  if (value.length > PRIVATE_HUB_NAME_MAX) {
    return { ok: false, error: `Máximo de ${PRIVATE_HUB_NAME_MAX} caracteres.` }
  }
  return { ok: true, value }
}
