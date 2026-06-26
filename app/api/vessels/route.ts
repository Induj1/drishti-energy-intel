import { NextResponse } from 'next/server'
import { getVesselSnapshot } from '@/lib/live-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await getVesselSnapshot()
  return NextResponse.json({
    vessels: snapshot.data.vessels,
    source: snapshot.dataMode,
    sources: snapshot.sources,
    warnings: snapshot.warnings,
  })
}
