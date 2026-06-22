'use client'

import { useEffect, useState } from 'react'

interface Scenario {
  name: string
  icon: string
  impacts: { priceChange: number; affectedVolume: number; transitDelayDays: number }
}

interface Props {
  scenario: Scenario | null
  onDismiss: () => void
}

export default function CrisisAlertModal({ scenario, onDismiss }: Props) {
  const [phase, setPhase] = useState<'hidden' | 'in' | 'hold' | 'out'>('hidden')

  useEffect(() => {
    if (!scenario) { setPhase('hidden'); return }
    setPhase('in')
    const t1 = setTimeout(() => setPhase('hold'), 80)
    const t2 = setTimeout(() => setPhase('out'), 3200)
    const t3 = setTimeout(() => { setPhase('hidden'); onDismiss() }, 3600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [scenario]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'hidden' || !scenario) return null

  const vis = phase === 'in' ? 'opacity-0 scale-105' : phase === 'out' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${vis}`}
      style={{ background: 'rgba(0,0,0,0.96)' }}
    >
      {/* CRT scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px)',
        }}
      />
      {/* Pulse rings */}
      <div className="absolute w-[500px] h-[500px] rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '1s' }} />
      <div className="absolute w-[320px] h-[320px] rounded-full border border-red-500/30 animate-ping" style={{ animationDuration: '1.6s' }} />

      <div className="relative text-center max-w-lg px-8">
        <div className="text-6xl mb-5">{scenario.icon}</div>

        <p className="text-[10px] text-red-400 uppercase tracking-[0.35em] mb-4 animate-pulse font-mono">
          ⚠ &nbsp;CRISIS SIMULATION INITIATED&nbsp; ⚠
        </p>

        <h1 className="text-4xl sm:text-5xl font-black text-white mb-8 leading-tight">
          {scenario.name}
        </h1>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-3xl font-black text-red-400">+{scenario.impacts.priceChange}%</p>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">Brent Crude</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <p className="text-3xl font-black text-orange-400">{scenario.impacts.affectedVolume}%</p>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">Supply Hit</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-3xl font-black text-yellow-400">
              {scenario.impacts.transitDelayDays > 0 ? `+${scenario.impacts.transitDelayDays}d` : 'NOW'}
            </p>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">Transit Delay</p>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-slate-600 font-mono animate-pulse">
          Activating AI procurement intelligence...
        </p>
      </div>
    </div>
  )
}
