import { NextResponse } from 'next/server'
import { getNewsSnapshot } from '@/lib/live-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await getNewsSnapshot()
  return NextResponse.json({
    news: snapshot.data.items,
    source: snapshot.dataMode,
    sources: snapshot.sources,
    warnings: snapshot.warnings,
  })
}
