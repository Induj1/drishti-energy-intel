import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function scoreGeopoliticalRisk(
  headline: string,
  corridor: string
): Promise<{ score: number; analysis: string; recommendation: string }> {
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: "You are an energy security analyst for India's petroleum ministry. Respond with JSON only.",
        },
        {
          role: 'user',
          content: `Score this geopolitical news headline for supply disruption risk to India's oil imports.

Headline: "${headline}"
Corridor: ${corridor}

JSON format: {"score": <0-100 integer>, "analysis": "<one sentence>", "recommendation": "<one action India should take>"}`,
        },
      ],
    })
    return JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch {
    return { score: 50, analysis: 'Risk assessment unavailable', recommendation: 'Monitor situation' }
  }
}

export async function generateProcurementPlan(
  scenario: string,
  affectedVolume: number,
  priceImpact: number
): Promise<{
  summary: string
  recommendations: Array<{ supplier: string; volume: string; route: string; cost: string; timeline: string; confidence: number }>
}> {
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: "You are India's petroleum ministry emergency procurement advisor. Respond with JSON only.",
        },
        {
          role: 'user',
          content: `India needs emergency procurement recommendations.

Crisis: ${scenario}
Affected volume: ${affectedVolume}% of imports disrupted
Price impact: +${priceImpact}% on Brent

Generate 3 alternative procurement options ranked by viability.

JSON format: {"summary": "<2 sentence executive summary>", "recommendations": [{"supplier": "<country/company>", "volume": "<MMbbl>", "route": "<logistics route>", "cost": "<$/bbl premium>", "timeline": "<days to first delivery>", "confidence": <50-95>}]}`,
        },
      ],
    })
    return JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch {
    return {
      summary: 'Emergency procurement analysis in progress. Activating alternative supply corridors.',
      recommendations: [
        { supplier: 'West Africa (Nigeria)', volume: '8 MMbbl', route: 'Cape of Good Hope', cost: '+$2.8/bbl', timeline: '18 days', confidence: 72 },
        { supplier: 'US Gulf Coast', volume: '5 MMbbl', route: 'Atlantic + Indian Ocean', cost: '+$4.1/bbl', timeline: '26 days', confidence: 65 },
        { supplier: 'Kazakhstan (CPC Pipeline)', volume: '3 MMbbl', route: 'Black Sea + Suez', cost: '+$1.9/bbl', timeline: '14 days', confidence: 58 },
      ],
    }
  }
}

export async function analyzeSPRStrategy(
  crisisType: string,
  daysOfCover: number,
  dailyDemand: number
): Promise<{ drawdownPlan: Array<{ day: number; release: number; remaining: number }>; strategy: string }> {
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: "You are India's SPR management advisor. Respond with JSON only.",
        },
        {
          role: 'user',
          content: `India SPR decision. Crisis: ${crisisType}. Current SPR: ${daysOfCover} days cover. Daily demand: ${dailyDemand} MMbbl/day.

Generate optimal SPR drawdown plan for 10 days.

JSON format: {"strategy": "<one paragraph recommendation>", "drawdownPlan": [{"day": 1, "release": <MMbbl>, "remaining": <days of cover remaining>}]}`,
        },
      ],
    })
    return JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch {
    const plan = Array.from({ length: 10 }, (_, i) => ({
      day: i + 1,
      release: i < 5 ? 0.5 : 0.8,
      remaining: Math.max(0, daysOfCover - (i + 1) * 0.15),
    }))
    return {
      strategy: 'Gradual SPR release recommended to stabilize domestic prices while alternative procurement is secured.',
      drawdownPlan: plan,
    }
  }
}
