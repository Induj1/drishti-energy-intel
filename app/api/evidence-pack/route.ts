import { NextResponse } from 'next/server'
import { runAgentMesh } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const scenarioId = url.searchParams.get('scenarioId') ?? 'energy_port_cyber_shock'
  const run = await runAgentMesh({ scenarioId, role: 'judge' })
  const markdown = [
    `# DRISHTI Evidence Pack`,
    ``,
    `Run: ${run.runId}`,
    `Scenario: ${run.scenarioName}`,
    `Overall risk: ${run.overallRisk}/100`,
    `Mode: ${run.mode}`,
    ``,
    `## Agent Steps`,
    ...run.steps.map((s) => `- ${s.agentName}: ${s.summary} (${Math.round(s.confidence * 100)}% confidence)`),
    ``,
    `## Sources`,
    ...run.sources.map((s) => `- ${s.title} - ${s.provider} - ${s.mode} - ${Math.round(s.confidence * 100)}% - ${s.url}`),
    ``,
    `## Policy Gate`,
    `${run.policy.decision}: ${run.policy.reason}`,
  ].join('\n')

  return NextResponse.json({ run, markdown })
}
