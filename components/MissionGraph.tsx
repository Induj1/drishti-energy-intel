'use client'

import { ArrowRight, CircleDashed, LockKeyhole, Workflow } from 'lucide-react'
import type { AgentRunResponse } from '@/lib/sentinel-types'

export default function MissionGraph({ run }: { run: AgentRunResponse | null }) {
  const steps = run?.steps ?? []

  return (
    <section className="panel font-mono sentinel-panel">
      <div className="sentinel-panel-head">
        <div className="flex items-center gap-2">
          <Workflow style={{ width: 14, height: 14, color: 'var(--c-green)' }} />
          <span>MISSION GRAPH</span>
        </div>
        <span>{steps.length || 7} AGENTS</span>
      </div>

      <div className="mission-graph">
        {(steps.length ? steps : [
          { agentName: 'Source Watchtower', summary: 'Waiting for live sweep.', status: 'queued', confidence: 0.7 },
          { agentName: 'Corridor Sentinel', summary: 'Weather, chokepoint, vessel overlay.', status: 'queued', confidence: 0.7 },
          { agentName: 'Policy Gate', summary: 'Human approval guard armed.', status: 'queued', confidence: 0.7 },
        ]).map((step, index) => (
          <div className="mission-node" key={`${step.agentName}-${index}`} data-status={step.status}>
            <div className="mission-dot">
              {step.status === 'needs_approval' ? (
                <LockKeyhole style={{ width: 11, height: 11 }} />
              ) : (
                <CircleDashed style={{ width: 11, height: 11 }} />
              )}
            </div>
            <div className="min-w-0">
              <div className="mission-node-title">
                <span>{step.agentName}</span>
                <strong>{Math.round(step.confidence * 100)}%</strong>
              </div>
              <p>{step.summary}</p>
            </div>
            {index < (steps.length || 3) - 1 && <ArrowRight className="mission-arrow" />}
          </div>
        ))}
      </div>
    </section>
  )
}
