import { NextResponse } from 'next/server'
import { SIMULATION_SCENARIOS } from '@/lib/mock-data'
import { runAgentMesh } from '@/lib/agents'
import { generateProcurementPlan } from '@/lib/ai'
import { createSupabaseClient } from '@/lib/supabase'
import { broadcastCrisisAlert } from '@/telegram/bot'

const RISK_MAP: Record<string, number> = {
  hormuz_closure: 94, redsea_shutdown: 72, opec_cut: 65, energy_port_cyber_shock: 97, combined_crisis: 99
}

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
  const agentRun = await runAgentMesh({ scenarioId, role: body.role ?? 'minister' })

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

  // Fire-and-forget Telegram broadcast (non-blocking)
  broadcastCrisisAlert(
    scenario.name,
    scenario.icon,
    RISK_MAP[scenarioId] ?? 50,
    scenario.impacts.priceChange,
    scenario.impacts.affectedVolume
  ).catch(() => {})

  return NextResponse.json({
    scenario,
    procurement,
    agentRun,
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
