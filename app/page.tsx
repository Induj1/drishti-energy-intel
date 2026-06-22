'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import CrisisPanel from '@/components/CrisisPanel'
import RiskFeed from '@/components/RiskFeed'
import SPRCountdown from '@/components/SPRCountdown'
import ProcurementPanel from '@/components/ProcurementPanel'
import VesselTable from '@/components/VesselTable'
import { Shield, Activity, Wifi, Radio } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

interface Vessel {
  id: string; name: string; lat: number; lng: number
  speed: number; type: string; cargo: string
  origin: string; destination: string; eta: string; riskZone: string
}

interface SimulationResult {
  scenario?: {
    name: string
    impacts: {
      priceChange: number; transitDelayDays: number
      affectedVolume: number; sprDaysRemaining: number
      gdpImpact: number; powerSectorStress: number
    }
    alternatives: Array<{ route: string; viability: number; extraDays: number; extraCost: string; capacity: string }>
  }
  procurement?: {
    summary: string
    recommendations: Array<{ supplier: string; volume: string; route: string; cost: string; timeline: string; confidence: number }>
  }
}

const RISK_MAP: Record<string, number> = {
  hormuz_closure: 94, redsea_shutdown: 72, opec_cut: 65, combined_crisis: 99
}

export default function WarRoom() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [overallRisk, setOverallRisk] = useState(42)
  const [activeTab, setActiveTab] = useState<'procurement' | 'vessels'>('procurement')
  const [liveViewers, setLiveViewers] = useState(1)
  const [rtConnected, setRtConnected] = useState(false)
  const sbRef = useRef<SupabaseClient | null>(null)

  const fetchVessels = useCallback(async () => {
    try {
      const res = await fetch('/api/vessels')
      const data = await res.json()
      setVessels(data.vessels)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchVessels()
    const interval = setInterval(fetchVessels, 8000)
    return () => clearInterval(interval)
  }, [fetchVessels])

  // Supabase real-time: crisis broadcast + presence
  useEffect(() => {
    const sb = createSupabaseClient()
    if (!sb) return
    sbRef.current = sb

    // Subscribe to crisis simulation broadcasts
    const simChannel = sb
      .channel('simulation_results')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'simulation_results' },
        (payload) => {
          const row = payload.new as {
            scenario_id: string
            scenario_data: SimulationResult['scenario']
            procurement_data: SimulationResult['procurement']
            active: boolean
          }
          if (row.active && row.scenario_id !== activeScenario) {
            setActiveScenario(row.scenario_id)
            setSimulationResult({ scenario: row.scenario_data, procurement: row.procurement_data })
            setOverallRisk(RISK_MAP[row.scenario_id] ?? 50)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'simulation_results' },
        (payload) => {
          const row = payload.new as { active: boolean }
          if (!row.active) {
            setActiveScenario(null)
            setSimulationResult(null)
            setOverallRisk(42)
          }
        }
      )
      .subscribe((status) => setRtConnected(status === 'SUBSCRIBED'))

    // Presence: live viewer count
    const presenceKey = Math.random().toString(36).slice(2)
    const presenceChannel = sb.channel('war_room', {
      config: { presence: { key: presenceKey } },
    })
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setLiveViewers(Object.keys(presenceChannel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ joined_at: new Date().toISOString() })
        }
      })

    return () => {
      sb.removeChannel(simChannel)
      sb.removeChannel(presenceChannel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSimulate = useCallback(async (scenarioId: string, data: unknown) => {
    if (scenarioId === 'reset') {
      setActiveScenario(null)
      setSimulationResult(null)
      setOverallRisk(42)
      await fetch('/api/simulate', { method: 'DELETE' }).catch(() => {})
      return
    }
    setActiveScenario(scenarioId)
    setSimulationResult(data as SimulationResult)
    setOverallRisk(RISK_MAP[scenarioId] ?? 50)
  }, [])

  const riskColor = overallRisk >= 80 ? '#ef4444' : overallRisk >= 60 ? '#f97316' : overallRisk >= 40 ? '#eab308' : '#22c55e'
  const riskLabel = overallRisk >= 80 ? 'CRITICAL' : overallRisk >= 60 ? 'HIGH' : overallRisk >= 40 ? 'ELEVATED' : 'NORMAL'

  return (
    <div className="h-screen flex flex-col bg-[#050914] overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-800 bg-[#080c18]/80 backdrop-blur-sm px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <span className="text-sm">🛢️</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-orange-400 tracking-widest">DRISHTI</h1>
            <p className="text-[9px] text-slate-600 tracking-widest uppercase">India Energy Security Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-4 px-3 py-1 rounded-full border" style={{ borderColor: `${riskColor}40`, background: `${riskColor}10` }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: riskColor }} />
          <span className="text-xs font-bold" style={{ color: riskColor }}>{riskLabel}</span>
          <span className="text-[10px] text-slate-500 ml-1">RISK</span>
          <span className="text-xs font-bold ml-1" style={{ color: riskColor }}>{overallRisk}</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {rtConnected && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-400 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>LIVE SYNC</span>
              <span className="text-slate-500">· {liveViewers} analyst{liveViewers !== 1 ? 's' : ''} online</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Wifi className="w-3 h-3 text-green-400" />
            <span>{vessels.length} vessels tracked</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Activity className="w-3 h-3 text-blue-400" />
            <span>AI Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Shield className="w-3 h-3 text-orange-400" />
            <span>MoPNG Dashboard</span>
          </div>
          <span className="text-[10px] text-slate-600">{new Date().toUTCString().slice(0, 25)}</span>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column */}
        <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col gap-3 p-3 overflow-y-auto">
          <SPRCountdown
            crisisActive={!!activeScenario}
            priceImpact={simulationResult?.scenario?.impacts.priceChange ?? 0}
          />
          <CrisisPanel onSimulate={handleSimulate} activeScenario={activeScenario} />
        </div>

        {/* Globe center */}
        <div className="flex-1 relative">
          <Globe
            vessels={vessels}
            simulation={{ active: !!activeScenario, scenarioId: activeScenario, rerouting: false }}
            onVesselClick={setSelectedVessel}
          />

          {/* Corridor risk badges */}
          <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
            {[
              { label: 'Hormuz', risk: 78, color: '#ef4444' },
              { label: 'Red Sea', risk: 65, color: '#f97316' },
              { label: 'Cape', risk: 12, color: '#22c55e' },
            ].map((r) => (
              <div key={r.label} className="bg-[#0a0e1a]/90 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                <span className="text-[10px] text-slate-400">{r.label}</span>
                <span className="text-[10px] font-bold" style={{ color: r.color }}>{r.risk}</span>
              </div>
            ))}
          </div>

          {/* Vessel selected popup */}
          {selectedVessel && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0a0e1a]/95 border border-orange-500/30 rounded-xl p-4 min-w-64 max-w-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-orange-400">{selectedVessel.name}</p>
                  <p className="text-[10px] text-slate-500">{selectedVessel.type} · {selectedVessel.cargo}</p>
                </div>
                <button onClick={() => setSelectedVessel(null)} className="text-slate-600 hover:text-slate-400 text-lg leading-none cursor-pointer">×</button>
              </div>
              <div className="mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">From</span><span className="text-slate-300">{selectedVessel.origin}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">To</span><span className="text-slate-300">{selectedVessel.destination}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">ETA</span><span className="text-slate-300">{selectedVessel.eta}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Speed</span><span className="text-slate-300">{selectedVessel.speed.toFixed(1)} knots</span></div>
              </div>
            </div>
          )}

          {/* Crisis alert banner */}
          {activeScenario && simulationResult?.scenario && (
            <div className="absolute top-4 right-4 max-w-xs bg-red-500/10 border border-red-500/40 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-xs font-bold text-red-400">CRISIS SIMULATION ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-300">{simulationResult.scenario.name}</p>
              <p className="text-[10px] text-red-400 mt-1 font-bold">
                Brent +{simulationResult.scenario.impacts.priceChange}% · {simulationResult.scenario.impacts.affectedVolume}% supply affected
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="w-80 shrink-0 border-l border-slate-800 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-800">
            {(['procurement', 'vessels'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-colors cursor-pointer
                  ${activeTab === tab ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {tab === 'procurement' ? 'AI Procurement' : 'Vessels'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'procurement' ? (
              <div className="space-y-3">
                <ProcurementPanel simulationResult={simulationResult} activeScenario={activeScenario} />
              </div>
            ) : (
              <VesselTable vessels={vessels} selectedVessel={selectedVessel} crisisActive={!!activeScenario} />
            )}
          </div>
          <div className="border-t border-slate-800 p-3">
            <RiskFeed />
          </div>
        </div>
      </div>
    </div>
  )
}
