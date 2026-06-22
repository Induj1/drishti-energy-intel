import { NextResponse } from 'next/server'
import { getBot } from '@/telegram/bot'

// Telegram sends POST updates to this URL
export async function POST(req: Request) {
  try {
    const bot = getBot()
    if (!bot) return NextResponse.json({ ok: true }) // bot not configured — ignore silently

    const update = await req.json()
    await bot.handleUpdate(update)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }) // always 200 to Telegram
  }
}
