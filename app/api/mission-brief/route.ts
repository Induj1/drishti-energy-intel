import { NextResponse } from 'next/server'
import { runAgentMesh } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const role = url.searchParams.get('role') ?? 'citizen'
  const scenarioId = url.searchParams.get('scenarioId') ?? 'energy_port_cyber_shock'
  const run = await runAgentMesh({ role, scenarioId })
  return NextResponse.json({
    runId: run.runId,
    scenarioName: run.scenarioName,
    role,
    overallRisk: run.overallRisk,
    citizenBrief: run.citizenBrief,
    procurement: run.procurement,
    policy: run.policy,
    sources: run.sources.slice(0, 8),
  })
}
