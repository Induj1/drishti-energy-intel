import { NextResponse } from 'next/server'
import { MOCK_NEWS } from '@/lib/mock-data'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const sb = createSupabaseClient()

  if (sb) {
    const { data } = await sb
      .from('risk_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data && data.length > 0) {
      const news = data.map((r) => ({
        id: r.id,
        headline: r.headline,
        source: r.source,
        time: r.time_label ?? new Date(r.created_at).toLocaleTimeString(),
        risk: r.risk_score,
        corridor: r.corridor,
        sentiment: r.risk_score >= 70 ? 'critical' : r.risk_score >= 45 ? 'high' : 'medium',
      }))
      return NextResponse.json({ news, source: 'supabase' })
    }
  }

  // Try NewsAPI if key provided
  try {
    const apiKey = process.env.NEWS_API_KEY
    if (apiKey) {
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=(oil+OR+crude+OR+OPEC+OR+Hormuz+OR+energy+supply)&sortBy=publishedAt&language=en&pageSize=8&apiKey=${apiKey}`,
        { next: { revalidate: 300 } }
      )
      if (res.ok) {
        const data = await res.json()
        const articles =
          data.articles?.map(
            (a: { title: string; source: { name: string }; publishedAt: string }, i: number) => ({
              id: i + 1,
              headline: a.title,
              source: a.source.name,
              time: new Date(a.publishedAt).toLocaleTimeString(),
              risk: Math.floor(Math.random() * 60) + 20,
              corridor: 'Global',
              sentiment: 'medium',
            })
          ) ?? MOCK_NEWS

        // Persist to Supabase for future clients
        if (sb) {
          await sb.from('risk_feed').insert(
            articles.map((a: { headline: string; source: string; corridor: string; risk: number; time: string }) => ({
              headline: a.headline,
              source: a.source,
              corridor: a.corridor,
              risk_score: a.risk,
              time_label: a.time,
            }))
          )
        }
        return NextResponse.json({ news: articles, source: 'newsapi' })
      }
    }
  } catch { /* fall through */ }

  return NextResponse.json({ news: MOCK_NEWS, source: 'mock' })
}
