import { useCallback, useEffect, useRef, useState } from 'react'
import { parseMediaUrl, type ParsedMediaUrl } from '@/lib/roomMedia/parseMediaUrl'
import {
  readCustomMediaUrl,
  writeCustomMediaUrl,
} from '@/lib/roomMedia/storage'
import {
  getDefaultPlaylistTracks,
  getNextPlaylistTrack,
} from '@/lib/soundscapes/defaultPlaylist'

const VOLUME_KEY = 'synoire-room-sound-volume'
const FOCUS_CHIME_SRC = '/soundscapes/focus-chime.mp3'
const CHIME_VOLUME = 0.25

export type RoomPlaybackMode = 'library' | 'custom-file' | 'embed' | 'idle'

export type ExternalEmbed = ParsedMediaUrl

export type UseRoomSoundscapeOptions = {
  defaultPlaylistAutoplay?: boolean
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function readStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    if (raw == null) return 0.45
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? clamp(n, 0, 1) : 0.45
  } catch {
    return 0.45
  }
}

async function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  ms: number,
) {
  const t0 = performance.now()
  return new Promise<void>((resolve) => {
    function step(now: number) {
      const p = clamp((now - t0) / ms, 0, 1)
      audio.volume = from + (to - from) * p
      if (p < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

export function useRoomSoundscape(options?: UseRoomSoundscapeOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chimeRef = useRef<HTMLAudioElement | null>(null)
  const customUrlRef = useRef<string | null>(null)
  const lastAmbientRef = useRef<{ src: string; label: string } | null>(null)
  const defaultPlaylistAutoplayRef = useRef(
    options?.defaultPlaylistAutoplay ?? false,
  )
  const playbackModeRef = useRef<RoomPlaybackMode>('idle')
  const [userVolume, setUserVolume] = useState(readStoredVolume)
  const userVolRef = useRef(userVolume)
  userVolRef.current = userVolume
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [externalEmbed, setExternalEmbedState] = useState<ExternalEmbed | null>(
    null,
  )
  const [playbackMode, setPlaybackMode] = useState<RoomPlaybackMode>('idle')
  const busyRef = useRef(false)

  playbackModeRef.current = playbackMode

  useEffect(() => {
    defaultPlaylistAutoplayRef.current = options?.defaultPlaylistAutoplay ?? false
    const a = audioRef.current
    if (a && playbackMode === 'library') {
      a.loop = !defaultPlaylistAutoplayRef.current
    }
  }, [options?.defaultPlaylistAutoplay, playbackMode])

  const clearCustomBlob = useCallback(() => {
    if (customUrlRef.current) {
      URL.revokeObjectURL(customUrlRef.current)
      customUrlRef.current = null
    }
  }, [])

  const clearExternalEmbed = useCallback(() => {
    setExternalEmbedState(null)
    writeCustomMediaUrl(null)
  }, [])

  const advancePlaylistTrackRef = useRef<() => void>(() => {})

  const advancePlaylistTrack = useCallback(async () => {
    if (busyRef.current) return
    if (!defaultPlaylistAutoplayRef.current) return
    if (playbackModeRef.current !== 'library') return

    const current = lastAmbientRef.current
    if (!current) return

    const tracks = getDefaultPlaylistTracks(true)
    const next = getNextPlaylistTrack(current.src, tracks)
    if (!next) return

    const a = audioRef.current
    if (!a) return

    busyRef.current = true
    try {
      if (a.src && !a.paused) {
        await fadeVolume(a, a.volume, 0, 240)
        a.pause()
      }
      a.loop = false
      a.src = next.file
      a.volume = 0
      await a.play()
      setActiveLabel(next.label)
      lastAmbientRef.current = { src: next.file, label: next.label }
      await fadeVolume(a, 0, userVolRef.current, 380)
    } catch {
      /* autoplay blocked or missing asset */
    }
    busyRef.current = false
  }, [])

  advancePlaylistTrackRef.current = () => {
    void advancePlaylistTrack()
  }

  const onAudioEnded = useCallback(() => {
    advancePlaylistTrackRef.current()
  }, [])

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio()
      a.loop = true
      a.preload = 'auto'
      a.addEventListener('ended', onAudioEnded)
      audioRef.current = a
      a.addEventListener('play', () => setIsPlaying(true))
      a.addEventListener('pause', () => setIsPlaying(false))
    }
    return audioRef.current
  }, [onAudioEnded])

  useEffect(() => {
    try {
      localStorage.setItem(VOLUME_KEY, String(userVolume))
    } catch {
      /* ignore */
    }
    const a = audioRef.current
    if (a && !busyRef.current && playbackMode !== 'embed') {
      a.volume = userVolume
    }
  }, [userVolume, playbackMode])

  const stopInternal = useCallback(async () => {
    const a = audioRef.current
    if (!a) return
    busyRef.current = true
    const v = a.volume
    await fadeVolume(a, v, 0, 220)
    a.pause()
    a.removeAttribute('src')
    a.load()
    busyRef.current = false
    setIsPlaying(false)
  }, [])

  const playSource = useCallback(
    async (src: string, label: string) => {
      clearExternalEmbed()
      const a = ensureAudio()
      busyRef.current = true
      if (a.src && !a.paused) {
        await fadeVolume(a, a.volume, 0, 240)
        a.pause()
      }
      a.loop = !defaultPlaylistAutoplayRef.current
      a.src = src
      a.volume = 0
      try {
        await a.play()
        setActiveLabel(label)
        lastAmbientRef.current = { src, label }
        setPlaybackMode('library')
        await fadeVolume(a, 0, userVolRef.current, 380)
      } catch {
        setActiveLabel(null)
        lastAmbientRef.current = null
        setPlaybackMode('idle')
      }
      busyRef.current = false
    },
    [clearExternalEmbed, ensureAudio],
  )

  const setCustomFile = useCallback(
    async (file: File | null) => {
      clearExternalEmbed()
      clearCustomBlob()
      if (!file) {
        await stopInternal()
        setActiveLabel(null)
        lastAmbientRef.current = null
        setPlaybackMode('idle')
        return
      }
      const url = URL.createObjectURL(file)
      customUrlRef.current = url
      const a = ensureAudio()
      busyRef.current = true
      if (a.src && !a.paused) {
        await fadeVolume(a, a.volume, 0, 240)
        a.pause()
      }
      a.loop = true
      a.src = url
      a.volume = 0
      try {
        await a.play()
        const label = file.name.replace(/\.[^/.]+$/, '')
        setActiveLabel(label)
        lastAmbientRef.current = { src: url, label }
        setPlaybackMode('custom-file')
        await fadeVolume(a, 0, userVolRef.current, 380)
      } catch {
        setActiveLabel(null)
        lastAmbientRef.current = null
        setPlaybackMode('idle')
      }
      busyRef.current = false
    },
    [clearCustomBlob, clearExternalEmbed, ensureAudio, stopInternal],
  )

  const playLibraryTrack = useCallback(
    async (src: string, label: string) => {
      clearCustomBlob()
      await playSource(src, label)
    },
    [clearCustomBlob, playSource],
  )

  const setExternalEmbed = useCallback(
    async (rawUrl: string | null) => {
      clearCustomBlob()
      await stopInternal()

      if (!rawUrl?.trim()) {
        clearExternalEmbed()
        setActiveLabel(null)
        lastAmbientRef.current = null
        setPlaybackMode('idle')
        return { ok: false as const, error: 'Informe um link válido.' }
      }

      const parsed = parseMediaUrl(rawUrl)
      if (!parsed) {
        return {
          ok: false as const,
          error: 'Link não reconhecido. Use YouTube ou Spotify.',
        }
      }

      setExternalEmbedState(parsed)
      writeCustomMediaUrl(rawUrl.trim())
      setActiveLabel(parsed.label)
      lastAmbientRef.current = null
      setPlaybackMode('embed')
      setIsPlaying(true)
      return { ok: true as const }
    },
    [clearCustomBlob, clearExternalEmbed, stopInternal],
  )

  const restoreCustomMediaUrl = useCallback(
    async (rawUrl: string) => {
      return setExternalEmbed(rawUrl)
    },
    [setExternalEmbed],
  )

  const togglePause = useCallback(() => {
    if (playbackMode === 'embed') {
      setIsPlaying((p) => !p)
      return
    }
    const a = audioRef.current
    if (!a?.src) return
    if (a.paused) void a.play()
    else a.pause()
  }, [playbackMode])

  const playFocusChime = useCallback(async () => {
    if (!chimeRef.current) {
      const c = new Audio(FOCUS_CHIME_SRC)
      c.preload = 'auto'
      chimeRef.current = c
    }
    const chime = chimeRef.current
    chime.volume = 0
    chime.currentTime = 0
    try {
      await chime.play()
      await fadeVolume(chime, 0, CHIME_VOLUME, 300)
    } catch {
      /* autoplay blocked or missing asset */
    }

    if (playbackMode === 'embed') return

    const ambient = lastAmbientRef.current
    const a = audioRef.current
    if (ambient && a?.src) {
      if (a.paused) {
        a.volume = 0
        try {
          await a.play()
          await fadeVolume(a, 0, userVolRef.current, 380)
        } catch {
          /* ignore */
        }
      } else if (!busyRef.current) {
        await fadeVolume(a, a.volume, userVolRef.current, 380)
      }
    }
  }, [playbackMode])

  useEffect(() => {
    return () => {
      const a = audioRef.current
      if (a) a.removeEventListener('ended', onAudioEnded)
      void stopInternal()
      clearCustomBlob()
      chimeRef.current = null
      audioRef.current = null
    }
  }, [clearCustomBlob, onAudioEnded, stopInternal])

  return {
    userVolume,
    setUserVolume,
    activeLabel,
    isPlaying,
    playbackMode,
    externalEmbed,
    playLibraryTrack,
    setCustomFile,
    setExternalEmbed,
    restoreCustomMediaUrl,
    readStoredCustomMediaUrl: readCustomMediaUrl,
    togglePause,
    playFocusChime,
    stop: stopInternal,
  }
}
