'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, MessageCircleWarning, Play, Radio, ShieldCheck, WalletCards } from 'lucide-react'
import { apiFetch } from '@/lib/client-api'

type MissionBrief = {
  scenarioName: string
  overallRisk: number
  citizenBrief: {
    headline: string
    impact: string
    actions: string[]
    priceSignal: string
    confidence: number
  }
  sources: Array<{ id: string; title: string; provider: string; mode: string; confidence: number; url: string }>
}

type RumorVerdict = {
  verdict: string
  explanation: string
  confidence: number
  nextAction: string
}

export default function MobileWarRoom() {
  const [brief, setBrief] = useState<MissionBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [rumor, setRumor] = useState('Fuel pumps are closing tonight')
  const [verdict, setVerdict] = useState<RumorVerdict | null>(null)

  const loadBrief = useCallback(async () => {
    const res = await apiFetch('/api/mission-brief?role=citizen&scenarioId=energy_port_cyber_shock')
    setBrief(await res.json())
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadBrief().catch(() => {})
    }, 0)
    return () => clearTimeout(timer)
  }, [loadBrief])

  const runDemo = useCallback(async () => {
    if (loading) return
    setLoading(true)
    await apiFetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'energy_port_cyber_shock', role: 'citizen' }),
    }).catch(() => {})
    await loadBrief().catch(() => {})
    setLoading(false)
  }, [loadBrief, loading])

  const checkRumor = useCallback(async () => {
    const res = await apiFetch('/api/rumor-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim: rumor }),
    })
    setVerdict(await res.json())
  }, [rumor])

  const risk = brief?.overallRisk ?? 58
  const riskColor = risk >= 80 ? '#ff3232' : risk >= 60 ? '#ffb800' : '#00ff87'
  const riskLabel = risk >= 80 ? 'CRITICAL' : risk >= 60 ? 'HIGH' : 'WATCH'

  return (
    <main className="min-h-screen font-mono" style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ background: '#020e0eee', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--c-border)' }}>
        <Image src="/logo.png" alt="DRISHTI" width={96} height={48} style={{ objectFit: 'contain', mixBlendMode: 'lighten' }} priority />
        <div className="ml-auto flex items-center gap-2" style={{ fontSize: 9, color: '#00ff87', letterSpacing: '0.12em' }}>
          <Radio style={{ width: 10, height: 10 }} className="blink-slow" />
          LIVE BRIEF
        </div>
      </header>

      <div className="mx-auto flex max-w-lg flex-col gap-3 p-4">
        <section className="panel sentinel-panel">
          <div className="sentinel-panel-head">
            <span>CITIZEN FUEL BRIEF</span>
            <span>{brief?.scenarioName?.toUpperCase() ?? 'LOADING'}</span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-3">
              <strong className="tabular-nums" style={{ fontSize: 54, lineHeight: 1, color: riskColor, textShadow: `0 0 18px ${riskColor}88` }}>
                {risk}
              </strong>
              <div style={{ paddingBottom: 8 }}>
                <p style={{ color: riskColor, fontSize: 12, fontWeight: 700, letterSpacing: '0.16em' }}>{riskLabel}</p>
                <p style={{ color: 'var(--c-muted)', fontSize: 9 }}>public risk index</p>
              </div>
            </div>
            <h1 className="mt-4" style={{ fontSize: 16, lineHeight: 1.35, fontWeight: 700 }}>{brief?.citizenBrief.headline ?? 'Verified fuel guidance is loading.'}</h1>
            <p className="mt-2" style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--c-muted)' }}>{brief?.citizenBrief.impact ?? 'DRISHTI is checking public sources and agent output.'}</p>
          </div>
        </section>

        <section className="panel sentinel-panel">
          <div className="sentinel-panel-head">
            <span>ACTIONS</span>
            <span>{Math.round((brief?.citizenBrief.confidence ?? 0.7) * 100)}% CONF</span>
          </div>
          <div className="citizen-actions p-4">
            {(brief?.citizenBrief.actions ?? ['Avoid panic buying.', 'Use official price and supply advisories.', 'Share only verified updates.']).map((action) => (
              <span key={action}>{action}</span>
            ))}
          </div>
        </section>

        <section className="panel sentinel-panel">
          <div className="sentinel-panel-head">
            <div className="flex items-center gap-2">
              <MessageCircleWarning style={{ width: 14, height: 14 }} />
              <span>RUMOR CHECK</span>
            </div>
            <span>WHATSAPP READY</span>
          </div>
          <div className="p-3">
            <textarea
              value={rumor}
              onChange={(e) => setRumor(e.target.value)}
              rows={3}
              style={{ width: '100%', resize: 'none', background: '#020f0f', border: '1px solid var(--c-border)', color: 'var(--c-text)', padding: 10, fontSize: 11, outline: 'none' }}
            />
            <button type="button" className="sentinel-run-button" style={{ width: '100%', margin: '10px 0 0' }} onClick={checkRumor}>
              CHECK CLAIM
            </button>
            {verdict && (
              <div className="mt-3" style={{ borderLeft: '2px solid var(--c-amber)', paddingLeft: 10 }}>
                <p style={{ fontSize: 10, color: 'var(--c-amber)', fontWeight: 700, letterSpacing: '0.12em' }}>{verdict.verdict.toUpperCase()}</p>
                <p style={{ fontSize: 10, color: 'var(--c-text)', lineHeight: 1.45, marginTop: 4 }}>{verdict.explanation}</p>
                <p style={{ fontSize: 9, color: 'var(--c-muted)', marginTop: 4 }}>{verdict.nextAction}</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel sentinel-panel">
          <div className="sentinel-panel-head">
            <span>SOURCES</span>
            <span>{brief?.sources.length ?? 0} LINKS</span>
          </div>
          <div className="trust-list pt-3">
            {(brief?.sources ?? []).slice(0, 5).map((source) => (
              <a key={source.id} className="trust-source" href={source.url} target="_blank" rel="noreferrer">
                <span className="trust-mode" style={{ background: source.mode === 'live' ? 'var(--c-green)' : 'var(--c-amber)' }} />
                <span className="trust-title">{source.title}</span>
                <span className="trust-provider">{source.provider}</span>
                <strong>{Math.round(source.confidence * 100)}%</strong>
                <ExternalLink style={{ width: 10, height: 10 }} />
              </a>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2 pb-6">
          <button type="button" className="sentinel-link" onClick={runDemo}>
            <Play style={{ width: 12, height: 12 }} />
            {loading ? 'RUNNING' : 'DEMO'}
          </button>
          <Link className="sentinel-link" href="/nfc">
            <WalletCards style={{ width: 12, height: 12 }} />
            NFC
          </Link>
          <Link className="sentinel-link" href="/">
            <ShieldCheck style={{ width: 12, height: 12 }} />
            WAR ROOM
          </Link>
        </div>
      </div>
    </main>
  )
}
