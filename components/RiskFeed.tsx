'use client'

import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { apiFetch } from '@/lib/client-api'

interface NewsItem {
  id: number; headline: string; source: string
  time: string; risk: number; corridor: string; sentiment: string
}

const RISK_COLOR = (score: number) => {
  if (score >= 70) return 'text-red-400 bg-red-500/10 border-red-500/30'
  if (score >= 45) return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
}

const RISK_BAR_COLOR = (score: number) => {
  if (score >= 70) return 'bg-red-500'
  if (score >= 45) return 'bg-orange-500'
  return 'bg-yellow-500'
}

export default function RiskFeed() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await apiFetch('/api/news')
        const data = await res.json()
        setNews(data.news)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
    const interval = setInterval(fetchNews, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-[#0a0e1a]/90 border border-slate-800 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">Geopolitical Risk Feed</h3>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/40 rounded-lg animate-pulse" />
          ))
        ) : (
          news.map((item) => (
            <div key={item.id} className={`p-2.5 rounded-lg border ${RISK_COLOR(item.risk)} transition-all hover:scale-[1.01]`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-slate-300 leading-tight flex-1">{item.headline}</p>
                <span className="text-[10px] font-bold shrink-0 mt-0.5">{item.risk}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${RISK_BAR_COLOR(item.risk)}`}
                    style={{ width: `${item.risk}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 shrink-0">{item.source} · {item.time}</span>
              </div>
              <span className="mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {item.corridor}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
