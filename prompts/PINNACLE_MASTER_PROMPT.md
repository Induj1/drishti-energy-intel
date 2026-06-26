# Pinnacle Master Prompt

Build DRISHTI SentinelMesh as a hackathon-winning Track B enterprise agent app.

The product is an Agentic Crisis OS for India's energy security. It must combine a cinematic 3D war room, real public data fusion, Gemini-powered agent reasoning, a Nasiko workflow adapter, a policy approval gate, citizen-facing mobile/NFC surfaces, Telegram/WhatsApp-ready rumor checking, and Cloud Run deployment.

Mandatory capabilities:

- Next.js TypeScript app with a strong first-screen operational dashboard.
- Agent graph: Source Watchtower, Corridor Sentinel, Cyber Port Guard, Procurement Copilot, Nasiko Orchestrator, Policy Gate, Citizen Impact Agent.
- Data feeds: PPAC, FRED Brent, Frankfurter FX, Open-Meteo, CISA KEV, FIRST EPSS, OSV, EIA RSS, optional AISStream, Indian port schedule links.
- Every API response carries source mode: live, cached, simulated, or fallback.
- Gemini API via REST when `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` is present; deterministic local fallback otherwise.
- Nasiko adapter via `NASIKO_API_URL` and `NASIKO_API_KEY`; local adapter otherwise.
- AgentFacts/NANDA-style endpoints at `/api/agentfacts` and `/.well-known/agentfacts.json`.
- API routes for live data, agent runs, mission brief, policy gate, rumor check, evidence pack, health.
- Supabase tables for source snapshots, agent runs, and mission briefs.
- Cloud Run Dockerfile with `PORT=8080`.
- UI optimized for judges: visible agents, source chips, risk score, approval state, citizen impact, and one-click demo.

Demo scenario:

Energy Port Cyber Shock: Hormuz risk spike plus tanker scheduling cyber disruption at an Indian energy port. Show how agents fuse live data, propose procurement alternatives, block risky actions behind human approval, and publish safe citizen guidance.
