'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, ExternalLink, Radio, Smartphone } from 'lucide-react'
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

export default function NFCBriefing() {
  const [brief, setBrief] = useState<MissionBrief | null>(null)
  const [time, setTime] = useState('SYNCING')

  useEffect(() => {
    const updateClock = () => setTime(new Date().toUTCString().slice(17, 25))
    updateClock()
    const timer = setInterval(updateClock, 1000)
    const fetchTimer = window.setTimeout(() => {
      apiFetch('/api/mission-brief?role=citizen&scenarioId=energy_port_cyber_shock')
        .then((r) => r.json())
        .then(setBrief)
        .catch(() => {})
    }, 0)
    return () => {
      clearInterval(timer)
      clearTimeout(fetchTimer)
    }
  }, [])

  const risk = brief?.overallRisk ?? 58
  const riskColor = risk >= 80 ? '#ff3232' : risk >= 60 ? '#ffb800' : '#00ff87'

  return (
    <main className="min-h-screen font-mono p-4" style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>
      <div className="mx-auto flex max-w-sm flex-col gap-3">
        <section className="panel sentinel-panel text-center">
          <div className="p-4">
            <div className="mb-1 flex justify-center">
              <Image src="/logo.png" alt="DRISHTI" width={128} height={64} style={{ objectFit: 'contain', mixBlendMode: 'lighten' }} priority />
            </div>
            <p style={{ fontSize: 8, color: 'var(--c-muted)', letterSpacing: '0.24em' }}>NFC VERIFIED BRIEF</p>
            <h1 style={{ fontSize: 18, color: 'var(--c-cyan)', fontWeight: 700, letterSpacing: '0.14em', marginTop: 4 }}>DRISHTI</h1>
          </div>
        </section>

        <section className="panel sentinel-panel">
          <div className="sentinel-panel-head">
            <div className="flex items-center gap-2">
              <Radio style={{ width: 14, height: 14, color: 'var(--c-green)' }} className="blink-slow" />
              <span>LIVE STATUS</span>
            </div>
            <span>{time}</span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p style={{ color: 'var(--c-muted)', fontSize: 9, letterSpacing: '0.14em' }}>PUBLIC RISK</p>
                <p style={{ color: riskColor, fontSize: 42, lineHeight: 1, fontWeight: 700, textShadow: `0 0 16px ${riskColor}88` }}>{risk}</p>
              </div>
              <BadgeCheck style={{ width: 42, height: 42, color: 'var(--c-green)' }} />
            </div>
            <h2 style={{ fontSize: 14, lineHeight: 1.35, marginTop: 12, fontWeight: 700 }}>{brief?.citizenBrief.headline ?? 'Verified energy brief is loading.'}</h2>
            <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--c-muted)', marginTop: 8 }}>{brief?.citizenBrief.impact ?? 'Scanning public feeds and agent output.'}</p>
          </div>
        </section>

        <section className="panel sentinel-panel">
          <div className="sentinel-panel-head">
            <span>WHAT TO DO</span>
            <span>{brief?.scenarioName?.toUpperCase() ?? 'CITIZEN'}</span>
          </div>
          <div className="citizen-actions p-4">
            {(brief?.citizenBrief.actions ?? ['Avoid panic buying.', 'Use verified updates.', 'Share this NFC brief instead of rumors.']).map((action) => (
              <span key={action}>{action}</span>
            ))}
          </div>
        </section>

        <section className="panel sentinel-panel">
          <div className="sentinel-panel-head">
            <span>VERIFIED SOURCES</span>
            <span>{brief?.sources.length ?? 0}</span>
          </div>
          <div className="trust-list pt-3">
            {(brief?.sources ?? []).slice(0, 4).map((source) => (
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

        <div className="grid grid-cols-2 gap-2 pb-4">
          <Link className="sentinel-link" href="/mobile">
            <Smartphone style={{ width: 12, height: 12 }} />
            MOBILE
          </Link>
          <Link className="sentinel-link" href="/">
            <BadgeCheck style={{ width: 12, height: 12 }} />
            WAR ROOM
          </Link>
        </div>
      </div>
    </main>
  )
}
