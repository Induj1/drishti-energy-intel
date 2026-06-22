'use client'

import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts'
import { useEffect, useState, useRef } from 'react'

const BASE = 87.42

export default function PriceChart({ crisisActive, priceImpact }: { crisisActive: boolean; priceImpact: number }) {
  const [data, setData] = useState<{ t: number; price: number }[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({
      t: i,
      price: +(BASE + (Math.random() - 0.5) * 1.6).toFixed(2),
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
  const color = crisisActive ? '#ef4444' : '#f97316'
  const change = current - BASE
  const pct = ((change / BASE) * 100).toFixed(1)

  return (
    <div className="bg-[#0a0e1a]/90 border border-slate-800 rounded-xl px-4 pt-3 pb-1">
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Brent Crude Live</p>
          <p className="text-2xl font-black tabular-nums" style={{ color }}>${current.toFixed(2)}</p>
        </div>
        <div className="text-right mt-1">
          <p className={`text-xs font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {change >= 0 ? '▲' : '▼'} {change >= 0 ? '+' : ''}{pct}%
          </p>
          <p className="text-[9px] text-slate-600">per barrel</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={56}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="brentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['auto', 'auto']} hide />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill="url(#brentGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
