# SentinelMesh Crisis Agent for Nasiko

This folder is a Nasiko-compatible agent package. Copy or zip it into the Nasiko repo's `agents/` directory and deploy it through Nasiko's web UI, CLI, or Redis stream.

## Local test

Start DRISHTI first:

```bash
npm run dev
```

Then run the agent:

```bash
cd nasiko-agents/sentinelmesh-crisis-agent
docker compose up --build
curl http://localhost:8095/health
```

Run a direct analysis:

```bash
curl -X POST http://localhost:8095/analyze \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"Run an energy port cyber shock assessment for India\",\"role\":\"operator\"}"
```

## Deploy inside Nasiko

From the cloned `Nasiko-Labs/nasiko` repo:

```bash
cp -r /path/to/drishti-energy-intel/nasiko-agents/sentinelmesh-crisis-agent ./agents/
docker exec redis redis-cli XADD orchestration:commands '*' \
  command deploy_agent \
  agent_name sentinelmesh-crisis-agent \
  agent_path /app/agents/sentinelmesh-crisis-agent \
  base_url http://nasiko-backend:8000 \
  upload_type directory
```

Set the agent environment variable so the container can reach DRISHTI:

```env
DRISHTI_APP_URL=http://host.docker.internal:3001
```

In a production-style demo, set `DRISHTI_APP_URL` to the Cloud Run URL.
