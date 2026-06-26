# Nasiko Integration

DRISHTI uses Nasiko in two directions:

- Outbound: `lib/nasiko.ts` logs in to Nasiko and posts a multipart `query` plus `session_id` to the Kong router at `/router`.
- Inbound: `nasiko-agents/sentinelmesh-crisis-agent` packages DRISHTI as a Nasiko-routable agent with `Agentcard.json`.

## Environment

```env
NASIKO_API_URL=http://localhost:9100
NASIKO_ACCESS_KEY=NASK_...
NASIKO_ACCESS_SECRET=...
NASIKO_ROUTER_PATH=/router
NASIKO_TRACE_URL=http://localhost:6006
NASIKO_WORKFLOW_ID=sentinelmesh-energy-crisis
```

You can also set `NASIKO_TOKEN` or `NASIKO_API_KEY` as a bearer token instead of access key and secret.

## Probe

```bash
curl http://localhost:3000/api/nasiko/probe
```

Expected success shape:

```json
{
  "ok": true,
  "result": {
    "enabled": true,
    "mode": "live",
    "workflowId": "sentinelmesh-energy-crisis",
    "routerUrl": "http://localhost:9100/router"
  }
}
```

If the router is unavailable, the app returns `mode: "fallback"` and continues the agent run locally.

## Agent package

The packaged agent lives at:

```text
nasiko-agents/sentinelmesh-crisis-agent
```

It exposes:

- `GET /health`
- `POST /`
- `POST /analyze`
- `POST /run`

The agent calls DRISHTI's `/api/agents/run` with `skipNasiko: true` so a Nasiko-routed callback does not recursively call Nasiko again.

## Demo line

"Nasiko is not just a logo in our deck. DRISHTI calls the Nasiko router for an agent handoff, and the same DRISHTI crisis agent can be registered back into Nasiko through an AgentCard package."
