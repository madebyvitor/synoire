export function validateUsername(username: string): string | null {
  const trimmed = username.trim()
  if (trimmed.length < 2 || trimmed.length > 32) {
    return 'Nome de usuário deve ter entre 2 e 32 caracteres.'
  }
  return null
}
