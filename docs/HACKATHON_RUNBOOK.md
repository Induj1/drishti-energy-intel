# Hackathon Runbook

## 24 hour build order

1. Confirm `npm run build`.
2. Set `GEMINI_API_KEY` and `NEXT_PUBLIC_APP_URL`.
3. Deploy to Cloud Run.
4. Open `/api/health`.
5. Open `/api/live/summary` and confirm at least one `live` source.
6. Open `/` and click `DEMO MODE`.
7. Open `/mobile` on phone.
8. Open `/nfc` and prepare it as the NFC card URL.
9. Open `/api/evidence-pack` in a browser tab for judges.
10. If Nasiko is available, set `NASIKO_API_URL`, `NASIKO_ACCESS_KEY`, `NASIKO_ACCESS_SECRET`, and `NASIKO_TRACE_URL`.
11. Open `/api/nasiko/probe` and confirm `result.mode` becomes `live`.
12. If time allows, deploy `nasiko-agents/sentinelmesh-crisis-agent` inside the Nasiko repo so their router can select DRISHTI as a registered agent.

## Judge script

Start with the citizen problem:

"A fuel rumor spreads faster than official response. At the same time, India has tankers, port schedules, weather, crude prices, cyber alerts, and policy approvals scattered across systems. DRISHTI SentinelMesh is an agentic crisis OS that fuses those signals, proposes action, and blocks dangerous actions behind human approval."

Then click `DEMO MODE`.

Point to:

- Agent graph: multi-agent orchestration.
- Nasiko bridge: real sponsor router call and optional Phoenix trace.
- Source chips: real public feeds.
- Policy Gate: no autonomous SPR/procurement action.
- Citizen panel/mobile/NFC: useful to a common person.
- Evidence pack: judge can inspect sources.
- Cloud Run URL: live deployment.

## Backup if Wi-Fi breaks

The demo continues in cached or simulated mode. Say:

"The system is fail-soft. It does not hallucinate live data; it labels source mode and keeps the command workflow running."

## Nasiko demo checklist

1. Start Nasiko locally from `Nasiko-Labs/nasiko`.
2. Copy credentials from `orchestrator/superuser_credentials.json`.
3. Set:

```env
NASIKO_API_URL=http://localhost:9100
NASIKO_ACCESS_KEY=NASK_...
NASIKO_ACCESS_SECRET=...
NASIKO_TRACE_URL=http://localhost:6006
```

4. Hit `/api/nasiko/probe`.
5. Open the main dashboard and run the agent mesh.
6. Keep the Phoenix trace tab open if available.

If Nasiko routing fails, do not hide it. Say:

"This is deliberately fail-soft enterprise orchestration. Nasiko is the preferred control plane; if it is unavailable, the same Gemini/local agent graph continues with an auditable fallback."
