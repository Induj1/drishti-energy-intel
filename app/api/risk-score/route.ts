import { NextResponse } from 'next/server'
import { scoreGeopoliticalRisk } from '@/lib/openai'

export async function POST(req: Request) {
  const { headline, corridor } = await req.json()
  const result = await scoreGeopoliticalRisk(headline, corridor)
  return NextResponse.json(result)
}
