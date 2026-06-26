import { API_BASE } from '../constants';

export type DataMode = 'live' | 'cached' | 'simulated' | 'fallback';

export interface SourceRef {
  id: string;
  title: string;
  provider: string;
  url: string;
  mode: DataMode;
  observedAt?: string;
  confidence: number;
  notes?: string;
}

export interface SourceSummary {
  total: number;
  live: number;
  cached: number;
  simulated: number;
  fallback: number;
  averageConfidence: number;
}

export interface Vessel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  type: string;
  cargo: string;
  origin: string;
  destination: string;
  eta: string;
  riskZone: string;
  confidence?: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  risk: number;
  corridor: string;
  sentiment: string;
  url?: string;
}

export interface SimulationImpacts {
  priceChange: number;
  transitDelayDays: number;
  affectedVolume: number;
  sprDaysRemaining: number;
  gdpImpact: number;
  powerSectorStress: number;
}

export interface ProcurementRecommendation {
  supplier: string;
  volume: string;
  route: string;
  cost: string;
  timeline: string;
  confidence: number;
}

export interface ProcurementPlan {
  summary: string;
  recommendations: ProcurementRecommendation[];
}

export interface CitizenBrief {
  headline: string;
  impact: string;
  actions: string[];
  priceSignal: string;
  confidence: number;
}

export interface PolicyVerdict {
  decision: 'auto_approve' | 'human_review' | 'block';
  reason: string;
  requiredApprovals: string[];
  riskScore: number;
  auditTrail: string[];
}

export interface AgentRunStep {
  id: string;
  agentId: string;
  agentName: string;
  status: 'queued' | 'running' | 'completed' | 'needs_approval' | 'failed';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  summary: string;
  evidenceIds: string[];
  confidence: number;
}

export interface AgentRunResponse {
  runId: string;
  scenarioId: string;
  scenarioName: string;
  role: string;
  mode: DataMode;
  startedAt: string;
  completedAt: string;
  overallRisk: number;
  steps: AgentRunStep[];
  procurement: ProcurementPlan;
  citizenBrief: CitizenBrief;
  policy: PolicyVerdict;
  sourceSummary: SourceSummary;
  sources: SourceRef[];
  nasiko: {
    enabled: boolean;
    mode: DataMode;
    workflowId: string;
    summary: string;
    traceUrl?: string;
    routerUrl?: string;
    sessionId?: string;
    events?: string[];
  };
}

export interface SimulationResult {
  scenario: {
    name: string;
    icon: string;
    impacts: SimulationImpacts;
  };
  procurement: ProcurementPlan;
  agentRun?: AgentRunResponse;
  timestamp?: string;
}

export interface SPRData {
  currentLevel: number;
  maxCapacity: number;
  daysRemaining: number;
  fillRate: number;
  lastUpdated: string;
  strategicBuffer: number;
}

interface LiveEnvelope<T> {
  ok: boolean;
  dataMode: DataMode;
  updatedAt: string;
  ttlSeconds: number;
  sources: SourceRef[];
  warnings: string[];
  data: T;
}

export interface LiveSummary {
  energy: LiveEnvelope<{
    brent: { date: string; usdPerBarrel: number; changeLabel: string };
    fx: { pair: string; rate: number; date: string };
    ppacImport: {
      financialYear: string;
      crudeThousandMt: number;
      netImportThousandMt: number;
      period: string;
      lastUpdated: string;
    };
    fuelPrices: {
      city: string;
      petrolInrPerLitre: number;
      dieselInrPerLitre: number;
      observedOn: string;
    };
    domesticImpact: {
      crudeInrPerBarrel: number;
      petrolStressIndex: number;
      importDependence: string;
    };
  }>;
  corridors: LiveEnvelope<{
    corridors: Array<{
      id: string;
      name: string;
      risk: number;
      waveHeightM: number;
      windKph: number;
      visibilityM: number;
      chokepointVolume: string;
      signal: string;
    }>;
  }>;
  cyber: LiveEnvelope<{
    cisaKevCount: number;
    recentKev: Array<{
      cveID: string;
      vendorProject: string;
      product: string;
      vulnerabilityName: string;
      dueDate?: string;
    }>;
    epss: Array<{ cve: string; epss: number; percentile: number }>;
    osvDemo: Array<{ id: string; summary: string }>;
    portExposure: Array<{ asset: string; status: string; risk: number }>;
  }>;
  news: LiveEnvelope<{ items: NewsItem[] }>;
  vessels: LiveEnvelope<{
    vessels: Vessel[];
    aisConfigured: boolean;
    portSchedules: Array<{ port: string; title: string; url: string }>;
    caveat: string;
  }>;
  sourceSummary: SourceSummary;
}

export interface MissionBrief {
  runId: string;
  scenarioName: string;
  role: string;
  overallRisk: number;
  citizenBrief: CitizenBrief;
  procurement: ProcurementPlan;
  policy: PolicyVerdict;
  sources: SourceRef[];
}

export interface RumorVerdict {
  claim: string;
  verdict: string;
  explanation: string;
  confidence: number;
  nextAction: string;
  evidence?: SourceRef[];
}

export interface NasikoProbe {
  ok: boolean;
  sponsor?: string;
  mode?: string;
  cloudRun?: boolean;
  summary?: string;
  agentPackage?: string;
  workflowId?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchVessels(): Promise<Vessel[]> {
  const data = await apiFetch<{ vessels: Vessel[] }>('/api/vessels');
  return data.vessels;
}

export async function fetchNews(): Promise<NewsItem[]> {
  const data = await apiFetch<{ news: NewsItem[] }>('/api/news');
  return data.news;
}

export async function triggerSimulation(
  scenarioId: string,
  role = 'minister'
): Promise<SimulationResult> {
  return apiFetch<SimulationResult>('/api/simulate', {
    method: 'POST',
    body: JSON.stringify({ scenarioId, role }),
  });
}

export async function resetSimulation(): Promise<void> {
  await apiFetch<unknown>('/api/simulate', { method: 'DELETE' });
}

export async function fetchSPR(): Promise<SPRData> {
  return apiFetch<SPRData>('/api/spr');
}

export async function fetchLiveSummary(): Promise<LiveSummary> {
  return apiFetch<LiveSummary>('/api/live/summary');
}

export async function runAgentMesh(
  scenarioId = 'energy_port_cyber_shock',
  role = 'minister'
): Promise<AgentRunResponse> {
  return apiFetch<AgentRunResponse>('/api/agents/run', {
    method: 'POST',
    body: JSON.stringify({ scenarioId, role }),
  });
}

export async function fetchMissionBrief(
  scenarioId = 'energy_port_cyber_shock',
  role = 'citizen'
): Promise<MissionBrief> {
  return apiFetch<MissionBrief>(
    `/api/mission-brief?role=${encodeURIComponent(role)}&scenarioId=${encodeURIComponent(
      scenarioId
    )}`
  );
}

export async function checkRumor(claim: string): Promise<RumorVerdict> {
  return apiFetch<RumorVerdict>('/api/rumor-check', {
    method: 'POST',
    body: JSON.stringify({ claim }),
  });
}

export async function fetchNasikoProbe(): Promise<NasikoProbe> {
  return apiFetch<NasikoProbe>('/api/nasiko/probe');
}
