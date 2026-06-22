import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { getBot } from './bot'

const b = getBot()
if (!b) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in .env.local')
  process.exit(1)
}

b.launch()
console.log('🤖 DRISHTI Telegram bot running... Send /start to register for crisis alerts.')

process.once('SIGINT', () => b.stop('SIGINT'))
process.once('SIGTERM', () => b.stop('SIGTERM'))
