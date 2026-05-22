const STORAGE_KEY = 'synoire_presence_tab_id'

/** Stable per-tab id so Supabase presence keys do not collide across browser tabs. */
export function getPresenceTabId(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export function buildPresenceChannelKey(userId: string, tabId: string): string {
  return `${userId}:${tabId}`
}
