import type { CitizenBrief, ProcurementPlan, SourceSummary } from '@/lib/sentinel-types'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

function apiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_API_KEY
}

function stripJson(text: string) {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first >= 0 && last > first) return cleaned.slice(first, last + 1)
  return cleaned
}

async function geminiJson<T>(system: string, prompt: string, fallback: T): Promise<T> {
  const key = apiKey()
  if (!key) return fallback

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: 'application/json',
        },
      }),
    })
    if (!res.ok) throw new Error(`Gemini returned ${res.status}`)
    const data = (await res.json()) as GeminiResponse
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('\n') ?? ''
    return JSON.parse(stripJson(text)) as T
  } catch {
    return fallback
  }
}

function keywordRisk(headline: string, corridor: string) {
  const value = `${headline} ${corridor}`.toLowerCase()
  let score = 35
  if (/hormuz|iran|strait|missile|closure|blocked/.test(value)) score += 34
  if (/red sea|houthi|drone|bab|suez|attack/.test(value)) score += 28
  if (/opec|cut|sanction|war|cyber|port/.test(value)) score += 18
  if (/deal|allocation|increase|stable|reopen/.test(value)) score -= 16
  return Math.min(96, Math.max(12, score))
}

export async function scoreGeopoliticalRisk(
  headline: string,
  corridor: string
): Promise<{ score: number; analysis: string; recommendation: string }> {
  const score = keywordRisk(headline, corridor)
  const fallback = {
    score,
    analysis: `${corridor} disruption risk is ${score >= 70 ? 'high' : score >= 45 ? 'elevated' : 'moderate'} based on chokepoint and supply keywords.`,
    recommendation: score >= 70 ? 'Trigger corridor watch, tanker reroute review, and procurement options.' : 'Keep monitoring and refresh vessel/source evidence.',
  }

  return geminiJson(
    "You are an energy security analyst for India's petroleum ministry. Return JSON only.",
    `Score this headline for India's oil import disruption risk.\nHeadline: ${headline}\nCorridor: ${corridor}\nJSON: {"score":0-100,"analysis":"one sentence","recommendation":"one action"}`,
    fallback
  )
}

export async function generateProcurementPlan(
  scenario: string,
  affectedVolume: number,
  priceImpact: number
): Promise<ProcurementPlan> {
  const emergency = affectedVolume >= 75 || priceImpact >= 25
  const fallback: ProcurementPlan = {
    summary: emergency
      ? 'Activate a dual-track response: release SPR for price stability while redirecting cargoes through Cape and West African supply. Keep every recommendation behind a human policy approval gate.'
      : 'Procurement risk is elevated but manageable. Prefer flexible spot cargoes and short-cycle swaps before deep SPR drawdown.',
    recommendations: [
      { supplier: 'West Africa pool', volume: emergency ? '9 MMbbl' : '5 MMbbl', route: 'Cape of Good Hope to west coast India', cost: '+$2.8/bbl', timeline: '16-20 days', confidence: 78 },
      { supplier: 'U.S. Gulf Coast', volume: emergency ? '6 MMbbl' : '3 MMbbl', route: 'Atlantic-Cape-India', cost: '+$4.6/bbl', timeline: '24-30 days', confidence: 68 },
      { supplier: 'UAE / Oman swaps', volume: '4 MMbbl', route: 'short-haul Gulf cargoes with naval advisory', cost: '+$1.7/bbl', timeline: '5-9 days', confidence: emergency ? 58 : 74 },
    ],
  }

  return geminiJson(
    "You are India's emergency petroleum procurement advisor. Return JSON only.",
    `Crisis: ${scenario}\nAffected import volume: ${affectedVolume}%\nBrent price impact: ${priceImpact}%\nCreate 3 ranked procurement recommendations.\nJSON shape: {"summary":"2 sentence executive summary","recommendations":[{"supplier":"","volume":"","route":"","cost":"","timeline":"","confidence":0}]}`,
    fallback
  )
}

export async function analyzeSPRStrategy(
  crisisType: string,
  daysOfCover: number,
  dailyDemand: number
): Promise<{ drawdownPlan: Array<{ day: number; release: number; remaining: number }>; strategy: string }> {
  const fallbackPlan = Array.from({ length: 10 }, (_, i) => {
    const release = i < 3 ? 0.45 : i < 7 ? 0.7 : 0.55
    return {
      day: i + 1,
      release,
      remaining: Number(Math.max(0, daysOfCover - ((i + 1) * release) / dailyDemand).toFixed(2)),
    }
  })
  const fallback = {
    strategy: `For ${crisisType}, release SPR in a staged band only after Cabinet-level authorization, preserving at least 6 days of cover while procurement and rerouting settle.`,
    drawdownPlan: fallbackPlan,
  }

  return geminiJson(
    "You are India's strategic petroleum reserve advisor. Return JSON only.",
    `Crisis: ${crisisType}\nSPR days of cover: ${daysOfCover}\nDaily demand: ${dailyDemand} MMbbl/day\nGenerate a 10 day drawdown plan.\nJSON shape: {"strategy":"","drawdownPlan":[{"day":1,"release":0,"remaining":0}]}`,
    fallback
  )
}

export async function generateCitizenBrief(input: {
  role: string
  scenarioName: string
  overallRisk: number
  petrolStressIndex: number
  sourceSummary: SourceSummary
}): Promise<CitizenBrief> {
  const fallback: CitizenBrief = {
    headline: input.overallRisk >= 80 ? 'Fuel supply risk is high, but not a panic signal.' : 'Fuel supply is being monitored with normal household guidance.',
    impact:
      input.petrolStressIndex >= 70
        ? 'Retail prices and tanker delays may face pressure if the shock continues for several days.'
        : 'Most households should not see immediate disruption from the current signal.',
    actions: [
      'Avoid panic buying; it worsens local shortages.',
      'Track verified price and supply advisories from official channels.',
      input.role === 'commuter' ? 'Plan essential travel and combine trips if local alerts rise.' : 'Keep critical logistics plans ready for a 48 hour disruption.',
    ],
    priceSignal: `Stress index ${input.petrolStressIndex}/100 with ${input.sourceSummary.live} live public sources.`,
    confidence: input.sourceSummary.averageConfidence,
  }

  return geminiJson(
    'You convert energy security analysis into calm citizen-facing advice. Return JSON only.',
    `Role: ${input.role}\nScenario: ${input.scenarioName}\nOverall risk: ${input.overallRisk}\nPetrol stress index: ${input.petrolStressIndex}\nLive sources: ${input.sourceSummary.live}/${input.sourceSummary.total}\nJSON shape: {"headline":"","impact":"","actions":[""],"priceSignal":"","confidence":0}`,
    fallback
  )
}

export async function verifyRumorClaim(claim: string): Promise<{
  verdict: 'verified' | 'unsupported' | 'false' | 'needs_context'
  explanation: string
  confidence: number
  nextAction: string
}> {
  const text = claim.toLowerCase()
  const fallback = /all pumps|no fuel|nationwide shutdown|closed forever/.test(text)
    ? {
        verdict: 'unsupported' as const,
        explanation: 'The claim sounds absolute and should be checked against PPAC, state oil marketing companies, and local district advisories before sharing.',
        confidence: 0.71,
        nextAction: 'Share only official advisories and ask for the source link.',
      }
    : {
        verdict: 'needs_context' as const,
        explanation: 'The claim may be location-specific; more source context is needed before calling it true or false.',
        confidence: 0.62,
        nextAction: 'Ask for place, time, and source, then compare with verified feeds.',
      }

  return geminiJson(
    'You are a misinformation triage agent for fuel and energy crisis rumors. Return JSON only.',
    `Check this claim for public safety sharing. Claim: ${claim}\nJSON shape: {"verdict":"verified|unsupported|false|needs_context","explanation":"","confidence":0,"nextAction":""}`,
    fallback
  )
}
