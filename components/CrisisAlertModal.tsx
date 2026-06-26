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

function getScenarioColor(name: string): string {
  if (name.toLowerCase().includes('hormuz')) return '#ff3232'
  if (name.toLowerCase().includes('red sea')) return '#ffb800'
  if (name.toLowerCase().includes('opec')) return '#ffb800'
  if (name.toLowerCase().includes('combined')) return '#b06cff'
  return '#ff3232'
}

export default function CrisisAlertModal({ scenario, onDismiss }: Props) {
  const [phase, setPhase] = useState<'hidden' | 'in' | 'hold' | 'out'>('hidden')

  useEffect(() => {
    if (!scenario) {
      const t0 = setTimeout(() => setPhase('hidden'), 0)
      return () => clearTimeout(t0)
    }
    const t0 = setTimeout(() => setPhase('in'), 0)
    const t1 = setTimeout(() => setPhase('hold'), 80)
    const t2 = setTimeout(() => setPhase('out'), 3200)
    const t3 = setTimeout(() => { setPhase('hidden'); onDismiss() }, 3600)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [scenario]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'hidden' || !scenario) return null

  const accentColor = getScenarioColor(scenario.name)
  const vis =
    phase === 'in'  ? 'opacity-0 scale-105' :
    phase === 'out' ? 'opacity-0 scale-95'  : 'opacity-100 scale-100'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${vis}`}
      style={{ background: 'rgba(0,0,0,0.95)' }}
    >
      {/* Scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.14) 3px,rgba(0,0,0,0.14) 4px)',
        }}
      />

      {/* Pulse rings */}
      <div
        className="absolute rounded-full border pointer-events-none"
        style={{ width: 520, height: 520, borderColor: `${accentColor}20`, animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }}
      />
      <div
        className="absolute rounded-full border pointer-events-none"
        style={{ width: 340, height: 340, borderColor: `${accentColor}30`, animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }}
      />

      {/* Modal panel */}
      <div
        className="relative font-mono max-w-md w-full mx-4"
        style={{
          background: '#020c0c',
          border: `1px solid ${accentColor}60`,
          padding: '32px 28px',
        }}
      >
        {/* Corner brackets */}
        <div style={{ position:'absolute', top:-1, left:-1, width:14, height:14, borderTop:`2px solid ${accentColor}`, borderLeft:`2px solid ${accentColor}` }} />
        <div style={{ position:'absolute', top:-1, right:-1, width:14, height:14, borderTop:`2px solid ${accentColor}`, borderRight:`2px solid ${accentColor}` }} />
        <div style={{ position:'absolute', bottom:-1, left:-1, width:14, height:14, borderBottom:`2px solid ${accentColor}`, borderLeft:`2px solid ${accentColor}` }} />
        <div style={{ position:'absolute', bottom:-1, right:-1, width:14, height:14, borderBottom:`2px solid ${accentColor}`, borderRight:`2px solid ${accentColor}` }} />

        {/* Blink header */}
        <p
          className="blink text-center font-mono font-bold tracking-widest mb-5"
          style={{ color: '#ff3232', fontSize: 11, letterSpacing: '0.3em', textShadow: '0 0 10px #ff323288' }}
        >
          ⚠ &nbsp;THREAT CONDITION ALPHA&nbsp; ⚠
        </p>

        {/* Icon */}
        <div className="text-center mb-4" style={{ fontSize: 60, lineHeight: 1 }}>
          {scenario.icon}
        </div>

        {/* Scenario name */}
        <h1
          className="text-center font-mono font-bold tracking-wide mb-6"
          style={{ fontSize: 22, color: accentColor, textShadow: `0 0 14px ${accentColor}99` }}
        >
          {scenario.name.toUpperCase()}
        </h1>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Price */}
          <div
            className="relative text-center p-3"
            style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.3)' }}
          >
            <div style={{ position:'absolute', top:-1, left:-1, width:8, height:8, borderTop:'1.5px solid #ff3232', borderLeft:'1.5px solid #ff3232' }} />
            <div style={{ position:'absolute', bottom:-1, right:-1, width:8, height:8, borderBottom:'1.5px solid #ff3232', borderRight:'1.5px solid #ff3232' }} />
            <p className="font-mono font-bold tabular-nums" style={{ fontSize: 24, color: '#ff3232', textShadow: '0 0 8px #ff323288' }}>
              +{scenario.impacts.priceChange}%
            </p>
            <p className="hud-label mt-1" style={{ fontSize: 8 }}>BRENT CRUDE</p>
          </div>

          {/* Supply */}
          <div
            className="relative text-center p-3"
            style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.3)' }}
          >
            <div style={{ position:'absolute', top:-1, left:-1, width:8, height:8, borderTop:'1.5px solid #ffb800', borderLeft:'1.5px solid #ffb800' }} />
            <div style={{ position:'absolute', bottom:-1, right:-1, width:8, height:8, borderBottom:'1.5px solid #ffb800', borderRight:'1.5px solid #ffb800' }} />
            <p className="font-mono font-bold tabular-nums" style={{ fontSize: 24, color: '#ffb800', textShadow: '0 0 8px #ffb80088' }}>
              {scenario.impacts.affectedVolume}%
            </p>
            <p className="hud-label mt-1" style={{ fontSize: 8 }}>SUPPLY HIT</p>
          </div>

          {/* Delay */}
          <div
            className="relative text-center p-3"
            style={{ background: 'rgba(176,108,255,0.08)', border: '1px solid rgba(176,108,255,0.3)' }}
          >
            <div style={{ position:'absolute', top:-1, left:-1, width:8, height:8, borderTop:'1.5px solid #b06cff', borderLeft:'1.5px solid #b06cff' }} />
            <div style={{ position:'absolute', bottom:-1, right:-1, width:8, height:8, borderBottom:'1.5px solid #b06cff', borderRight:'1.5px solid #b06cff' }} />
            <p className="font-mono font-bold tabular-nums" style={{ fontSize: 24, color: '#b06cff', textShadow: '0 0 8px #b06cff88' }}>
              {scenario.impacts.transitDelayDays > 0 ? `+${scenario.impacts.transitDelayDays}D` : 'NOW'}
            </p>
            <p className="hud-label mt-1" style={{ fontSize: 8 }}>TRANSIT DELAY</p>
          </div>
        </div>

        {/* Footer */}
        <p className="blink-slow text-center font-mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.15em' }}>
          ACTIVATING AI PROCUREMENT INTELLIGENCE...
        </p>
      </div>
    </div>
  )
}
