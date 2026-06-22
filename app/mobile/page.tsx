'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Shield, Activity, AlertTriangle, TrendingUp, Zap, Globe, Radio } from 'lucide-react'

interface SimResult {
  scenario?: { name: string; icon: string; impacts: { priceChange: number; affectedVolume: number; transitDelayDays: number; sprDaysRemaining: number } }
  procurement?: { summary: string }
}

const RISK_MAP: Record<string, number> = {
  hormuz_closure: 94, redsea_shutdown: 72, opec_cut: 65, combined_crisis: 99
}

const BASE_BRENT = 87.42

const SCENARIOS = [
  { id: 'hormuz_closure', icon: '🔴', label: 'Hormuz Closure', color: 'border-red-500 bg-red-500/10 text-red-400' },
  { id: 'redsea_shutdown', icon: '🟠', label: 'Red Sea Shutdown', color: 'border-orange-500 bg-orange-500/10 text-orange-400' },
  { id: 'opec_cut', icon: '🟡', label: 'OPEC+ Cut', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400' },
  { id: 'combined_crisis', icon: '⚫', label: 'Combined Crisis', color: 'border-purple-500 bg-purple-500/10 text-purple-400' },
]

export default function MobileWarRoom() {
  const [brent, setBrent] = useState(BASE_BRENT)
  const [vesselCount, setVesselCount] = useState(12)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [simResult, setSimResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [overallRisk, setOverallRisk] = useState(58)
  const [news, setNews] = useState<Array<{ id: number; headline: string; source: string; risk: number }>>([])
  const tRef = useRef(0)

  // Live Brent price
  useEffect(() => {
    const target = activeScenario && simResult?.scenario
      ? BASE_BRENT * (1 + simResult.scenario.impacts.priceChange / 100)
      : BASE_BRENT
    const id = setInterval(() => {
      tRef.current += 1
      setBrent(prev => +(prev + (target - prev) * (activeScenario ? 0.18 : 0.05) + (Math.random() - 0.5) * 0.45).toFixed(2))
    }, 1600)
    return () => clearInterval(id)
  }, [activeScenario, simResult])

  // Fetch live data
  useEffect(() => {
    fetch('/api/vessels').then(r => r.json()).then(d => setVesselCount(d.vessels?.length ?? 12)).catch(() => {})
    fetch('/api/news').then(r => r.json()).then(d => setNews((d.news ?? []).slice(0, 4))).catch(() => {})
  }, [])

  const triggerScenario = useCallback(async (scenarioId: string) => {
    if (loading) return
    setLoading(scenarioId)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      })
      const data = await res.json()
      setActiveScenario(scenarioId)
      setSimResult(data)
      setOverallRisk(RISK_MAP[scenarioId] ?? 50)
    } catch {
      setActiveScenario(scenarioId)
      setOverallRisk(RISK_MAP[scenarioId] ?? 50)
    } finally {
      setLoading(null)
    }
  }, [loading])

  const reset = useCallback(async () => {
    setActiveScenario(null)
    setSimResult(null)
    setOverallRisk(58)
    await fetch('/api/simulate', { method: 'DELETE' }).catch(() => {})
  }, [])

  const riskColor = overallRisk >= 80 ? '#ef4444' : overallRisk >= 60 ? '#f97316' : '#eab308'
  const riskLabel = overallRisk >= 80 ? 'CRITICAL' : overallRisk >= 60 ? 'HIGH' : 'ELEVATED'
  const brentChange = brent - BASE_BRENT

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#080c18]/90 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🛢️</span>
        <div>
          <h1 className="text-sm font-black text-orange-400 tracking-widest leading-none">DRISHTI</h1>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Mobile War Room</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full border" style={{ borderColor: `${riskColor}40`, background: `${riskColor}10` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: riskColor }} />
            <span className="text-[10px] font-bold" style={{ color: riskColor }}>{riskLabel} {overallRisk}</span>
          </div>
          <a href="https://drishti-intel.vercel.app" className="text-[10px] text-slate-500 hover:text-slate-300">Desktop →</a>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Brent + SPR row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
            <TrendingUp className="w-4 h-4 text-orange-400 mb-1" />
            <p className="text-2xl font-black tabular-nums" style={{ color: activeScenario ? '#ef4444' : '#f97316' }}>
              ${brent.toFixed(2)}
            </p>
            <p className="text-[9px] text-slate-500">Brent / bbl</p>
            <p className={`text-[10px] font-bold mt-0.5 ${brentChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
              {brentChange >= 0 ? '▲' : '▼'} {brentChange >= 0 ? '+' : ''}{((brentChange / BASE_BRENT) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
            <Shield className="w-4 h-4 text-yellow-400 mb-1" />
            <p className="text-2xl font-black text-yellow-400">
              {activeScenario && simResult?.scenario ? simResult.scenario.impacts.sprDaysRemaining : 9.5}d
            </p>
            <p className="text-[9px] text-slate-500">SPR cover</p>
            <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${((activeScenario && simResult?.scenario ? simResult.scenario.impacts.sprDaysRemaining : 9.5) / 30) * 100}%`, background: '#eab308' }}
              />
            </div>
          </div>
        </div>

        {/* Live metrics strip */}
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-3 flex justify-between text-center">
          <div>
            <p className="text-lg font-black text-blue-400">{vesselCount}</p>
            <p className="text-[9px] text-slate-500">Vessels</p>
          </div>
          <div>
            <p className="text-lg font-black text-red-400">78</p>
            <p className="text-[9px] text-slate-500">Hormuz</p>
          </div>
          <div>
            <p className="text-lg font-black text-orange-400">65</p>
            <p className="text-[9px] text-slate-500">Red Sea</p>
          </div>
          <div>
            <p className="text-lg font-black text-green-400">12</p>
            <p className="text-[9px] text-slate-500">Cape</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Radio className="w-4 h-4 text-green-400 animate-pulse" />
            <p className="text-[9px] text-slate-500">Live</p>
          </div>
        </div>

        {/* Crisis simulation */}
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Crisis Simulation</h2>
            {activeScenario && (
              <span className="ml-auto text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                ACTIVE
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => triggerScenario(s.id)}
                disabled={loading === s.id}
                className={`relative p-3 rounded-lg border text-left transition-all active:scale-95 cursor-pointer
                  ${activeScenario === s.id ? s.color : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                {loading === s.id && (
                  <div className="absolute inset-0 rounded-lg bg-slate-900/60 flex items-center justify-center">
                    <div className="w-4 h-4 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <p className="text-base mb-1">{s.icon}</p>
                <p className="text-xs font-semibold leading-tight">{s.label}</p>
              </button>
            ))}
          </div>
          <button
            onClick={reset}
            className="mt-3 w-full py-2 text-xs text-slate-600 hover:text-slate-400 border border-slate-800 rounded-lg hover:border-slate-600 transition-colors cursor-pointer"
          >
            Reset to Normal
          </button>
        </div>

        {/* AI Summary */}
        {activeScenario && simResult?.scenario && (
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-red-400">SIMULATION ACTIVE</span>
            </div>
            <p className="text-sm font-bold text-white mb-2">{simResult.scenario.icon} {simResult.scenario.name}</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <p className="text-lg font-black text-red-400">+{simResult.scenario.impacts.priceChange}%</p>
                <p className="text-[9px] text-slate-500">Brent</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-orange-400">{simResult.scenario.impacts.affectedVolume}%</p>
                <p className="text-[9px] text-slate-500">Supply Hit</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-yellow-400">+{simResult.scenario.impacts.transitDelayDays}d</p>
                <p className="text-[9px] text-slate-500">Delay</p>
              </div>
            </div>
            {simResult.procurement?.summary && (
              <p className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 leading-relaxed">
                {simResult.procurement.summary}
              </p>
            )}
          </div>
        )}

        {/* Risk feed */}
        {news.length > 0 && (
          <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-orange-400" />
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Intelligence Feed</h2>
            </div>
            <div className="space-y-3">
              {news.map(n => (
                <div key={n.id} className="border-l-2 border-orange-500/40 pl-3">
                  <p className="text-[11px] text-slate-300 leading-tight">{n.headline}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">{n.source} · Risk {n.risk}/100</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="grid grid-cols-2 gap-3 pb-6">
          <a
            href="https://drishti-intel.vercel.app"
            className="py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center text-xs font-bold text-orange-400"
          >
            🌍 Full War Room
          </a>
          <a
            href="/nfc"
            className="py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-xs font-bold text-slate-400"
          >
            📱 NFC Briefing
          </a>
        </div>
      </div>
    </div>
  )
}
