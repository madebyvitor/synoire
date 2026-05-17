import { JOINED_HUBS_STORAGE_KEY } from './types'

export function readJoinedHubSlugs(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(JOINED_HUBS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === 'string' && s.length > 0)
  } catch {
    return []
  }
}

export function writeJoinedHubSlugs(slugs: string[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(JOINED_HUBS_STORAGE_KEY, JSON.stringify(slugs))
  } catch {
    // quota or private mode
  }
}

export function isHubJoined(slug: string, joinedSlugs: string[]): boolean {
  return joinedSlugs.includes(slug)
}
