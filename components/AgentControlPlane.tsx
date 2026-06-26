'use client'

import { BrainCircuit, CheckCircle2, Cloud, GitBranch, ShieldCheck, Sparkles } from 'lucide-react'
import type { AgentRunResponse, SourceSummary } from '@/lib/sentinel-types'

type Props = {
  run: AgentRunResponse | null
  sourceSummary?: SourceSummary
  role: string
  running: boolean
  onRoleChange: (role: string) => void
  onRun: () => void
}

const ROLES = [
  { id: 'minister', label: 'Minister' },
  { id: 'operator', label: 'Operator' },
  { id: 'citizen', label: 'Citizen' },
]

function metricColor(value: number) {
  if (value >= 80) return 'var(--c-red)'
  if (value >= 60) return 'var(--c-amber)'
  return 'var(--c-green)'
}

export default function AgentControlPlane({ run, sourceSummary, role, running, onRoleChange, onRun }: Props) {
  const summary = run?.sourceSummary ?? sourceSummary
  const risk = run?.overallRisk ?? 42

  return (
    <section className="panel font-mono sentinel-panel">
      <div className="sentinel-panel-head">
        <div className="flex items-center gap-2">
          <BrainCircuit style={{ width: 14, height: 14, color: 'var(--c-cyan)' }} />
          <span>AGENT CONTROL</span>
        </div>
        <span style={{ color: run?.nasiko.mode === 'live' ? 'var(--c-green)' : 'var(--c-amber)' }}>
          {run?.nasiko.mode?.toUpperCase() ?? 'READY'}
        </span>
      </div>

      <div className="sentinel-role-row">
        {ROLES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="sentinel-chip-button"
            data-active={role === item.id}
            onClick={() => onRoleChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="sentinel-metric">
          <span>RISK</span>
          <strong style={{ color: metricColor(risk) }}>{risk}</strong>
        </div>
        <div className="sentinel-metric">
          <span>SOURCES</span>
          <strong>{summary?.total ?? 0}</strong>
        </div>
        <div className="sentinel-metric">
          <span>VERIFIED</span>
          <strong style={{ color: 'var(--c-green)' }}>{(summary?.live ?? 0) + (summary?.cached ?? 0)}</strong>
        </div>
      </div>

      <div className="sentinel-stack">
        {[
          { icon: Sparkles, label: 'Gemini / AI Studio', value: process.env.NEXT_PUBLIC_GEMINI_BADGE ?? 'adapter' },
          { icon: GitBranch, label: 'ADK agent graph', value: `${run?.steps.length ?? 7} nodes` },
          { icon: Cloud, label: 'Cloud Run ready', value: 'container' },
          { icon: ShieldCheck, label: 'Policy gate', value: run?.policy.decision.replace('_', ' ') ?? 'armed' },
          { icon: CheckCircle2, label: 'Nasiko bridge', value: run?.nasiko.routerUrl ? 'router' : run?.nasiko.enabled ? run.nasiko.mode : 'local' },
          { icon: GitBranch, label: 'Nasiko session', value: run?.nasiko.sessionId?.slice(0, 18) ?? 'standby' },
          { icon: Cloud, label: 'Phoenix trace', value: run?.nasiko.traceUrl ? 'ready' : 'optional' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="sentinel-row">
              <Icon style={{ width: 12, height: 12, color: 'var(--c-cyan)' }} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          )
        })}
      </div>

      <button type="button" className="sentinel-run-button" onClick={onRun} disabled={running}>
        {running ? 'RUNNING AGENT MESH...' : 'RUN AGENT MESH'}
      </button>
    </section>
  )
}
