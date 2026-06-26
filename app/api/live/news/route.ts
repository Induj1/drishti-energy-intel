import { NextResponse } from 'next/server'
import { getNewsSnapshot } from '@/lib/live-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getNewsSnapshot())
}
