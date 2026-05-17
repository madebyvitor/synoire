import { useCallback, useEffect, useRef, useState } from 'react'

const VOLUME_KEY = 'synoire-room-sound-volume'
const FOCUS_CHIME_SRC = '/soundscapes/focus-chime.mp3'
const CHIME_VOLUME = 0.25

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

export function useRoomSoundscape() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chimeRef = useRef<HTMLAudioElement | null>(null)
  const customUrlRef = useRef<string | null>(null)
  const lastAmbientRef = useRef<{ src: string; label: string } | null>(null)
  const [userVolume, setUserVolume] = useState(readStoredVolume)
  const userVolRef = useRef(userVolume)
  userVolRef.current = userVolume
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const busyRef = useRef(false)

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio()
      a.loop = true
      a.preload = 'auto'
      audioRef.current = a
      a.addEventListener('play', () => setIsPlaying(true))
      a.addEventListener('pause', () => setIsPlaying(false))
    }
    return audioRef.current
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(VOLUME_KEY, String(userVolume))
    } catch {
      /* ignore */
    }
    const a = audioRef.current
    if (a && !busyRef.current) a.volume = userVolume
  }, [userVolume])

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
      const a = ensureAudio()
      busyRef.current = true
      if (a.src && !a.paused) {
        await fadeVolume(a, a.volume, 0, 240)
        a.pause()
      }
      a.src = src
      a.volume = 0
      try {
        await a.play()
        setActiveLabel(label)
        lastAmbientRef.current = { src, label }
        await fadeVolume(a, 0, userVolRef.current, 380)
      } catch {
        setActiveLabel(null)
        lastAmbientRef.current = null
      }
      busyRef.current = false
    },
    [ensureAudio],
  )

  const setCustomFile = useCallback(
    async (file: File | null) => {
      if (customUrlRef.current) {
        URL.revokeObjectURL(customUrlRef.current)
        customUrlRef.current = null
      }
      if (!file) {
        await stopInternal()
        setActiveLabel(null)
        lastAmbientRef.current = null
        return
      }
      const url = URL.createObjectURL(file)
      customUrlRef.current = url
      await playSource(url, file.name.replace(/\.[^/.]+$/, ''))
    },
    [playSource, stopInternal],
  )

  const playLibraryTrack = useCallback(
    async (src: string, label: string) => {
      await setCustomFile(null)
      await playSource(src, label)
    },
    [playSource, setCustomFile],
  )

  const togglePause = useCallback(() => {
    const a = audioRef.current
    if (!a?.src) return
    if (a.paused) void a.play()
    else a.pause()
  }, [])

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
  }, [])

  useEffect(() => {
    return () => {
      void stopInternal()
      if (customUrlRef.current) {
        URL.revokeObjectURL(customUrlRef.current)
        customUrlRef.current = null
      }
      chimeRef.current = null
      audioRef.current = null
    }
  }, [stopInternal])

  return {
    userVolume,
    setUserVolume,
    activeLabel,
    isPlaying,
    playLibraryTrack,
    setCustomFile,
    togglePause,
    playFocusChime,
    stop: stopInternal,
  }
}
