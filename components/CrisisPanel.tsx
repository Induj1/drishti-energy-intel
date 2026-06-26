'use client'

import { useState } from 'react'
import { AlertTriangle, Zap, TrendingUp, Globe } from 'lucide-react'
import { SIMULATION_SCENARIOS } from '@/lib/mock-data'
import { apiFetch } from '@/lib/client-api'

interface CrisisPanelProps {
  onSimulate: (scenarioId: string, data: unknown) => void
  activeScenario: string | null
}

const ICONS: Record<string, React.ReactNode> = {
  hormuz_closure: <Globe className="w-4 h-4" />,
  redsea_shutdown: <AlertTriangle className="w-4 h-4" />,
  opec_cut: <TrendingUp className="w-4 h-4" />,
  combined_crisis: <Zap className="w-4 h-4" />,
}

const COLORS: Record<string, string> = {
  hormuz_closure: 'border-red-500 hover:bg-red-500/10',
  redsea_shutdown: 'border-orange-500 hover:bg-orange-500/10',
  opec_cut: 'border-yellow-500 hover:bg-yellow-500/10',
  combined_crisis: 'border-purple-500 hover:bg-purple-500/10',
}

const ACTIVE_COLORS: Record<string, string> = {
  hormuz_closure: 'bg-red-500/20 border-red-500 text-red-400',
  redsea_shutdown: 'bg-orange-500/20 border-orange-500 text-orange-400',
  opec_cut: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  combined_crisis: 'bg-purple-500/20 border-purple-500 text-purple-400',
}

export default function CrisisPanel({ onSimulate, activeScenario }: CrisisPanelProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSimulate = async (scenarioId: string) => {
    if (loading) return
    setLoading(scenarioId)
    try {
      const res = await apiFetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      })
      const data = await res.json()
      onSimulate(scenarioId, data)
    } catch {
      onSimulate(scenarioId, { scenario: SIMULATION_SCENARIOS[scenarioId as keyof typeof SIMULATION_SCENARIOS] })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-[#0a0e1a]/90 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">Crisis Simulation</h3>
        {activeScenario && (
          <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
            ACTIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.values(SIMULATION_SCENARIOS).map((s) => (
          <button
            key={s.id}
            onClick={() => handleSimulate(s.id)}
            disabled={loading === s.id}
            className={`relative p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer
              ${activeScenario === s.id ? ACTIVE_COLORS[s.id] : `border-slate-700 text-slate-400 ${COLORS[s.id]}`}
            `}
          >
            {loading === s.id && (
              <div className="absolute inset-0 bg-slate-900/50 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{s.icon}</span>
              {ICONS[s.id]}
            </div>
            <p className="text-xs font-semibold leading-tight">{s.name}</p>
            <p className="text-[10px] mt-1 opacity-60 leading-tight">{s.description}</p>
            {activeScenario === s.id && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>Price Impact</span>
                  <span className="text-red-400 font-bold">+{s.impacts.priceChange}%</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Delay</span>
                  <span className="text-orange-400">{s.impacts.transitDelayDays > 0 ? `+${s.impacts.transitDelayDays} days` : 'Immediate'}</span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSimulate('reset', null)}
        className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 py-2 border border-slate-800 rounded-lg hover:border-slate-600 transition-colors cursor-pointer"
      >
        Reset to Normal Operations
      </button>
    </div>
  )
}
