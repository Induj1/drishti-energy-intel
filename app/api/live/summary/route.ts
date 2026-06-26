import { NextResponse } from 'next/server'
import { getLiveSummary } from '@/lib/live-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getLiveSummary())
}
