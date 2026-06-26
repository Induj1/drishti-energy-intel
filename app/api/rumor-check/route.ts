import { NextResponse } from 'next/server'
import { verifyRumorClaim } from '@/lib/ai'
import { getLiveSummary } from '@/lib/live-data'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { claim?: string }
  const claim = body.claim?.trim() || 'Fuel pumps are closing nationwide tonight'
  const [verdict, summary] = await Promise.all([verifyRumorClaim(claim), getLiveSummary()])
  return NextResponse.json({
    claim,
    ...verdict,
    evidence: [
      summary.energy.sources.find((s) => s.id === 'ppac:fuel'),
      summary.news.sources[0],
    ].filter(Boolean),
  })
}
