import {
  DEFAULT_SOUNDSCAPES,
  type DefaultSoundscape,
} from '@/data/defaultSoundscapes'
import { getImmersiveTheme, type ImmersiveThemeId } from '@/lib/immersiveThemes'

export function getDefaultPlaylistTracks(
  hasGlowAccess: boolean,
): DefaultSoundscape[] {
  return DEFAULT_SOUNDSCAPES.filter((t) => !t.isPremium || hasGlowAccess)
}

export function findPlaylistIndexByFile(
  file: string,
  tracks: DefaultSoundscape[],
): number {
  return tracks.findIndex((t) => t.file === file)
}

export function getNextPlaylistTrack(
  currentFile: string,
  tracks: DefaultSoundscape[],
): DefaultSoundscape | null {
  if (tracks.length === 0) return null
  const idx = findPlaylistIndexByFile(currentFile, tracks)
  const nextIdx = idx >= 0 ? (idx + 1) % tracks.length : 0
  return tracks[nextIdx] ?? null
}

export function findPlaylistIndexByThemeId(
  themeId: ImmersiveThemeId,
  tracks: DefaultSoundscape[],
): number {
  const theme = getImmersiveTheme(themeId)
  if (!theme) return 0
  const idx = findPlaylistIndexByFile(theme.audioFile, tracks)
  return idx >= 0 ? idx : 0
}
