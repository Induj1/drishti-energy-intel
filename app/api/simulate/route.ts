import { NextResponse } from 'next/server'
import { SIMULATION_SCENARIOS } from '@/lib/mock-data'
import { generateProcurementPlan } from '@/lib/openai'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  const { scenarioId } = body
  const scenario = SIMULATION_SCENARIOS[scenarioId as keyof typeof SIMULATION_SCENARIOS]

  if (!scenario) {
    return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 })
  }

  const procurement = await generateProcurementPlan(
    scenario.name,
    scenario.impacts.affectedVolume,
    scenario.impacts.priceChange
  )

  // Broadcast crisis to all connected clients via Supabase real-time
  const sb = createSupabaseClient()
  if (sb) {
    await sb.from('simulation_results').update({ active: false }).eq('active', true)
    await sb.from('simulation_results').insert({
      scenario_id: scenarioId,
      scenario_data: scenario,
      procurement_data: procurement,
      active: true,
    })
  }

  return NextResponse.json({
    scenario,
    procurement,
    timestamp: new Date().toISOString(),
  })
}

export async function DELETE() {
  const sb = createSupabaseClient()
  if (sb) {
    await sb.from('simulation_results').update({ active: false }).eq('active', true)
  }
  return NextResponse.json({ reset: true })
}
