import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { isDemoMode } from '@/lib/studySessions/demo'
import { mapStudySessionRow } from '@/lib/studySessions/mapStudySessionRow'
import type { StudySessionRow, StudySessionView } from '@/lib/studySessions/types'
import { recordDemoStudyTime } from './demoStats'
import type { UserStatsResult } from './types'

function mapRpcError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Entre na sua conta para registrar a sessão.'
  }
  if (lower.includes('room not found')) {
    return 'Sala não encontrada.'
  }
  return 'Não foi possível registrar o tempo de estudo. Tente novamente.'
}

export type RecordStudyTimeResult = UserStatsResult<{ sessionId: string }>

let recordStudyTimeQueue: Promise<unknown> = Promise.resolve()

function enqueueRecordStudyTime<T>(task: () => Promise<T>): Promise<T> {
  const next = recordStudyTimeQueue.then(task, task)
  recordStudyTimeQueue = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}

async function invokeRecordStudyTime(
  userId: string,
  roomId: string,
  durationMinutes: number,
): Promise<RecordStudyTimeResult> {
  if (durationMinutes < 1) {
    return { ok: false, message: 'Duração inválida.' }
  }

  if (isDemoMode) {
    const { session } = recordDemoStudyTime(userId, { roomId, durationMinutes })
    return { ok: true, data: { sessionId: session.id } }
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data: sessionId, error } = await supabase.rpc('record_study_time', {
    p_room_id: roomId,
    p_duration_minutes: durationMinutes,
  })

  if (error) {
    if (import.meta.env.DEV) console.error('[userStats recordPartialStudyTime]', error)
    return { ok: false, message: mapRpcError(error.message) }
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return { ok: false, message: 'Não foi possível registrar o tempo de estudo. Tente novamente.' }
  }

  return { ok: true, data: { sessionId } }
}

export async function recordPartialStudyTime(
  userId: string,
  roomId: string,
  durationMinutes: number,
): Promise<RecordStudyTimeResult> {
  return enqueueRecordStudyTime(() =>
    invokeRecordStudyTime(userId, roomId, durationMinutes),
  )
}

/** Fetch session row after RPC (for createStudySession return shape). */
export async function fetchStudySessionById(
  sessionId: string,
): Promise<UserStatsResult<StudySessionView>> {
  if (isDemoMode) {
    return { ok: false, message: 'Demo mode.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .select('*, rooms(hub_id)')
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    return { ok: false, message: 'Não foi possível carregar a sessão registrada.' }
  }

  return { ok: true, data: mapStudySessionRow(data as StudySessionRow) }
}
