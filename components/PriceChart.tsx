'use client'

import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts'
import { useEffect, useState, useRef } from 'react'

const BASE = 87.42

export default function PriceChart({ crisisActive, priceImpact }: { crisisActive: boolean; priceImpact: number }) {
  const [data, setData] = useState<{ t: number; price: number }[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({
      t: i,
      price: +(BASE + Math.sin(i * 0.62) * 0.7).toFixed(2),
    }))
  )
  const tRef = useRef(24)

  useEffect(() => {
    const target = crisisActive ? BASE * (1 + priceImpact / 100) : BASE
    const id = setInterval(() => {
      tRef.current += 1
      setData(prev => {
        const last = prev[prev.length - 1]
        const noise = (Math.random() - 0.5) * 0.5
        const pull = (target - last.price) * (crisisActive ? 0.28 : 0.06)
        const price = +(last.price + pull + noise).toFixed(2)
        return [...prev.slice(1), { t: tRef.current, price }]
      })
    }, 1200)
    return () => clearInterval(id)
  }, [crisisActive, priceImpact])

  const current = data[data.length - 1]?.price ?? BASE
  const strokeColor = crisisActive ? '#ff3232' : '#00d4ff'
  const change = current - BASE
  const pct = ((change / BASE) * 100).toFixed(1)

  return (
    <div className="panel relative" style={{ borderRadius: 4, padding: '12px 14px 6px' }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />

      {/* Header label */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="hud-label" style={{ color: 'var(--c-muted)', letterSpacing: '0.18em' }}>
            DATA: BRENT CRUDE USD/BBL
          </p>
          <p
            className="font-mono tabular-nums"
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: strokeColor,
              textShadow: `0 0 10px ${strokeColor}88`,
              lineHeight: 1.1,
              marginTop: 2,
            }}
          >
            ${current.toFixed(2)}
          </p>
        </div>
        <div className="text-right" style={{ marginTop: 2 }}>
          <p
            className="font-mono text-xs font-bold"
            style={{ color: change >= 0 ? '#ff3232' : '#00ff87' }}
          >
            {change >= 0 ? '▲' : '▼'} {change >= 0 ? '+' : ''}{pct}%
          </p>
          <p className="hud-label" style={{ marginTop: 2 }}>PER BARREL</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={52}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="brentGradHUD" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['auto', 'auto']} hide />
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill="url(#brentGradHUD)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Bottom tick label */}
      <p className="hud-label text-right" style={{ marginTop: 2, fontSize: 8 }}>
        T-24H → T+00:00
      </p>
    </div>
  )
}
