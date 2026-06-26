import { NextResponse } from 'next/server'
import { buildPolicyVerdict } from '@/lib/agents'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    risk?: number
    scenarioName?: string
    sourceCount?: number
    liveSources?: number
  }

  return NextResponse.json(buildPolicyVerdict({
    risk: body.risk ?? 82,
    scenarioName: body.scenarioName ?? 'Energy Port Cyber Shock',
    sourceCount: body.sourceCount ?? 10,
    liveSources: body.liveSources ?? 7,
  }))
}
