# 🛢️ DRISHTI — दृष्टि
### India's AI-Powered Energy Supply Chain Intelligence Platform

> *"India had the data. It didn't have the intelligence layer. DRISHTI is that layer."*

**ET AI Hackathon 2026 · Problem Statement #2 · Supply Chain Intelligence / Energy Security**

**[🚀 Live Demo](https://drishti-intel.vercel.app) · [📦 GitHub](https://github.com/indujg/drishti-energy-intel)**

---

## The Problem

India imports **88% of its crude oil**. Nearly **40–45% of that volume** transits through the Strait of Hormuz. India's Strategic Petroleum Reserve (SPR) covers only **9.5 days** of consumption.

When geopolitical shocks hit — like the 2025 US-Iran standoff that spiked Brent by 8% in a single session — India has **no real-time intelligence layer**. Decision-makers act on hours-old data. DRISHTI compresses the response from days to minutes.

---

## What We Built

### 🌍 Real-Time 3D War Room
- Live oil tanker tracking on a WebGL globe
- Animated shipping route arcs: Hormuz → India, Red Sea → India, Cape → India
- Indian port rings (Mumbai, Vadinar, Kochi, Vizag, Paradip)
- Click any vessel for full intelligence card

### 📈 Live Brent Crude Chart
- Animated area chart — price streams in real-time every 1.2 seconds
- Spikes dynamically when a crisis scenario is triggered
- Shows % delta from baseline

### 💥 One-Click Crisis Simulation

| Scenario | Price Impact | Transit Delay | Supply Hit |
|---|---|---|---|
| 🔴 Hormuz Closure | +24.8% | +21 days | 78% |
| 🟠 Red Sea Shutdown | +12.3% | +14 days | 32% |
| 🟡 OPEC+ Emergency Cut | +18.5% | Immediate | 45% |
| ⚫ Combined Crisis | +48.2% | +35 days | 92% |

Each crisis triggers a **full-screen cinematic alert** with animated stats, then auto-opens AI procurement recommendations.

### 🤖 GPT-4o-mini Procurement Intelligence
On crisis trigger, AI instantly:
1. Scores geopolitical risk per corridor (0–100)
2. Identifies 3 alternative procurement options with viability scores
3. Ranks by cost, transit time, and geopolitical risk
4. Generates optimal SPR drawdown schedule

### 📡 Real-Time Multi-Browser Sync
- Trigger a crisis on one browser → **all connected analysts see it simultaneously**
- Powered by Supabase `postgres_changes` real-time subscriptions
- Live analyst count badge in header via Presence channels

### ▶ Demo Mode
Single click → auto-runs Hormuz Closure → Combined Crisis sequence with cinematic 3-second alert overlays.

### ✈️ Telegram Bot
```
/risk     — Corridor risk scores
/vessels  — Active tanker tracking
/spr      — Reserve status + AI recommendation
/simulate — Full crisis simulation
/news     — Top intelligence items
/price    — Live Brent price
```

### 📱 NFC Card
Tap any NFC card → instant mobile briefing at `/nfc` — risk score, price, SPR, alerts.

---

## 🎬 Live Demo Walkthrough

**[→ Open War Room](https://drishti-intel.vercel.app)** · No login required

| Step | What to do | What you'll see |
|---|---|---|
| **1** | Open the war room | 3D globe with 12 oil tankers, animated shipping lanes, glowing vessel trails |
| **2** | Click **▶ Demo Mode** (top-right header) | Full-screen crisis alert fires — Hormuz Closure activates, Brent price chart spikes |
| **3** | Wait 3 seconds for modal to dismiss | GPT-4o-mini generates procurement recommendations in the right panel |
| **4** | Watch the globe | Camera pans to Strait of Hormuz, vessels in risk zones turn red |
| **5** | After 10s, second alert fires | Escalates to Combined Crisis — Brent +48%, supply -92% |
| **6** | Open a second browser tab | Both tabs show the crisis simultaneously via Supabase real-time sync |
| **7** | Visit [/mobile](https://drishti-intel.vercel.app/mobile) on your phone | Full mobile war room — same live data, crisis triggers |
| **8** | Tap [/nfc](https://drishti-intel.vercel.app/nfc) | NFC card briefing — risk score, live Brent, SPR gauge, intelligence feed |

> **Fastest path to wow:** Step 1 → Step 2 → watch the 10-second escalation sequence.

---

## Architecture

```
┌──────────────┬──────────────────┬────────────────────┐
│ DATA SOURCES │   AI BRAIN       │   INTERFACES       │
│ AIS vessel   │  OpenAI          │  3D War Room       │
│ tracking     │  gpt-4o-mini     │  (Next.js/globe.gl)│
│ NewsAPI      │  Risk Scorer     │  Mobile PWA        │
│ Commodity    │  Procurement     │  Telegram Bot      │
│ feeds        │  Agent           │  NFC Card          │
│              │  Supabase RT     │                    │
└──────────────┴──────────────────┴────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js · Tailwind CSS · TypeScript |
| Globe | react-globe.gl · Three.js |
| Charts | Recharts (animated AreaChart) |
| AI | OpenAI GPT-4o-mini |
| Database & RT | Supabase (PostgreSQL + Realtime WebSockets) |
| Telegram | Telegraf.js |
| Deployment | Vercel |
| Data | AIS (vessel positions) · NewsAPI |

---

## Quick Start

```bash
git clone https://github.com/indujg/drishti-energy-intel
cd drishti-energy-intel
npm install
cp .env.local.example .env.local
# Fill in your API keys (see .env.local)
npm run dev
```

### Environment Variables
```env
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEWS_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Supabase Setup
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

---

*DRISHTI (दृष्टि) — Sanskrit for "Vision". Because India's energy security needs clear vision, not reactive panic.*
