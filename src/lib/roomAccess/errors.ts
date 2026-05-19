export function isDuplicateRoomAccessError(error: {
  message?: string
  code?: string
}): boolean {
  const code = error.code ?? ''
  const lower = (error.message ?? '').toLowerCase()
  return (
    code === '23505' ||
    lower.includes('duplicate') ||
    lower.includes('unique constraint')
  )
}
