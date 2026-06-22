import { NextResponse } from 'next/server'
import { getBot } from '@/telegram/bot'

// Hit this URL once after deploy to register the webhook:
//   https://drishti-intel.vercel.app/api/telegram/setup
export async function GET(req: Request) {
  const bot = getBot()
  if (!bot) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  const webhookUrl = `${origin}/api/telegram/webhook`

  await bot.telegram.setWebhook(webhookUrl)
  const info = await bot.telegram.getWebhookInfo()
  const me = await bot.telegram.getMe()

  return NextResponse.json({
    ok: true,
    bot: { id: me.id, username: me.username, name: me.first_name },
    webhook: info.url,
    pendingUpdates: info.pending_update_count,
    instructions: `Send /start to @${me.username} on Telegram to register your chat for crisis alerts.`,
  })
}
