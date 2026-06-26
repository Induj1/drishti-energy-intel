import { NextResponse } from 'next/server'
import { getCyberSnapshot } from '@/lib/live-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getCyberSnapshot())
}
