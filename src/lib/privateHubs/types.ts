export const PRIVATE_HUB_NAME_MIN = 3
export const PRIVATE_HUB_NAME_MAX = 60

export const PRIVATE_HUB_ICON_OPTIONS = ['📚', '🎯', '⚖️', '🔒', '👥'] as const

export type PrivateHubIcon = (typeof PRIVATE_HUB_ICON_OPTIONS)[number]

export const PRIVATE_HUBS_STORAGE_KEY = 'synoire_private_hubs'
