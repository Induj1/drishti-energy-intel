export type DataMode = 'live' | 'cached' | 'simulated' | 'fallback'

export type SourceRef = {
  id: string
  title: string
  provider: string
  url: string
  mode: DataMode
  observedAt: string
  confidence: number
  notes?: string
}

export type LiveEnvelope<T> = {
  ok: boolean
  dataMode: DataMode
  updatedAt: string
  ttlSeconds: number
  sources: SourceRef[]
  warnings: string[]
  data: T
}

export type ProcurementPlan = {
  summary: string
  recommendations: Array<{
    supplier: string
    volume: string
    route: string
    cost: string
    timeline: string
    confidence: number
  }>
}

export type CitizenBrief = {
  headline: string
  impact: string
  actions: string[]
  priceSignal: string
  confidence: number
}

export type PolicyVerdict = {
  decision: 'auto_approve' | 'human_review' | 'block'
  reason: string
  requiredApprovals: string[]
  riskScore: number
  auditTrail: string[]
}

export type AgentDefinition = {
  id: string
  name: string
  role: string
  model: string
  tools: string[]
  owner: string
  handoffTo?: string[]
}

export type AgentRunStep = {
  id: string
  agentId: string
  agentName: string
  status: 'queued' | 'running' | 'completed' | 'needs_approval' | 'failed'
  startedAt: string
  completedAt: string
  durationMs: number
  summary: string
  evidenceIds: string[]
  confidence: number
}

export type SourceSummary = {
  total: number
  live: number
  cached: number
  simulated: number
  fallback: number
  averageConfidence: number
}

export type AgentRunResponse = {
  runId: string
  scenarioId: string
  scenarioName: string
  role: string
  mode: DataMode
  startedAt: string
  completedAt: string
  overallRisk: number
  agentRegistry: AgentDefinition[]
  steps: AgentRunStep[]
  procurement: ProcurementPlan
  citizenBrief: CitizenBrief
  policy: PolicyVerdict
  sourceSummary: SourceSummary
  sources: SourceRef[]
  nasiko: {
    enabled: boolean
    mode: DataMode
    workflowId: string
    summary: string
    traceUrl?: string
    routerUrl?: string
    sessionId?: string
    events?: string[]
  }
}
