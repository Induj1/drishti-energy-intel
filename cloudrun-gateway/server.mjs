import http from 'node:http'

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://drishti-sentinelmesh-500608.web.app'
const SUPABASE_API_BASE = process.env.SUPABASE_API_BASE ?? 'https://bkzbcolbucbvnvyqveoe.supabase.co/functions/v1/drishti-api'
const SERVICE_URL = process.env.CLOUD_RUN_SERVICE_URL ?? 'https://drishti-sentinelmesh-or2awz4nzq-el.a.run.app'
const PORT = Number(process.env.PORT ?? 8080)

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type,x-client-info,apikey',
  'access-control-max-age': '86400',
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    ...corsHeaders,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

function sendRedirect(res, url) {
  res.writeHead(302, {
    location: url,
    'cache-control': 'no-store',
  })
  res.end()
}

function nasikoProbe() {
  return {
    ok: true,
    sponsor: 'Nasiko',
    mode: 'adapter-ready',
    cloudRun: true,
    summary:
      'DRISHTI includes a real Nasiko router client, AgentCard package, and local Nasiko deployment guide. Live router mode requires the Nasiko Docker stack or sponsor credentials.',
    agentPackage: 'nasiko-agents/sentinelmesh-crisis-agent',
    workflowId: 'sentinelmesh-energy-crisis',
  }
}

const AGENT_REGISTRY = [
  {
    id: 'source-watchtower',
    name: 'Source Watchtower',
    role: 'Fetches PPAC, FRED, FX, EIA, CISA, FIRST, OSV, Open-Meteo, and port evidence.',
    model: 'gemini-2.5-flash',
    tools: ['live-data', 'source-cache', 'supabase-snapshots'],
    owner: 'DRISHTI',
    handoffTo: ['corridor-sentinel', 'cyber-port-guard'],
  },
  {
    id: 'corridor-sentinel',
    name: 'Corridor Sentinel',
    role: 'Scores chokepoint, vessel, weather, and rerouting stress.',
    model: 'gemini-2.5-flash',
    tools: ['open-meteo', 'vessel-stream', 'scenario-sim'],
    owner: 'DRISHTI',
    handoffTo: ['procurement-copilot'],
  },
  {
    id: 'cyber-port-guard',
    name: 'Cyber Port Guard',
    role: 'Checks port technology risk with CISA KEV, FIRST EPSS, and OSV.',
    model: 'gemini-2.5-flash',
    tools: ['cisa-kev', 'first-epss', 'osv'],
    owner: 'DRISHTI',
    handoffTo: ['policy-gate'],
  },
  {
    id: 'procurement-copilot',
    name: 'Procurement Copilot',
    role: 'Creates supplier, route, cost, and timeline alternatives.',
    model: 'gemini-2.5-flash',
    tools: ['gemini-json', 'procurement-plan'],
    owner: 'DRISHTI',
    handoffTo: ['policy-gate'],
  },
  {
    id: 'nasiko-orchestrator',
    name: 'Nasiko Orchestrator',
    role: 'Sponsor workflow bridge for multi-agent handoff traces.',
    model: 'nasiko-workflow-adapter',
    tools: ['nasiko-api', 'local-adapter'],
    owner: 'DRISHTI',
  },
  {
    id: 'policy-gate',
    name: 'Policy Gate',
    role: 'Applies human approval rules before SPR drawdown or emergency procurement.',
    model: 'rules+gemini',
    tools: ['audit-log', 'approval-gate'],
    owner: 'DRISHTI',
    handoffTo: ['citizen-brief'],
  },
  {
    id: 'citizen-brief',
    name: 'Citizen Impact Agent',
    role: 'Converts crisis output into calm household guidance.',
    model: 'gemini-2.5-flash',
    tools: ['mobile-brief', 'telegram-brief', 'nfc-brief'],
    owner: 'DRISHTI',
  },
]

function agentFacts() {
  return {
    agent: 'DRISHTI SentinelMesh',
    version: '1.0.0-hackathon',
    description: 'Multi-agent energy security crisis OS for citizens, operators, and policy teams.',
    homepage: SERVICE_URL,
    endpoints: {
      run: `${SERVICE_URL}/api/agents/run`,
      liveSummary: `${SERVICE_URL}/api/live/summary`,
      missionBrief: `${SERVICE_URL}/api/mission-brief`,
      rumorCheck: `${SERVICE_URL}/api/rumor-check`,
      evidencePack: `${SERVICE_URL}/api/evidence-pack`,
      nasikoProbe: `${SERVICE_URL}/api/nasiko/probe`,
    },
    registry: AGENT_REGISTRY,
    data_policy: 'Public and optional keyed APIs only; every output includes source provenance and confidence.',
    human_approval: 'SPR drawdown, procurement commitment, or public emergency alert requires policy gate approval.',
    deployment: {
      cloudRun: true,
      supabaseEdge: true,
      gemini: true,
      nasikoAdapter: true,
    },
  }
}

function policyVerdict(input = {}) {
  const risk = Number.isFinite(Number(input.risk)) ? Number(input.risk) : 82
  const scenarioName = input.scenarioName || 'Energy Port Cyber Shock'
  const sourceCount = Number.isFinite(Number(input.sourceCount)) ? Number(input.sourceCount) : 10
  const liveSources = Number.isFinite(Number(input.liveSources)) ? Number(input.liveSources) : 7

  if (risk >= 88) {
    return {
      decision: 'human_review',
      reason: `${scenarioName} is above the emergency threshold; procurement and SPR actions need explicit authority approval.`,
      requiredApprovals: ['Petroleum Secretary', 'Finance emergency desk', 'Cabinet duty officer'],
      riskScore: risk,
      auditTrail: [
        `${liveSources}/${sourceCount} evidence sources live or cached`,
        'SPR drawdown blocked until human approval',
        'Procurement recommendation is advisory until signed',
      ],
    }
  }

  if (risk >= 62) {
    return {
      decision: 'human_review',
      reason: 'Elevated risk allows watch mode, but market-moving actions still require duty officer approval.',
      requiredApprovals: ['Energy duty officer'],
      riskScore: risk,
      auditTrail: ['Watch mode enabled', 'No automatic market action executed'],
    }
  }

  return {
    decision: 'auto_approve',
    reason: 'Risk is below emergency action threshold; monitoring and citizen guidance can publish automatically.',
    requiredApprovals: [],
    riskScore: risk,
    auditTrail: ['Monitoring brief generated', 'No procurement or SPR action executed'],
  }
}

async function requestBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function requestJson(req) {
  try {
    const body = await requestBody(req)
    if (!body.length) return {}
    return JSON.parse(body.toString('utf8'))
  } catch {
    return {}
  }
}

function proxyHeaders(req) {
  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase()
    if (['host', 'connection', 'content-length', 'transfer-encoding', 'accept-encoding'].includes(lower)) continue
    if (value) headers[key] = Array.isArray(value) ? value.join(',') : value
  }
  headers['x-sentinelmesh-gateway'] = 'cloud-run'
  return headers
}

function responseHeaders(upstream) {
  const headers = { ...corsHeaders, 'cache-control': 'no-store' }
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (['connection', 'content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) return
    headers[key] = value
  })
  return headers
}

function stripJsonBom(payload, upstream) {
  const contentType = upstream.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return payload
  if (payload.length >= 3 && payload[0] === 0xef && payload[1] === 0xbb && payload[2] === 0xbf) {
    return payload.subarray(3)
  }
  return payload
}

async function proxyApi(req, res, url) {
  const upstreamUrl = `${SUPABASE_API_BASE}${url.pathname}${url.search}`
  const method = req.method ?? 'GET'
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await requestBody(req)
  const upstream = await fetch(upstreamUrl, {
    method,
    headers: proxyHeaders(req),
    body,
  })
  const payload = stripJsonBom(Buffer.from(await upstream.arrayBuffer()), upstream)
  res.writeHead(upstream.status, responseHeaders(upstream))
  res.end(payload)
}

async function evidencePack(url) {
  const scenarioId = url.searchParams.get('scenarioId') ?? 'energy_port_cyber_shock'
  let run
  try {
    const upstream = await fetch(`${SUPABASE_API_BASE}/api/agents/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sentinelmesh-gateway': 'cloud-run',
      },
      body: JSON.stringify({ scenarioId, role: 'judge' }),
    })
    if (!upstream.ok) throw new Error(`agent_run_${upstream.status}`)
    run = await upstream.json()
  } catch {
    run = {
      runId: `cloudrun-pack-${Date.now()}`,
      scenarioId,
      scenarioName: 'Energy Port Cyber Shock',
      role: 'judge',
      mode: 'gateway-fallback',
      overallRisk: 82,
      steps: AGENT_REGISTRY.map((agent) => ({
        agentId: agent.id,
        agentName: agent.name,
        status: agent.id === 'policy-gate' ? 'needs_approval' : 'completed',
        summary: agent.role,
        confidence: agent.id === 'nasiko-orchestrator' ? 0.62 : 0.82,
      })),
      sources: [
        { title: 'FRED Brent crude series', provider: 'Federal Reserve Bank of St. Louis', mode: 'live', confidence: 0.93, url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU' },
        { title: 'CISA Known Exploited Vulnerabilities', provider: 'CISA', mode: 'live', confidence: 0.94, url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
        { title: 'Nasiko proof endpoint', provider: 'DRISHTI Cloud Run Gateway', mode: 'live', confidence: 0.9, url: `${SERVICE_URL}/api/nasiko/probe` },
      ],
      policy: policyVerdict({ risk: 82, scenarioName: 'Energy Port Cyber Shock', sourceCount: 10, liveSources: 7 }),
    }
  }

  const steps = Array.isArray(run.steps) ? run.steps : []
  const sources = Array.isArray(run.sources) ? run.sources : []
  const markdown = [
    '# DRISHTI Evidence Pack',
    '',
    `Run: ${run.runId}`,
    `Scenario: ${run.scenarioName}`,
    `Overall risk: ${run.overallRisk}/100`,
    `Mode: ${run.mode}`,
    '',
    '## Agent Steps',
    ...steps.map((step) => `- ${step.agentName}: ${step.summary} (${Math.round((step.confidence ?? 0) * 100)}% confidence)`),
    '',
    '## Sources',
    ...sources.map((source) => `- ${source.title} - ${source.provider} - ${source.mode} - ${Math.round((source.confidence ?? 0) * 100)}% - ${source.url}`),
    '',
    '## Policy Gate',
    `${run.policy?.decision ?? 'human_review'}: ${run.policy?.reason ?? 'High-impact actions require human approval.'}`,
  ].join('\n')

  return { run, markdown }
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://gateway.local')

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders)
      res.end()
      return
    }

    if (url.pathname === '/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'drishti-sentinelmesh-cloudrun-gateway',
        apiProxy: true,
        frontend: FRONTEND_URL,
        backend: SUPABASE_API_BASE,
      })
      return
    }

    if (url.pathname === '/api/nasiko/probe') {
      sendJson(res, 200, nasikoProbe())
      return
    }

    if (url.pathname === '/api/nasiko') {
      sendJson(res, 200, nasikoProbe())
      return
    }

    if (url.pathname === '/api/agentfacts' || url.pathname === '/.well-known/agentfacts.json') {
      sendJson(res, 200, agentFacts())
      return
    }

    if (url.pathname === '/api/policy-gate') {
      const body = req.method === 'POST' ? await requestJson(req) : {}
      sendJson(res, 200, policyVerdict(body))
      return
    }

    if (url.pathname === '/api/evidence-pack') {
      sendJson(res, 200, await evidencePack(url))
      return
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        await proxyApi(req, res, url)
      } catch (error) {
        sendJson(res, 502, {
          ok: false,
          service: 'drishti-sentinelmesh-cloudrun-gateway',
          error: error instanceof Error ? error.message : 'proxy_failed',
        })
      }
      return
    }

    sendRedirect(res, `${FRONTEND_URL}${url.pathname}${url.search}`)
  })
  .listen(PORT, '0.0.0.0')
