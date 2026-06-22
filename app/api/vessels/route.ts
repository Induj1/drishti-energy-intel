import { NextResponse } from 'next/server'
import { MOCK_VESSELS } from '@/lib/mock-data'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const sb = createSupabaseClient()

  if (sb) {
    const { data: existing } = await sb.from('vessels').select('*')

    if (existing && existing.length > 0) {
      // Drift positions to simulate movement and persist back
      const drifted = existing.map((v) => ({
        ...v,
        lat: v.lat + (Math.random() - 0.5) * 0.05,
        lng: v.lng + (Math.random() - 0.5) * 0.05,
        speed: +(v.speed + (Math.random() - 0.5) * 0.4).toFixed(1),
        updated_at: new Date().toISOString(),
      }))
      await sb.from('vessels').upsert(drifted)

      return NextResponse.json({
        vessels: drifted.map((v) => ({
          id: v.id, name: v.name, lat: v.lat, lng: v.lng,
          speed: v.speed, type: v.type, cargo: v.cargo,
          origin: v.origin, destination: v.destination, eta: v.eta,
          riskZone: v.risk_zone,
        })),
        source: 'supabase',
      })
    }

    // Seed vessels table on first run
    const seedRows = MOCK_VESSELS.map((v) => ({
      id: v.id, name: v.name, lat: v.lat, lng: v.lng,
      speed: v.speed, type: v.type, cargo: v.cargo,
      origin: v.origin, destination: v.destination, eta: v.eta,
      risk_zone: v.riskZone,
    }))
    await sb.from('vessels').upsert(seedRows)
  }

  // Fallback: mock with drift
  const animated = MOCK_VESSELS.map((v) => ({
    ...v,
    lat: v.lat + (Math.random() - 0.5) * 0.05,
    lng: v.lng + (Math.random() - 0.5) * 0.05,
    speed: +(v.speed + (Math.random() - 0.5) * 0.4).toFixed(1),
  }))
  return NextResponse.json({ vessels: animated, source: 'mock' })
}
