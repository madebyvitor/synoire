import { describe, expect, it } from 'vitest'
import {
  findPlaylistIndexByFile,
  findPlaylistIndexByThemeId,
  getDefaultPlaylistTracks,
  getNextPlaylistTrack,
} from './defaultPlaylist'

describe('getDefaultPlaylistTracks', () => {
  it('returns only free track for non-Glow users', () => {
    const tracks = getDefaultPlaylistTracks(false)
    expect(tracks).toHaveLength(1)
    expect(tracks[0]?.id).toBe('aurora-stillness')
  })

  it('returns all default tracks for Glow users', () => {
    const tracks = getDefaultPlaylistTracks(true)
    expect(tracks).toHaveLength(3)
  })
})

describe('getNextPlaylistTrack', () => {
  const tracks = getDefaultPlaylistTracks(true)

  it('advances circularly through the playlist', () => {
    const first = tracks[0]!
    const second = getNextPlaylistTrack(first.file, tracks)
    expect(second?.id).toBe(tracks[1]?.id)

    const last = tracks[tracks.length - 1]!
    const wrapped = getNextPlaylistTrack(last.file, tracks)
    expect(wrapped?.id).toBe(first.id)
  })

  it('starts at first track when current file is unknown', () => {
    const next = getNextPlaylistTrack('/unknown.mp3', tracks)
    expect(next?.id).toBe(tracks[0]?.id)
  })
})

describe('findPlaylistIndexByFile', () => {
  it('returns -1 when file is not in playlist', () => {
    const tracks = getDefaultPlaylistTracks(true)
    expect(findPlaylistIndexByFile('/missing.mp3', tracks)).toBe(-1)
  })
})

describe('findPlaylistIndexByThemeId', () => {
  const tracks = getDefaultPlaylistTracks(true)

  it('maps firefly theme to aurora stillness', () => {
    expect(findPlaylistIndexByThemeId('firefly', tracks)).toBe(0)
  })

  it('maps forest theme to firefly study grove', () => {
    expect(findPlaylistIndexByThemeId('forest', tracks)).toBe(1)
  })

  it('maps rain theme to rain at glass night', () => {
    expect(findPlaylistIndexByThemeId('rain', tracks)).toBe(2)
  })
})
