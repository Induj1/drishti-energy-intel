import { NextResponse } from 'next/server'
import { runAgentMesh } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { scenarioId?: string; role?: string; skipNasiko?: boolean }
  const run = await runAgentMesh({ scenarioId: body.scenarioId, role: body.role, skipNasiko: body.skipNasiko })
  return NextResponse.json(run)
}

export async function GET() {
  const run = await runAgentMesh()
  return NextResponse.json(run)
}
