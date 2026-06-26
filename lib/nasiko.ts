import type { DataMode, SourceRef } from '@/lib/sentinel-types'

export type NasikoResult = {
  enabled: boolean
  mode: DataMode
  workflowId: string
  summary: string
  traceUrl?: string
  routerUrl?: string
  sessionId?: string
  events?: string[]
  source?: SourceRef
}

type NasikoPayload = {
  runId: string
  scenarioId: string
  risk: number
  agents: string[]
  sources: Array<{ id: string; title: string; mode: string; confidence: number }>
}

type NasikoJsonEvent = {
  is_int_response?: boolean
  status?: string
  response?: unknown
  content?: unknown
  message?: unknown
  output?: unknown
  data?: unknown
  agent?: unknown
  error?: unknown
}

function endpoint() {
  return normalizeBaseUrl(process.env.NASIKO_API_URL ?? process.env.NASICO_API_URL)
}

function normalizeBaseUrl(value?: string) {
  if (!value) return undefined
  return value.replace(/\/+$/, '')
}

function joinUrl(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

function timeoutMs() {
  const parsed = Number(process.env.NASIKO_TIMEOUT_MS ?? 6000)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6000
}

async function fetchWithTimeout(input: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs())
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    })
  } finally {
    clearTimeout(id)
  }
}

function staticBearerToken() {
  return (
    process.env.NASIKO_TOKEN ??
    process.env.NASIKO_BEARER_TOKEN ??
    process.env.NASIKO_API_KEY ??
    process.env.NASICO_API_KEY
  )
}

function loginCredentials() {
  const accessKey = process.env.NASIKO_ACCESS_KEY ?? process.env.NASICO_ACCESS_KEY
  const accessSecret = process.env.NASIKO_ACCESS_SECRET ?? process.env.NASICO_ACCESS_SECRET
  if (!accessKey || !accessSecret) return undefined
  return { accessKey, accessSecret }
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function getNasikoToken(baseUrl: string) {
  const token = staticBearerToken()
  if (token) return token

  const credentials = loginCredentials()
  if (!credentials) return undefined

  const authPath = process.env.NASIKO_AUTH_PATH ?? '/auth/users/login'
  const res = await fetchWithTimeout(joinUrl(baseUrl, authPath), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: credentials.accessKey,
      access_secret: credentials.accessSecret,
    }),
  })

  if (!res.ok) throw new Error(`Nasiko login returned ${res.status}`)
  const data = (await res.json()) as unknown
  if (!isRecord(data)) throw new Error('Nasiko login response was not JSON object')

  const loginToken = pickString(data, ['token', 'access_token', 'jwt'])
  if (!loginToken) throw new Error('Nasiko login did not return token')
  return loginToken
}

function buildRouterQuery(workflowId: string, payload: NasikoPayload) {
  const sourceLines = payload.sources
    .slice(0, 10)
    .map((source) => `- ${source.title} (${source.mode}, confidence ${Math.round(source.confidence * 100)}%, id ${source.id})`)
    .join('\n')

  return [
    'DRISHTI SentinelMesh crisis orchestration handoff.',
    `Workflow: ${workflowId}`,
    `Scenario: ${payload.scenarioId}`,
    `Run ID: ${payload.runId}`,
    `Risk score: ${payload.risk}/100`,
    `Available agents: ${payload.agents.join(', ')}`,
    '',
    'Task for Nasiko router:',
    'Select the best SentinelMesh crisis agent, coordinate the handoff, and return a concise enterprise action trace.',
    'The answer must include selected agent, confidence, escalation level, and one citizen-safe public message.',
    '',
    'Evidence sources:',
    sourceLines || '- No live sources were attached.',
  ].join('\n')
}

function textFromUnknown(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const joined = value.map(textFromUnknown).filter(Boolean).join(' ')
    return joined || undefined
  }
  if (isRecord(value)) {
    const direct = pickString(value, ['text', 'content', 'message', 'summary', 'result', 'output'])
    if (direct) return direct
    return JSON.stringify(value)
  }
  return undefined
}

function parseNasikoRouterText(text: string) {
  const events: NasikoJsonEvent[] = []
  const plainLines: string[] = []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^data:\s*/, '')
    if (!line) continue
    try {
      const parsed = JSON.parse(line) as unknown
      if (isRecord(parsed)) events.push(parsed as NasikoJsonEvent)
      else plainLines.push(line)
    } catch {
      plainLines.push(line)
    }
  }

  const finalEvent =
    [...events].reverse().find((event) => event.is_int_response === false) ??
    [...events].reverse().find((event) => event.response ?? event.content ?? event.message ?? event.output ?? event.data) ??
    events.at(-1)

  const summary =
    textFromUnknown(finalEvent?.response) ??
    textFromUnknown(finalEvent?.content) ??
    textFromUnknown(finalEvent?.message) ??
    textFromUnknown(finalEvent?.output) ??
    textFromUnknown(finalEvent?.data) ??
    plainLines.at(-1) ??
    'Nasiko router accepted the request.'

  const statusEvents = events
    .map((event) => textFromUnknown(event.status ?? event.message ?? event.agent ?? event.error))
    .filter((event): event is string => Boolean(event))
    .slice(0, 8)

  return { summary, events: statusEvents }
}

async function callNasikoRouter(baseUrl: string, token: string, workflowId: string, payload: NasikoPayload) {
  const routerPath = process.env.NASIKO_ROUTER_PATH ?? '/router'
  const routerUrl = joinUrl(baseUrl, routerPath)
  const form = new FormData()
  form.append('query', buildRouterQuery(workflowId, payload))
  form.append('session_id', `${workflowId}-${payload.runId}`)

  const res = await fetchWithTimeout(routerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Nasiko router returned ${res.status}: ${text.slice(0, 180)}`)
  return { ...parseNasikoRouterText(text), routerUrl, sessionId: `${workflowId}-${payload.runId}` }
}

async function callLegacyWebhook(url: string, workflowId: string, payload: NasikoPayload, key?: string): Promise<NasikoResult> {
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ workflowId, payload }),
  })
  if (!res.ok) throw new Error(`Nasiko webhook returned ${res.status}`)
  const data = (await res.json()) as unknown
  const record = isRecord(data) ? data : {}
  return {
    enabled: true,
    mode: 'live',
    workflowId: pickString(record, ['workflowId', 'workflow_id']) ?? workflowId,
    summary: pickString(record, ['summary', 'message', 'result']) ?? 'Nasiko workflow accepted the multi-agent handoff.',
    traceUrl: pickString(record, ['traceUrl', 'trace_url']),
  }
}

export async function runNasikoWorkflow(payload: NasikoPayload): Promise<NasikoResult> {
  const baseUrl = endpoint()
  const workflowId = process.env.NASIKO_WORKFLOW_ID ?? process.env.NASICO_WORKFLOW_ID ?? 'sentinelmesh-energy-crisis'
  const traceUrl = process.env.NASIKO_TRACE_URL ?? process.env.PHOENIX_TRACE_URL
  const legacyWebhookUrl = process.env.NASIKO_WEBHOOK_URL ?? process.env.NASICO_WEBHOOK_URL

  if (legacyWebhookUrl) {
    try {
      return await callLegacyWebhook(legacyWebhookUrl, workflowId, payload, staticBearerToken())
    } catch (error) {
      return {
        enabled: true,
        mode: 'fallback',
        workflowId,
        traceUrl,
        summary: `Nasiko webhook failed, local orchestration continued: ${error instanceof Error ? error.message : 'unknown error'}`,
      }
    }
  }

  if (!baseUrl) {
    return {
      enabled: false,
      mode: 'simulated',
      workflowId,
      traceUrl,
      summary: 'Nasiko adapter ran in local mode. Set NASIKO_API_URL plus NASIKO_ACCESS_KEY/NASIKO_ACCESS_SECRET or NASIKO_TOKEN to route through the sponsor control plane.',
    }
  }

  try {
    const token = await getNasikoToken(baseUrl)
    if (!token) {
      return {
        enabled: true,
        mode: 'fallback',
        workflowId,
        traceUrl,
        routerUrl: joinUrl(baseUrl, process.env.NASIKO_ROUTER_PATH ?? '/router'),
        summary: 'Nasiko base URL is configured, but no NASIKO_TOKEN or NASIKO_ACCESS_KEY/NASIKO_ACCESS_SECRET was provided.',
      }
    }

    const routed = await callNasikoRouter(baseUrl, token, workflowId, payload)
    return {
      enabled: true,
      mode: 'live',
      workflowId,
      summary: routed.summary,
      traceUrl,
      routerUrl: routed.routerUrl,
      sessionId: routed.sessionId,
      events: routed.events,
    }
  } catch (error) {
    return {
      enabled: true,
      mode: 'fallback',
      workflowId,
      traceUrl,
      routerUrl: joinUrl(baseUrl, process.env.NASIKO_ROUTER_PATH ?? '/router'),
      summary: `Nasiko router call failed, local orchestration continued: ${error instanceof Error ? error.message : 'unknown error'}`,
    }
  }
}
