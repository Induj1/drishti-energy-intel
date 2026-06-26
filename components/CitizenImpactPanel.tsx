'use client'

import { MessageCircleWarning, Smartphone, WalletCards } from 'lucide-react'
import type { AgentRunResponse } from '@/lib/sentinel-types'

export default function CitizenImpactPanel({ run }: { run: AgentRunResponse | null }) {
  const brief = run?.citizenBrief

  return (
    <section className="panel font-mono sentinel-panel">
      <div className="sentinel-panel-head">
        <div className="flex items-center gap-2">
          <Smartphone style={{ width: 14, height: 14, color: 'var(--c-purple)' }} />
          <span>CITIZEN IMPACT</span>
        </div>
        <span>PUBLIC MODE</span>
      </div>

      <div className="citizen-brief">
        <h3>{brief?.headline ?? 'Fuel impact brief ready.'}</h3>
        <p>{brief?.impact ?? 'Run the agent mesh to generate household guidance from live public sources.'}</p>
        <div className="citizen-actions">
          {(brief?.actions ?? ['NFC card opens verified brief.', 'Telegram bot can answer rumor checks.']).slice(0, 3).map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <a className="sentinel-link" href="/mobile">
          <Smartphone style={{ width: 12, height: 12 }} />
          MOBILE
        </a>
        <a className="sentinel-link" href="/nfc">
          <WalletCards style={{ width: 12, height: 12 }} />
          NFC CARD
        </a>
      </div>

      <div className="rumor-strip">
        <MessageCircleWarning style={{ width: 12, height: 12 }} />
        <span>Rumor check API: /api/rumor-check</span>
      </div>
    </section>
  )
}
