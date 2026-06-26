import { NextResponse } from 'next/server'
import { agentFacts } from '@/lib/agents'

export function GET() {
  return NextResponse.json(agentFacts())
}
