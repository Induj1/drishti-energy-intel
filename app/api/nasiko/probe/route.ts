import { NextResponse } from 'next/server'
import { runNasikoWorkflow } from '@/lib/nasiko'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await runNasikoWorkflow({
    runId: `probe-${Date.now()}`,
    scenarioId: 'energy_port_cyber_shock',
    risk: 77,
    agents: [
      'source-watchtower',
      'corridor-sentinel',
      'cyber-port-guard',
      'procurement-copilot',
      'policy-gate',
      'citizen-brief',
    ],
    sources: [
      { id: 'ppac:imports', title: 'PPAC crude import signal', mode: 'live', confidence: 0.91 },
      { id: 'cisa:kev', title: 'CISA KEV port cyber overlay', mode: 'live', confidence: 0.86 },
      { id: 'open-meteo:marine', title: 'Open-Meteo corridor weather', mode: 'live', confidence: 0.78 },
    ],
  })

  return NextResponse.json({
    ok: result.mode === 'live',
    result,
  })
}
