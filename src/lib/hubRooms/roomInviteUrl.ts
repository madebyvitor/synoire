export function buildRoomInviteUrl(roomId: string, origin = window.location.origin): string {
  return `${origin}/salas/${encodeURIComponent(roomId)}`
}

export async function copyRoomInviteUrl(roomId: string): Promise<boolean> {
  const url = buildRoomInviteUrl(roomId)
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      // fall through to legacy copy
    }
  }
  return copyTextLegacy(url)
}

function copyTextLegacy(text: string): boolean {
  if (typeof document === 'undefined') return false
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}
