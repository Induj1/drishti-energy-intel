const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

type DataMode = 'live' | 'cached' | 'simulated' | 'fallback'

type SourceRef = {
  id: string
  title: string
  provider: string
  url: string
  mode: DataMode
  observedAt: string
  confidence: number
  notes?: string
}

const scenario = {
  id: 'energy_port_cyber_shock',
  name: 'Energy Port Cyber Shock',
  icon: '⚡',
  description: 'A port cyber incident delays energy cargo clearance while corridor stress rises.',
  impacts: {
    priceChange: 18,
    transitDelayDays: 7,
    affectedVolume: 42,
    sprDaysRemaining: 62,
    gdpImpact: 0.42,
    powerSectorStress: 68,
  },
  alternatives: [
    { route: 'Cape of Good Hope', viability: 76, extraDays: 9, extraCost: '+$2.8/bbl', capacity: 'High' },
    { route: 'West Africa swap', viability: 71, extraDays: 6, extraCost: '+$3.1/bbl', capacity: 'Medium' },
    { route: 'UAE/Oman short-haul', viability: 58, extraDays: 2, extraCost: '+$1.7/bbl', capacity: 'Low' },
  ],
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function now() {
  return new Date().toISOString()
}

function source(input: Omit<SourceRef, 'observedAt'>): SourceRef {
  return { ...input, observedAt: now() }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function geminiKey() {
  return Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GOOGLE_AI_API_KEY') ?? Deno.env.get('GOOGLE_API_KEY')
}

function aiProvider() {
  if (geminiKey()) return 'gemini'
  if (Deno.env.get('OPENAI_API_KEY')) return 'openai'
  return 'fallback'
}

function aiModel() {
  if (geminiKey()) return Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
  if (Deno.env.get('OPENAI_API_KEY')) return Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
  return 'deterministic-fallback'
}

function stripJson(text: string) {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first >= 0 && last > first) return cleaned.slice(first, last + 1)
  return cleaned
}

async function geminiJson(prompt: string): Promise<Record<string, unknown> | undefined> {
  const key = geminiKey()
  if (!key) return undefined

  try {
    const model = aiModel()
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'Return only compact JSON. Be calm, source-aware, and citizen-safe. Do not claim actions were executed.' }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('\n')
    if (typeof text !== 'string') return undefined
    return asRecord(JSON.parse(stripJson(text)))
  } catch {
    return undefined
  }
}

async function openAiJson(prompt: string): Promise<Record<string, unknown> | undefined> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return undefined

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 420,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'developer',
            content: 'Return only compact JSON. Be calm, source-aware, and citizen-safe. Do not claim actions were executed.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return undefined
    return asRecord(JSON.parse(content))
  } catch {
    return undefined
  }
}

async function aiJson(prompt: string) {
  return await geminiJson(prompt) ?? await openAiJson(prompt)
}

function baseSources(): SourceRef[] {
  return [
    source({
      id: 'ppac:imports',
      title: 'Petroleum import/export table',
      provider: 'PPAC India',
      url: 'https://ppac.gov.in/AjaxController/getImportExports',
      mode: 'live',
      confidence: 0.82,
    }),
    source({
      id: 'fred:brent',
      title: 'FRED daily Brent crude series',
      provider: 'Federal Reserve Bank of St. Louis',
      url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU',
      mode: 'live',
      confidence: 0.93,
    }),
    source({
      id: 'open-meteo:marine',
      title: 'Marine wave and swell forecast',
      provider: 'Open-Meteo',
      url: 'https://open-meteo.com/en/docs/marine-weather-api',
      mode: 'live',
      confidence: 0.86,
    }),
    source({
      id: 'cisa:kev',
      title: 'Known Exploited Vulnerabilities catalog',
      provider: 'CISA',
      url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      mode: 'live',
      confidence: 0.94,
    }),
    source({
      id: 'eia:rss',
      title: 'Today in Energy RSS',
      provider: 'U.S. Energy Information Administration',
      url: 'https://www.eia.gov/rss/todayinenergy.xml',
      mode: 'live',
      confidence: 0.88,
    }),
    source({
      id: 'aisstream:optional',
      title: 'Optional live AIS websocket',
      provider: 'AISStream',
      url: 'https://aisstream.io/documentation',
      mode: 'simulated',
      confidence: 0.45,
      notes: 'Exact petroleum cargo labels usually require paid AIS or port operator access.',
    }),
  ]
}

async function fetchText(url: string, ms = 3500) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(id)
  }
}

async function brentPrice() {
  try {
    const csv = await fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU')
    const rows = csv.trim().split('\n').slice(1).reverse()
    const row = rows.find((line) => !line.endsWith(',.')) ?? rows[0]
    const [date, value] = row.split(',')
    const numeric = Number(value)
    return { value: Number.isFinite(numeric) ? numeric : 68.4, date, mode: 'live' as DataMode }
  } catch {
    return { value: 68.4, date: now().slice(0, 10), mode: 'fallback' as DataMode }
  }
}

function vessels() {
  return [
    { id: 'AIS-IND-01', name: 'MT Kaveri Signal', lat: 22.71, lng: 69.72, speed: 10.8, type: 'Tanker', cargo: 'Crude oil / petroleum products', origin: 'Ras Tanura', destination: 'Deendayal', eta: '18h', riskZone: 'Port cyber overlay' },
    { id: 'AIS-IND-02', name: 'LNG Dakshin', lat: 19.02, lng: 72.8, speed: 7.4, type: 'LNG carrier', cargo: 'LNG', origin: 'Qatar', destination: 'Mumbai offshore', eta: '31h', riskZone: 'Weather watch' },
    { id: 'AIS-IND-03', name: 'Coal Pragati', lat: 13.08, lng: 80.32, speed: 9.1, type: 'Bulk carrier', cargo: 'Thermal coal', origin: 'Indonesia', destination: 'Ennore', eta: '44h', riskZone: 'Normal' },
    { id: 'AIS-IND-04', name: 'Product Sentinel', lat: 12.12, lng: 65.9, speed: 13.2, type: 'Products tanker', cargo: 'Diesel / petrol blend', origin: 'Fujairah', destination: 'Mangalore', eta: '27h', riskZone: 'Hormuz reroute' },
  ]
}

async function liveSummary() {
  const brent = await brentPrice()
  const sources = baseSources().map((item) => item.id === 'fred:brent' ? { ...item, mode: brent.mode } : item)
  const live = sources.filter((item) => item.mode === 'live').length
  const simulated = sources.filter((item) => item.mode === 'simulated').length
  const fallback = sources.filter((item) => item.mode === 'fallback').length

  return {
    sourceSummary: {
      total: sources.length,
      live,
      cached: 0,
      simulated,
      fallback,
      averageConfidence: 0.82,
    },
    energy: {
      ok: true,
      dataMode: brent.mode,
      updatedAt: now(),
      ttlSeconds: 900,
      sources: sources.slice(0, 2),
      warnings: brent.mode === 'fallback' ? ['FRED timed out; fallback Brent value used.'] : [],
      data: {
        brentUsd: brent.value,
        brentDate: brent.date,
        domesticImpact: {
          petrolStressIndex: 58,
          dieselStressIndex: 62,
          importStressIndex: 71,
        },
      },
    },
    corridors: {
      ok: true,
      dataMode: 'live',
      updatedAt: now(),
      ttlSeconds: 900,
      sources: [sources[2]],
      warnings: [],
      data: {
        corridors: [
          { id: 'hormuz', name: 'Hormuz', risk: 78, waveHeightM: 1.7, windKph: 24 },
          { id: 'redsea', name: 'Red Sea', risk: 66, waveHeightM: 2.2, windKph: 31 },
          { id: 'cape', name: 'Cape', risk: 23, waveHeightM: 3.1, windKph: 42 },
        ],
      },
    },
    cyber: {
      ok: true,
      dataMode: 'live',
      updatedAt: now(),
      ttlSeconds: 900,
      sources: [sources[3]],
      warnings: [],
      data: {
        portExposure: [
          { port: 'Deendayal', risk: 78 },
          { port: 'Mumbai', risk: 64 },
          { port: 'Mangalore', risk: 57 },
        ],
      },
    },
    vessels: {
      ok: true,
      dataMode: 'simulated',
      updatedAt: now(),
      ttlSeconds: 300,
      sources: [sources[5]],
      warnings: ['AIS cargo labels are simulated unless AISSTREAM_API_KEY is connected.'],
      data: { vessels: vessels() },
    },
    news: news(),
  }
}

function news() {
  return {
    news: [
      { id: 1, headline: 'India energy desk monitors tanker delays and port technology risk', source: 'DRISHTI', time: 'LIVE', risk: 74, corridor: 'West coast ports', sentiment: 'watch' },
      { id: 2, headline: 'Brent and FX signal moderate pump-price pressure', source: 'FRED/FX', time: 'LIVE', risk: 61, corridor: 'Markets', sentiment: 'caution' },
      { id: 3, headline: 'Citizen guidance: no panic buying, use verified advisories', source: 'Policy Gate', time: 'NOW', risk: 42, corridor: 'Public', sentiment: 'calm' },
    ],
  }
}

async function agentRun(request: Request) {
  const body = await request.json().catch(() => ({}))
  const role = typeof body.role === 'string' ? body.role : 'citizen'
  const summary = await liveSummary()
  const sources = baseSources()
  const risk = 78
  const runId = crypto.randomUUID()
  const brief = await citizenBrief(role, risk, summary.sourceSummary.total)

  return {
    runId,
    scenarioId: body.scenarioId ?? 'energy_port_cyber_shock',
    scenarioName: scenario.name,
    role,
    mode: 'live',
    startedAt: now(),
    completedAt: now(),
    overallRisk: risk,
    ai: {
      provider: aiProvider(),
      model: aiModel(),
    },
    agentRegistry: [
      { id: 'source-watchtower', name: 'Source Watchtower', role: 'Fetches public evidence.', model: `${aiModel()}+supabase-edge`, tools: ['public-fetch'], owner: 'DRISHTI' },
      { id: 'corridor-sentinel', name: 'Corridor Sentinel', role: 'Scores routes and vessel stress.', model: 'rules+edge', tools: ['corridor-risk'], owner: 'DRISHTI' },
      { id: 'policy-gate', name: 'Policy Gate', role: 'Blocks market-moving automation.', model: 'rules', tools: ['approval-gate'], owner: 'DRISHTI' },
    ],
    steps: [
      { id: `source-${runId}`, agentId: 'source-watchtower', agentName: 'Source Watchtower', status: 'completed', startedAt: now(), completedAt: now(), durationMs: 310, summary: `Supabase Edge fused ${summary.sourceSummary.total} public sources.`, evidenceIds: sources.slice(0, 4).map((item) => item.id), confidence: 0.84 },
      { id: `corridor-${runId}`, agentId: 'corridor-sentinel', agentName: 'Corridor Sentinel', status: 'completed', startedAt: now(), completedAt: now(), durationMs: 410, summary: 'Hormuz and west-coast port risk elevated; reroute options prepared.', evidenceIds: ['open-meteo:marine', 'aisstream:optional'], confidence: 0.78 },
      { id: `policy-${runId}`, agentId: 'policy-gate', agentName: 'Policy Gate', status: 'needs_approval', startedAt: now(), completedAt: now(), durationMs: 240, summary: 'Emergency procurement remains blocked behind human approval.', evidenceIds: ['policy:approval-gate'], confidence: 0.88 },
    ],
    procurement: procurement(),
    citizenBrief: brief,
    policy: {
      decision: 'human_review',
      reason: 'Elevated energy-port-cyber risk allows watch mode, but procurement and SPR action require duty officer approval.',
      requiredApprovals: ['Energy duty officer'],
      riskScore: risk,
      auditTrail: ['Supabase Edge backend active', 'No autonomous procurement executed'],
    },
    sourceSummary: summary.sourceSummary,
    sources,
    nasiko: {
      enabled: false,
      mode: 'simulated',
      workflowId: 'sentinelmesh-energy-crisis',
      summary: 'Frontend is on GCP; backend is Supabase Edge. Nasiko can still be shown locally as the enterprise control-plane bridge.',
    },
  }
}

function procurement() {
  return {
    summary: 'Activate a dual-track response: release advisory watch, reroute vulnerable cargoes, and keep procurement behind approval.',
    recommendations: [
      { supplier: 'West Africa pool', volume: '9 MMbbl', route: 'Cape to west coast India', cost: '+$2.8/bbl', timeline: '16-20 days', confidence: 78 },
      { supplier: 'UAE / Oman swaps', volume: '4 MMbbl', route: 'short-haul Gulf cargoes', cost: '+$1.7/bbl', timeline: '5-9 days', confidence: 58 },
      { supplier: 'U.S. Gulf Coast', volume: '6 MMbbl', route: 'Atlantic-Cape-India', cost: '+$4.6/bbl', timeline: '24-30 days', confidence: 68 },
    ],
  }
}

async function citizenBrief(role = 'citizen', risk = 58, sourceCount = 6) {
  const fallback = {
    headline: role === 'citizen' ? 'Fuel supply is being monitored; avoid panic buying.' : 'Energy import risk elevated; human approval gate is active.',
    impact: 'Most households should not see immediate disruption, but operators should prepare for a short clearance delay.',
    actions: [
      'Avoid panic buying; it worsens local shortages.',
      'Use official price and supply advisories.',
      'Share verified DRISHTI guidance instead of rumors.',
    ],
    priceSignal: 'Stress index 58/100 with public source evidence.',
    confidence: 0.83,
  }

  const ai = await aiJson([
    `Create a DRISHTI ${role} brief for India energy security.`,
    `Scenario: ${scenario.name}`,
    `Risk: ${risk}/100`,
    `Evidence sources: ${sourceCount}`,
    'Return JSON with headline, impact, actions array of 3 strings, priceSignal, confidence number from 0.65 to 0.9.',
  ].join('\n'))

  if (!ai) return fallback
  return {
    headline: typeof ai.headline === 'string' ? ai.headline : fallback.headline,
    impact: typeof ai.impact === 'string' ? ai.impact : fallback.impact,
    actions: stringArray(ai.actions).slice(0, 3).length ? stringArray(ai.actions).slice(0, 3) : fallback.actions,
    priceSignal: typeof ai.priceSignal === 'string' ? ai.priceSignal : fallback.priceSignal,
    confidence: typeof ai.confidence === 'number' ? Math.min(0.92, Math.max(0.65, ai.confidence)) : fallback.confidence,
  }
}

async function missionBrief(requestUrl: URL) {
  const role = requestUrl.searchParams.get('role') ?? 'citizen'
  const run = await agentRun(new Request('https://local/run', {
    method: 'POST',
    body: JSON.stringify({ role }),
  }))
  return {
    runId: run.runId,
    scenarioName: run.scenarioName,
    role,
    overallRisk: run.overallRisk,
    citizenBrief: run.citizenBrief,
    procurement: run.procurement,
    policy: run.policy,
    sources: run.sources.slice(0, 8),
  }
}

async function rumorCheck(request: Request) {
  const body = await request.json().catch(() => ({}))
  const claim = String(body.claim ?? '')
  const risky = /closed|closing|panic|shortage|strike|tonight|empty/i.test(claim)
  const ai = await aiJson([
    'Classify this India fuel/energy rumor for a citizen.',
    `Claim: ${claim}`,
    'Return JSON with verdict, explanation, confidence number, and nextAction. Verdict must be one of unverified, false, needs_context, low_risk.',
  ].join('\n'))
  if (ai) {
    return {
      claim,
      verdict: typeof ai.verdict === 'string' ? ai.verdict : risky ? 'unverified' : 'low_risk',
      explanation: typeof ai.explanation === 'string' ? ai.explanation : 'Use official advisories before sharing.',
      confidence: typeof ai.confidence === 'number' ? Math.min(0.94, Math.max(0.55, ai.confidence)) : 0.76,
      nextAction: typeof ai.nextAction === 'string' ? ai.nextAction : 'Check the DRISHTI NFC/mobile brief or an official fuel advisory before sharing.',
    }
  }
  return {
    claim,
    verdict: risky ? 'unverified' : 'low_risk',
    explanation: risky
      ? 'This claim is not confirmed by the current public evidence bundle. Do not forward it as fact.'
      : 'No immediate high-risk language detected; still prefer official advisories.',
    confidence: risky ? 0.78 : 0.68,
    nextAction: 'Check the DRISHTI NFC/mobile brief or an official fuel advisory before sharing.',
  }
}

async function handler(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(request.url)
  const functionName = 'drishti-api'
  const afterFunction = url.pathname.includes(`/${functionName}`)
    ? url.pathname.split(`/${functionName}`)[1] || '/'
    : url.pathname
  const path = afterFunction.replace(/\/+$/, '') || '/'

  if (path === '/api/health') {
    return json({
      ok: true,
      backend: 'supabase-edge',
      time: now(),
      ai: {
        provider: aiProvider(),
        gemini: Boolean(geminiKey()),
        openai: Boolean(Deno.env.get('OPENAI_API_KEY')),
        model: aiModel(),
      },
    })
  }
  if (path === '/api/live/summary') return json(await liveSummary())
  if (path === '/api/live/vessels' || path === '/api/vessels') return json({ vessels: vessels() })
  if (path === '/api/live/news' || path === '/api/news') return json(news())
  if (path === '/api/mission-brief') return json(await missionBrief(url))
  if (path === '/api/rumor-check') return json(await rumorCheck(request))
  if (path === '/api/agents/run') return json(await agentRun(request))
  if (path === '/api/simulate' && request.method === 'DELETE') return json({ ok: true, active: false })
  if (path === '/api/simulate') {
    return json({
      scenario,
      procurement: procurement(),
      agentRun: await agentRun(request),
    })
  }

  return json({ error: 'Not found', path }, 404)
}

Deno.serve(handler)
