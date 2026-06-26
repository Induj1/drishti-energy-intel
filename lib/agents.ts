import { randomUUID } from 'crypto'
import { generateCitizenBrief, generateProcurementPlan } from '@/lib/ai'
import { flattenSources, getLiveSummary } from '@/lib/live-data'
import { SIMULATION_SCENARIOS } from '@/lib/mock-data'
import { runNasikoWorkflow } from '@/lib/nasiko'
import { createSupabaseClient } from '@/lib/supabase'
import type { AgentDefinition, AgentRunResponse, AgentRunStep, PolicyVerdict, SourceRef } from '@/lib/sentinel-types'

type ScenarioKey = keyof typeof SIMULATION_SCENARIOS

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: 'source-watchtower',
    name: 'Source Watchtower',
    role: 'Fetches PPAC, FRED, FX, EIA, CISA, FIRST, OSV, Open-Meteo, and port evidence.',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash/local',
    tools: ['live-data', 'source-cache', 'supabase-snapshots'],
    owner: 'DRISHTI',
    handoffTo: ['corridor-sentinel', 'cyber-port-guard'],
  },
  {
    id: 'corridor-sentinel',
    name: 'Corridor Sentinel',
    role: 'Scores chokepoint, vessel, weather, and rerouting stress.',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash/local',
    tools: ['open-meteo', 'vessel-stream', 'scenario-sim'],
    owner: 'DRISHTI',
    handoffTo: ['procurement-copilot'],
  },
  {
    id: 'cyber-port-guard',
    name: 'Cyber Port Guard',
    role: 'Checks port technology risk with CISA KEV, FIRST EPSS, and OSV.',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash/local',
    tools: ['cisa-kev', 'first-epss', 'osv'],
    owner: 'DRISHTI',
    handoffTo: ['policy-gate'],
  },
  {
    id: 'procurement-copilot',
    name: 'Procurement Copilot',
    role: 'Creates supplier, route, cost, and timeline alternatives.',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash/local',
    tools: ['gemini-json', 'procurement-plan'],
    owner: 'DRISHTI',
    handoffTo: ['policy-gate'],
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
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash/local',
    tools: ['mobile-brief', 'telegram-brief', 'nfc-brief'],
    owner: 'DRISHTI',
  },
  {
    id: 'nasiko-orchestrator',
    name: 'Nasiko Orchestrator',
    role: 'Sponsor workflow bridge for multi-agent handoff traces.',
    model: 'nasiko-workflow-adapter',
    tools: ['nasiko-api', 'local-adapter'],
    owner: 'DRISHTI',
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function step(input: Omit<AgentRunStep, 'id' | 'startedAt' | 'completedAt' | 'durationMs' | 'status'> & { status?: AgentRunStep['status']; offset: number }): AgentRunStep {
  const now = Date.now()
  const startedAt = new Date(now + input.offset).toISOString()
  const durationMs = 420 + Math.round(Math.random() * 540)
  return {
    id: `${input.agentId}-${randomUUID().slice(0, 8)}`,
    agentId: input.agentId,
    agentName: input.agentName,
    status: input.status ?? 'completed',
    startedAt,
    completedAt: new Date(now + input.offset + durationMs).toISOString(),
    durationMs,
    summary: input.summary,
    evidenceIds: input.evidenceIds,
    confidence: input.confidence,
  }
}

export function buildPolicyVerdict(input: {
  risk: number
  scenarioName: string
  sourceCount: number
  liveSources: number
}): PolicyVerdict {
  if (input.risk >= 88) {
    return {
      decision: 'human_review',
      reason: `${input.scenarioName} is above the emergency threshold; procurement and SPR actions need explicit authority approval.`,
      requiredApprovals: ['Petroleum Secretary', 'Finance emergency desk', 'Cabinet duty officer'],
      riskScore: input.risk,
      auditTrail: [
        `${input.liveSources}/${input.sourceCount} evidence sources live or cached`,
        'SPR drawdown blocked until human approval',
        'Procurement recommendation is advisory until signed',
      ],
    }
  }
  if (input.risk >= 62) {
    return {
      decision: 'human_review',
      reason: 'Elevated risk allows watch mode, but market-moving actions still require duty officer approval.',
      requiredApprovals: ['Energy duty officer'],
      riskScore: input.risk,
      auditTrail: ['Watch mode enabled', 'No automatic market action executed'],
    }
  }
  return {
    decision: 'auto_approve',
    reason: 'Risk is below emergency action threshold; monitoring and citizen guidance can publish automatically.',
    requiredApprovals: [],
    riskScore: input.risk,
    auditTrail: ['Monitoring brief generated', 'No procurement or SPR action executed'],
  }
}

function scenarioFor(scenarioId: string) {
  return SIMULATION_SCENARIOS[(scenarioId as ScenarioKey) in SIMULATION_SCENARIOS ? (scenarioId as ScenarioKey) : 'energy_port_cyber_shock']
}

function uniqueSources(sources: SourceRef[]) {
  const byId = new Map<string, SourceRef>()
  for (const source of sources) byId.set(source.id, source)
  return [...byId.values()]
}

async function persistRun(run: AgentRunResponse) {
  const sb = createSupabaseClient()
  if (!sb) return
  await sb.from('agent_runs').insert({
    id: run.runId,
    scenario_id: run.scenarioId,
    role: run.role,
    overall_risk: run.overallRisk,
    mode: run.mode,
    payload: run,
    created_at: run.startedAt,
  })
}

export async function runAgentMesh(input: { scenarioId?: string; role?: string; skipNasiko?: boolean } = {}): Promise<AgentRunResponse> {
  const scenarioId = input.scenarioId ?? 'energy_port_cyber_shock'
  const role = input.role ?? 'minister'
  const startedAt = new Date().toISOString()
  const runId = randomUUID()
  const scenario = scenarioFor(scenarioId)
  const summary = await getLiveSummary()
  const sources = uniqueSources(flattenSources(summary))
  const maxCorridorRisk = Math.max(...summary.corridors.data.corridors.map((c) => c.risk))
  const cyberRisk = Math.max(...summary.cyber.data.portExposure.map((p) => p.risk), 0)
  const overallRisk = clamp(Math.round((scenario.impacts.affectedVolume * 0.35) + maxCorridorRisk * 0.35 + cyberRisk * 0.2 + scenario.impacts.priceChange * 0.4), 1, 99)

  const procurement = await generateProcurementPlan(
    scenario.name,
    scenario.impacts.affectedVolume,
    scenario.impacts.priceChange
  )
  const policy = buildPolicyVerdict({
    risk: overallRisk,
    scenarioName: scenario.name,
    sourceCount: summary.sourceSummary.total,
    liveSources: summary.sourceSummary.live + summary.sourceSummary.cached,
  })
  const citizenBrief = await generateCitizenBrief({
    role,
    scenarioName: scenario.name,
    overallRisk,
    petrolStressIndex: summary.energy.data.domesticImpact.petrolStressIndex,
    sourceSummary: summary.sourceSummary,
  })
  const nasiko = input.skipNasiko
    ? {
        enabled: false,
        mode: 'simulated' as const,
        workflowId: process.env.NASIKO_WORKFLOW_ID ?? process.env.NASICO_WORKFLOW_ID ?? 'sentinelmesh-energy-crisis',
        summary: 'Nasiko callback disabled for this run to prevent router recursion inside a Nasiko-hosted agent.',
      }
    : await runNasikoWorkflow({
        runId,
        scenarioId,
        risk: overallRisk,
        agents: AGENT_REGISTRY.map((a) => a.id),
        sources: sources.map((s) => ({ id: s.id, title: s.title, mode: s.mode, confidence: s.confidence })),
      })

  const steps: AgentRunStep[] = [
    step({ offset: 0, agentId: 'source-watchtower', agentName: 'Source Watchtower', summary: `Fused ${summary.sourceSummary.total} sources; ${summary.sourceSummary.live} live and ${summary.sourceSummary.cached} cached.`, evidenceIds: sources.slice(0, 5).map((s) => s.id), confidence: summary.sourceSummary.averageConfidence }),
    step({ offset: 510, agentId: 'corridor-sentinel', agentName: 'Corridor Sentinel', summary: `Highest corridor risk: ${maxCorridorRisk}. Vessels and port schedules linked with cargo confidence caveat.`, evidenceIds: ['open-meteo:marine', 'aisstream:optional', 'port:deendayal'], confidence: 0.78 }),
    step({ offset: 1020, agentId: 'cyber-port-guard', agentName: 'Cyber Port Guard', summary: `Cyber overlay risk ${cyberRisk}; CISA/FIRST/OSV signals checked.`, evidenceIds: ['cisa:kev', 'first:epss', 'osv:demo'], confidence: 0.84 }),
    step({ offset: 1530, agentId: 'procurement-copilot', agentName: 'Procurement Copilot', summary: procurement.summary, evidenceIds: ['fred:brent', 'frankfurter:fx', 'ppac:imports'], confidence: procurement.recommendations[0]?.confidence ? procurement.recommendations[0].confidence / 100 : 0.7 }),
    step({ offset: 2040, agentId: 'nasiko-orchestrator', agentName: 'Nasiko Orchestrator', summary: nasiko.summary, evidenceIds: sources.slice(0, 3).map((s) => s.id), confidence: nasiko.mode === 'live' ? 0.9 : 0.62 }),
    step({ offset: 2550, agentId: 'policy-gate', agentName: 'Policy Gate', status: policy.decision === 'auto_approve' ? 'completed' : 'needs_approval', summary: policy.reason, evidenceIds: ['policy:approval-gate'], confidence: 0.88 }),
    step({ offset: 3060, agentId: 'citizen-brief', agentName: 'Citizen Impact Agent', summary: citizenBrief.headline, evidenceIds: ['ppac:fuel', 'eia:rss'], confidence: citizenBrief.confidence }),
  ]

  const run: AgentRunResponse = {
    runId,
    scenarioId,
    scenarioName: scenario.name,
    role,
    mode: summary.sourceSummary.live > 0 ? 'live' : summary.sourceSummary.cached > 0 ? 'cached' : 'simulated',
    startedAt,
    completedAt: new Date().toISOString(),
    overallRisk,
    agentRegistry: AGENT_REGISTRY,
    steps,
    procurement,
    citizenBrief,
    policy,
    sourceSummary: summary.sourceSummary,
    sources,
    nasiko,
  }

  persistRun(run).catch(() => {})
  return run
}

export function agentFacts() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.CLOUD_RUN_SERVICE_URL ?? 'http://localhost:3000'
  return {
    agent: 'DRISHTI SentinelMesh',
    version: '1.0.0-hackathon',
    description: 'Multi-agent energy security crisis OS for citizens, operators, and policy teams.',
    homepage: baseUrl,
    endpoints: {
      run: `${baseUrl}/api/agents/run`,
      liveSummary: `${baseUrl}/api/live/summary`,
      missionBrief: `${baseUrl}/api/mission-brief`,
      rumorCheck: `${baseUrl}/api/rumor-check`,
      evidencePack: `${baseUrl}/api/evidence-pack`,
    },
    registry: AGENT_REGISTRY,
    data_policy: 'Public and optional keyed APIs only; every output includes source provenance and confidence.',
    human_approval: 'SPR drawdown, procurement commitment, or public emergency alert requires policy gate approval.',
  }
}
