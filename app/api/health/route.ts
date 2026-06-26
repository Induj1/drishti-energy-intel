import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'drishti-sentinelmesh',
    time: new Date().toISOString(),
    env: {
      gemini: Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY),
      nasiko: Boolean(process.env.NASIKO_API_URL ?? process.env.NASICO_API_URL),
      nasikoAuth: Boolean(
        process.env.NASIKO_TOKEN ??
          process.env.NASIKO_BEARER_TOKEN ??
          process.env.NASIKO_API_KEY ??
          (process.env.NASIKO_ACCESS_KEY && process.env.NASIKO_ACCESS_SECRET)
      ),
      aisstream: Boolean(process.env.AISSTREAM_API_KEY),
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      cloudRun: Boolean(process.env.K_SERVICE),
    },
  })
}
