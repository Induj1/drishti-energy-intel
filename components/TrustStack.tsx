'use client'

import { DatabaseZap, ExternalLink } from 'lucide-react'
import type { AgentRunResponse, SourceRef } from '@/lib/sentinel-types'

function modeColor(mode: SourceRef['mode']) {
  if (mode === 'live') return 'var(--c-green)'
  if (mode === 'cached') return 'var(--c-cyan)'
  if (mode === 'simulated') return 'var(--c-amber)'
  return 'var(--c-red)'
}

export default function TrustStack({ run }: { run: AgentRunResponse | null }) {
  const sources = run?.sources.slice(0, 8) ?? []

  return (
    <section className="panel font-mono sentinel-panel">
      <div className="sentinel-panel-head">
        <div className="flex items-center gap-2">
          <DatabaseZap style={{ width: 14, height: 14, color: 'var(--c-amber)' }} />
          <span>TRUST STACK</span>
        </div>
        <span>{run?.sourceSummary.averageConfidence ? `${Math.round(run.sourceSummary.averageConfidence * 100)}% CONF` : 'SOURCE CHIPS'}</span>
      </div>

      <div className="trust-list">
        {(sources.length ? sources : [
          { id: 'fred', title: 'FRED Brent', provider: 'FRED', mode: 'live', confidence: 0.93, url: 'https://fred.stlouisfed.org/', observedAt: '', notes: '' },
          { id: 'ppac', title: 'PPAC imports', provider: 'PPAC', mode: 'live', confidence: 0.82, url: 'https://ppac.gov.in/', observedAt: '', notes: '' },
          { id: 'cisa', title: 'CISA KEV', provider: 'CISA', mode: 'live', confidence: 0.94, url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', observedAt: '', notes: '' },
        ] as SourceRef[]).map((source) => (
          <a key={source.id} className="trust-source" href={source.url} target="_blank" rel="noreferrer">
            <span className="trust-mode" style={{ background: modeColor(source.mode) }} />
            <span className="trust-title">{source.title}</span>
            <span className="trust-provider">{source.provider}</span>
            <strong>{Math.round(source.confidence * 100)}%</strong>
            <ExternalLink style={{ width: 10, height: 10 }} />
          </a>
        ))}
      </div>
    </section>
  )
}
