import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type DbVessel = {
  id: string
  name: string
  lat: number
  lng: number
  speed: number
  type: string
  cargo: string
  origin: string
  destination: string
  eta: string
  risk_zone: string
  updated_at: string
}

export type SimulationRow = {
  id: number
  scenario_id: string
  scenario_data: Record<string, unknown>
  procurement_data: Record<string, unknown>
  active: boolean
  triggered_at: string
}

export type RiskFeedRow = {
  id: string
  headline: string
  source: string
  corridor: string
  risk_score: number
  time_label: string
  created_at: string
}

export function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your_supabase_url_here') return null
  return createClient(url, key)
}
