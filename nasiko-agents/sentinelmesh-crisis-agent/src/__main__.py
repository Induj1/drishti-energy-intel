import os
from typing import Any, Dict, Optional

import httpx
from fastapi import FastAPI
from pydantic import BaseModel, Field


DRISHTI_APP_URL = os.getenv("DRISHTI_APP_URL", "http://host.docker.internal:3001").rstrip("/")
DEFAULT_SCENARIO = "energy_port_cyber_shock"

app = FastAPI(
    title="DRISHTI SentinelMesh Nasiko Agent",
    version="1.0.0",
    description="Nasiko-routable crisis agent that calls the DRISHTI SentinelMesh Cloud Run/Next.js API.",
)


class AgentRequest(BaseModel):
    text: Optional[str] = None
    query: Optional[str] = None
    scenarioId: Optional[str] = None
    role: Optional[str] = "operator"
    options: Dict[str, Any] = Field(default_factory=dict)


def infer_scenario(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ["port", "cyber", "tanker", "crude", "fuel", "energy"]):
        return "energy_port_cyber_shock"
    if any(token in lowered for token in ["hormuz", "red sea", "corridor", "shipping"]):
        return "hormuz_closure"
    return DEFAULT_SCENARIO


async def run_drishti(request: AgentRequest) -> Dict[str, Any]:
    prompt = request.query or request.text or ""
    scenario_id = request.scenarioId or request.options.get("scenarioId") or infer_scenario(prompt)
    role = request.role or request.options.get("role") or "operator"

    async with httpx.AsyncClient(timeout=35) as client:
        response = await client.post(
            f"{DRISHTI_APP_URL}/api/agents/run",
            json={
                "scenarioId": scenario_id,
                "role": role,
                "skipNasiko": True,
            },
        )
        response.raise_for_status()
        return response.json()


def compact_response(run: Dict[str, Any]) -> Dict[str, Any]:
    policy = run.get("policy") or {}
    citizen_brief = run.get("citizenBrief") or {}
    procurement = run.get("procurement") or {}
    sources = run.get("sources") or []

    return {
        "agent": "sentinelmesh-crisis-agent",
        "selected_capability": "energy_crisis_orchestration",
        "confidence": 0.9,
        "runId": run.get("runId"),
        "scenario": run.get("scenarioName"),
        "risk": run.get("overallRisk"),
        "policyDecision": policy.get("decision"),
        "policyReason": policy.get("reason"),
        "citizenMessage": citizen_brief.get("headline"),
        "procurementSummary": procurement.get("summary"),
        "sourceCount": len(sources),
        "topSources": [
            {
                "id": source.get("id"),
                "title": source.get("title"),
                "mode": source.get("mode"),
                "confidence": source.get("confidence"),
            }
            for source in sources[:5]
            if isinstance(source, dict)
        ],
    }


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "sentinelmesh-crisis-agent",
        "drishtiAppUrl": DRISHTI_APP_URL,
    }


@app.post("/analyze")
async def analyze(request: AgentRequest) -> Dict[str, Any]:
    run = await run_drishti(request)
    return compact_response(run)


@app.post("/run")
async def run(request: AgentRequest) -> Dict[str, Any]:
    run_result = await run_drishti(request)
    return compact_response(run_result)


@app.post("/")
async def root(request: AgentRequest) -> Dict[str, Any]:
    return await analyze(request)
