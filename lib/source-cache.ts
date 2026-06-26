import { createSupabaseClient } from '@/lib/supabase'
import type { DataMode, LiveEnvelope, SourceRef } from '@/lib/sentinel-types'

type CachedEnvelope = {
  expiresAt: number
  envelope: LiveEnvelope<unknown>
}

const memoryCache = new Map<string, CachedEnvelope>()

export function sourceRef(input: {
  id: string
  title: string
  provider: string
  url: string
  mode: DataMode
  confidence: number
  notes?: string
}): SourceRef {
  return {
    ...input,
    observedAt: new Date().toISOString(),
  }
}

export function liveEnvelope<T>(input: {
  data: T
  ttlSeconds: number
  sources: SourceRef[]
  dataMode?: DataMode
  warnings?: string[]
  ok?: boolean
}): LiveEnvelope<T> {
  const modes = input.sources.map((s) => s.mode)
  const dataMode =
    input.dataMode ??
    (modes.includes('live') ? 'live' : modes.includes('cached') ? 'cached' : modes.includes('simulated') ? 'simulated' : 'fallback')

  return {
    ok: input.ok ?? true,
    dataMode,
    updatedAt: new Date().toISOString(),
    ttlSeconds: input.ttlSeconds,
    sources: input.sources,
    warnings: input.warnings ?? [],
    data: input.data,
  }
}

export function fallbackEnvelope<T>(
  key: string,
  data: T,
  message = 'Live source unavailable; using deterministic fallback.'
): LiveEnvelope<T> {
  return liveEnvelope({
    ok: false,
    data,
    dataMode: 'fallback',
    ttlSeconds: 60,
    warnings: [message],
    sources: [
      sourceRef({
        id: `${key}:fallback`,
        title: 'DRISHTI local fallback',
        provider: 'DRISHTI SentinelMesh',
        url: 'local://fallback',
        mode: 'fallback',
        confidence: 0.48,
        notes: message,
      }),
    ],
  })
}

async function persistSnapshot(key: string, envelope: LiveEnvelope<unknown>) {
  const sb = createSupabaseClient()
  if (!sb) return

  await sb.from('source_snapshots').insert({
    source_key: key,
    data_mode: envelope.dataMode,
    payload: envelope.data,
    source_refs: envelope.sources,
    warnings: envelope.warnings,
    fetched_at: envelope.updatedAt,
  })
}

export async function withSourceCache<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<LiveEnvelope<T>>,
  fallbackData: T
): Promise<LiveEnvelope<T>> {
  const now = Date.now()
  const cached = memoryCache.get(key)

  if (cached && cached.expiresAt > now) {
    const envelope = cached.envelope as LiveEnvelope<T>
    return {
      ...envelope,
      dataMode: envelope.dataMode === 'live' ? 'cached' : envelope.dataMode,
      warnings: [...envelope.warnings, `Served from ${key} cache.`],
      sources: envelope.sources.map((s) => ({
        ...s,
        mode: s.mode === 'live' ? 'cached' : s.mode,
      })),
    }
  }

  try {
    const envelope = await producer()
    memoryCache.set(key, {
      expiresAt: now + ttlSeconds * 1000,
      envelope: envelope as LiveEnvelope<unknown>,
    })
    persistSnapshot(key, envelope as LiveEnvelope<unknown>).catch(() => {})
    return envelope
  } catch (error) {
    if (cached) {
      const envelope = cached.envelope as LiveEnvelope<T>
      return {
        ...envelope,
        dataMode: 'cached',
        warnings: [...envelope.warnings, `Live refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`],
        sources: envelope.sources.map((s) => ({ ...s, mode: s.mode === 'live' ? 'cached' : s.mode })),
      }
    }

    return fallbackEnvelope(key, fallbackData, error instanceof Error ? error.message : undefined)
  }
}
