'use client'

import { useEffect, useState } from 'react'
import { INDIA_IMPORT_STATS } from '@/lib/mock-data'

interface SPRCountdownProps {
  crisisActive: boolean
  priceImpact: number
}

export default function SPRCountdown({ crisisActive, priceImpact }: SPRCountdownProps) {
  const [brent, setBrent] = useState(INDIA_IMPORT_STATS.brentPrice)
  const [sprDays, setSprDays] = useState(INDIA_IMPORT_STATS.sprDays)
  const [tick, setTick] = useState(0)
  const [updatedAt, setUpdatedAt] = useState('SYNCING')

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
      setUpdatedAt(new Date().toLocaleTimeString())
      // Simulate live price movement
      setBrent(() => {
        const base = crisisActive
          ? INDIA_IMPORT_STATS.brentPrice * (1 + priceImpact / 100)
          : INDIA_IMPORT_STATS.brentPrice
        return +(base + (Math.random() - 0.5) * 0.8).toFixed(2)
      })
      // Drain SPR slowly during crisis
      if (crisisActive) {
        setSprDays(d => Math.max(0, +(d - 0.002).toFixed(3)))
      } else {
        setSprDays(INDIA_IMPORT_STATS.sprDays)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [crisisActive, priceImpact])

  const sprPct = (sprDays / 30) * 100
  const sprColor = sprDays < 5 ? '#ef4444' : sprDays < 8 ? '#f97316' : '#22c55e'

  const stats = INDIA_IMPORT_STATS

  return (
    <div className="bg-[#0a0e1a]/90 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Brent Price */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Brent Crude</span>
          <span className={`text-[10px] font-medium ${brent > INDIA_IMPORT_STATS.brentPrice ? 'text-red-400' : 'text-green-400'}`}>
            {brent > INDIA_IMPORT_STATS.brentPrice ? '▲' : '▼'} {Math.abs(brent - INDIA_IMPORT_STATS.brentPrice).toFixed(2)}
          </span>
        </div>
        <p className={`text-3xl font-black tabular-nums ${crisisActive ? 'text-red-400' : 'text-orange-400'}`}>
          ${brent.toFixed(2)}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">per barrel · USD</p>
      </div>

      {/* SPR Gauge */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Strategic Petroleum Reserve</span>
          {crisisActive && <span className="text-[9px] text-red-400 animate-pulse font-bold">DEPLETING</span>}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-black tabular-nums" style={{ color: sprColor }}>
            {sprDays.toFixed(1)}
          </span>
          <span className="text-slate-400 text-sm">days cover</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, sprPct)}%`, backgroundColor: sprColor }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-600">0 days</span>
          <span className="text-[9px] text-slate-600">30 days</span>
        </div>
      </div>

      {/* Import Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[9px] text-slate-500 uppercase">Daily Imports</p>
          <p className="text-lg font-bold text-slate-200">{stats.dailyImports}M</p>
          <p className="text-[9px] text-slate-500">barrels/day</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[9px] text-slate-500 uppercase">Import Dependency</p>
          <p className="text-lg font-bold text-orange-400">88%</p>
          <p className="text-[9px] text-slate-500">of crude supply</p>
        </div>
      </div>

      {/* Top Suppliers */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Supply Mix</p>
        <div className="space-y-1.5">
          {stats.topSuppliers.map(s => (
            <div key={s.country} className="flex items-center gap-2">
              <span className="text-xs w-5">{s.flag}</span>
              <span className="text-[10px] text-slate-400 w-20 truncate">{s.country}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500/70"
                  style={{ width: `${s.share}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 w-6 text-right">{s.share}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[9px] text-slate-600 text-center">
        Tick #{tick} - Updated {updatedAt}
      </div>
    </div>
  )
}
