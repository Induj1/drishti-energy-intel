import { Telegraf } from 'telegraf'
import { MOCK_NEWS, INDIA_IMPORT_STATS, SIMULATION_SCENARIOS } from '../lib/mock-data'
import { createSupabaseClient } from '../lib/supabase'

const riskLabel = (score: number) =>
  score >= 70 ? '🔴 CRITICAL' : score >= 45 ? '🟠 HIGH' : '🟡 ELEVATED'

// Lazy singleton — safe to import without TELEGRAM_BOT_TOKEN set at build time
let _bot: Telegraf | null = null

function getBot(): Telegraf | null {
  if (_bot !== null) return _bot
  if (!process.env.TELEGRAM_BOT_TOKEN) return null
  _bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
  registerHandlers(_bot)
  return _bot
}

async function storeChatId(chatId: number, username?: string, firstName?: string) {
  const sb = createSupabaseClient()
  if (!sb) return
  await sb.from('telegram_chats').upsert(
    { chat_id: String(chatId), username: username ?? null, first_name: firstName ?? null, active: true },
    { onConflict: 'chat_id' }
  )
}

function registerHandlers(bot: Telegraf) {
  bot.command('start', async ctx => {
    await storeChatId(ctx.chat.id, ctx.from?.username, ctx.from?.first_name)
    ctx.reply(
      `🛢️ *DRISHTI — India Energy Security Intelligence*\n\n` +
      `Real-time oil supply chain monitoring.\n\n` +
      `Commands:\n` +
      `/risk — Supply corridor risk assessment\n` +
      `/vessels — Active tanker tracking\n` +
      `/spr — Strategic Petroleum Reserve status\n` +
      `/simulate — Run crisis simulation\n` +
      `/news — Latest geopolitical intelligence\n` +
      `/price — Live Brent crude price\n\n` +
      `📡 You will receive automatic alerts when a crisis is triggered.`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('risk', async ctx => {
    await storeChatId(ctx.chat.id, ctx.from?.username, ctx.from?.first_name)
    ctx.reply(
      `*🌐 Supply Corridor Risk Assessment*\n\n` +
      `*Strait of Hormuz:* 🔴 78/100\n` +
      `_20M bbl/day · US-Iran tensions elevated_\n\n` +
      `*Red Sea (Bab-el-Mandeb):* 🟠 65/100\n` +
      `_8M bbl/day · Houthi drone threat active_\n\n` +
      `*Cape of Good Hope:* 🟢 12/100\n` +
      `_4M bbl/day · Operational_\n\n` +
      `*Overall India Supply Risk:* 🟠 58/100\n` +
      `_${INDIA_IMPORT_STATS.dailyImports}M bbl/day imports · ${INDIA_IMPORT_STATS.sprDays} days SPR cover_`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('vessels', async ctx => {
    await storeChatId(ctx.chat.id, ctx.from?.username, ctx.from?.first_name)
    ctx.reply(
      `*🚢 Active Vessel Tracking*\n\n` +
      `Total tracked: *12 vessels*\n` +
      `⚠️ In risk zones: *7 vessels*\n` +
      `🔴 Hormuz corridor: *4 VLCCs*\n` +
      `🟠 Red Sea corridor: *3 vessels*\n` +
      `🟢 Cape route: *2 vessels*\n` +
      `🔵 Safe waters: *3 vessels*\n\n` +
      `Total cargo: ~47M barrels en route to India\n\n` +
      `📱 Live map: https://drishti-intel.vercel.app`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('spr', async ctx => {
    await storeChatId(ctx.chat.id, ctx.from?.username, ctx.from?.first_name)
    const { sprDays, sprCapacity, sprCurrent, dailyImports } = INDIA_IMPORT_STATS
    ctx.reply(
      `*🏭 Strategic Petroleum Reserve*\n\n` +
      `Current cover: *${sprDays} days*\n` +
      `SPR volume: *${sprCurrent}M / ${sprCapacity}M barrels*\n` +
      `Daily demand: *${dailyImports}M barrels/day*\n\n` +
      `⚠️ *ALERT:* Below 10-day threshold\n` +
      `AI Recommendation: Authorize 2M bbl drawdown\n` +
      `+ Emergency procurement from West Africa`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('simulate', async ctx => {
    await storeChatId(ctx.chat.id, ctx.from?.username, ctx.from?.first_name)
    const args = ctx.message.text.split(' ').slice(1).join('_').toLowerCase()
    const scenario = SIMULATION_SCENARIOS[args as keyof typeof SIMULATION_SCENARIOS]
      ?? SIMULATION_SCENARIOS.hormuz_closure
    ctx.reply(
      `*${scenario.icon} SIMULATION: ${scenario.name.toUpperCase()}*\n\n` +
      `📊 *Impact Analysis:*\n` +
      `• Brent crude: *+${scenario.impacts.priceChange}%*\n` +
      `• Transit delay: *+${scenario.impacts.transitDelayDays} days*\n` +
      `• Supply disruption: *${scenario.impacts.affectedVolume}%*\n` +
      `• GDP impact: *${scenario.impacts.gdpImpact}%*\n` +
      `• Power sector stress: *+${scenario.impacts.powerSectorStress}%*\n\n` +
      `🔄 *Alternative Routes:*\n` +
      scenario.alternatives.map(a =>
        `• ${a.route}: ${a.viability}% viable · ${a.extraCost}`
      ).join('\n') +
      `\n\n📱 Full war room: https://drishti-intel.vercel.app`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('news', async ctx => {
    await storeChatId(ctx.chat.id, ctx.from?.username, ctx.from?.first_name)
    const top3 = MOCK_NEWS.slice(0, 3)
    ctx.reply(
      `*📰 Geopolitical Intelligence Feed*\n\n` +
      top3.map(n =>
        `${riskLabel(n.risk)} *[${n.corridor}]*\n${n.headline}\n_${n.source} · ${n.time}_`
      ).join('\n\n'),
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('price', async ctx => {
    await storeChatId(ctx.chat.id, ctx.from?.username, ctx.from?.first_name)
    const price = INDIA_IMPORT_STATS.brentPrice
    ctx.reply(
      `*💹 Brent Crude Spot Price*\n\n` +
      `Current: *$${price}/bbl*\n` +
      `24h Change: *+$${INDIA_IMPORT_STATS.priceChange24h} (+2.7%)*\n` +
      `India import cost (today): *~$${(price * INDIA_IMPORT_STATS.dailyImports * 1e6 / 1e9).toFixed(1)}B*`,
      { parse_mode: 'Markdown' }
    )
  })
}

// Broadcast crisis alert to every registered chat
export async function broadcastCrisisAlert(scenarioName: string, icon: string, riskScore: number, priceChange: number, affectedVolume: number) {
  const bot = getBot()
  if (!bot) return

  const sb = createSupabaseClient()
  if (!sb) return

  const { data: chats } = await sb
    .from('telegram_chats')
    .select('chat_id')
    .eq('active', true)

  if (!chats?.length) return

  const message =
    `🚨 *DRISHTI CRISIS ALERT*\n\n` +
    `${icon} *${scenarioName}*\n\n` +
    `• Risk level: *${riskScore}/100*\n` +
    `• Brent crude: *+${priceChange}%*\n` +
    `• Supply affected: *${affectedVolume}%*\n\n` +
    `AI procurement intelligence activated.\n` +
    `📱 War room: https://drishti-intel.vercel.app`

  await Promise.allSettled(
    chats.map(c =>
      bot.telegram.sendMessage(c.chat_id, message, { parse_mode: 'Markdown' })
    )
  )
}

export { getBot }
export default getBot

// Run as standalone process
if (require.main === module) {
  const b = getBot()
  if (!b) { console.error('TELEGRAM_BOT_TOKEN not set'); process.exit(1) }
  b.launch()
  console.log('🤖 DRISHTI Telegram bot running...')
  process.once('SIGINT', () => b.stop('SIGINT'))
  process.once('SIGTERM', () => b.stop('SIGTERM'))
}
