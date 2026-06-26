import { MOCK_NEWS, MOCK_VESSELS } from '@/lib/mock-data'
import { liveEnvelope, sourceRef, withSourceCache } from '@/lib/source-cache'
import type { LiveEnvelope, SourceRef, SourceSummary } from '@/lib/sentinel-types'

const PPAC_IMPORT_URL = 'https://ppac.gov.in/AjaxController/getImportExports'
const PPAC_HOME_URL = 'https://ppac.gov.in/'
const FRED_BRENT_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU'
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD&to=INR'
const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
const FIRST_EPSS_URL = 'https://api.first.org/data/v1/epss?limit=8&order=!epss'
const OSV_URL = 'https://api.osv.dev/v1/query'
const EIA_RSS_URL = 'https://www.eia.gov/rss/todayinenergy.xml'
const DEENDAYAL_URL = 'https://www.deendayalport.gov.in/en/berthing_status/'
const MUMBAI_PORT_URL = 'https://mumbaiport.gov.in/show_content.php?lang=1&level=1&lid=93&ls_id=93'
const AISSTREAM_URL = 'https://aisstream.io/documentation'

const DEFAULT_HEADERS = {
  'User-Agent': 'DRISHTI-SentinelMesh/1.0 (hackathon demo; public data fusion)',
  Accept: 'application/json,text/html,application/xml,text/plain,*/*',
}

type EnergySnapshot = {
  brent: { date: string; usdPerBarrel: number; changeLabel: string }
  fx: { pair: string; rate: number; date: string }
  ppacImport: { financialYear: string; crudeThousandMt: number; netImportThousandMt: number; period: string; lastUpdated: string }
  fuelPrices: { city: string; petrolInrPerLitre: number; dieselInrPerLitre: number; observedOn: string }
  domesticImpact: { crudeInrPerBarrel: number; petrolStressIndex: number; importDependence: string }
}

type CorridorSnapshot = {
  corridors: Array<{
    id: string
    name: string
    risk: number
    waveHeightM: number
    windKph: number
    visibilityM: number
    chokepointVolume: string
    signal: string
  }>
}

type CyberSnapshot = {
  cisaKevCount: number
  recentKev: Array<{ cveID: string; vendorProject: string; product: string; vulnerabilityName: string; dueDate?: string }>
  epss: Array<{ cve: string; epss: number; percentile: number }>
  osvDemo: Array<{ id: string; summary: string }>
  portExposure: Array<{ asset: string; status: string; risk: number }>
}

type NewsSnapshot = {
  items: Array<{ id: string | number; headline: string; source: string; time: string; risk: number; corridor: string; sentiment: string; url?: string }>
}

type VesselSnapshot = {
  vessels: Array<{
    id: string
    name: string
    lat: number
    lng: number
    speed: number
    heading?: number
    type: string
    cargo: string
    origin: string
    destination: string
    eta: string
    riskZone: string
    confidence: number
  }>
  aisConfigured: boolean
  portSchedules: Array<{ port: string; title: string; url: string }>
  caveat: string
}

export type LiveSummary = {
  energy: LiveEnvelope<EnergySnapshot>
  corridors: LiveEnvelope<CorridorSnapshot>
  cyber: LiveEnvelope<CyberSnapshot>
  news: LiveEnvelope<NewsSnapshot>
  vessels: LiveEnvelope<VesselSnapshot>
  sourceSummary: SourceSummary
}

async function fetchText(url: string, init?: RequestInit, timeoutMs = 8500): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...DEFAULT_HEADERS, ...(init?.headers ?? {}) },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`${url} returned ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 8500): Promise<T> {
  const text = await fetchText(url, init, timeoutMs)
  return JSON.parse(text) as T
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return fallback
  const n = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseFredCsv(csv: string) {
  const rows = csv.trim().split(/\r?\n/).slice(1).reverse()
  for (const row of rows) {
    const [date, value] = row.split(',')
    const price = Number(value)
    if (date && Number.isFinite(price)) return { date, usdPerBarrel: price }
  }
  return { date: new Date().toISOString().slice(0, 10), usdPerBarrel: 87.42 }
}

function parsePpacFuel(homeHtml: string) {
  const diesel = homeHtml.match(/Diesel[\s\S]{0,120}?Rs\.?\s*([\d.]+)/i)
  const petrol = homeHtml.match(/Petrol[\s\S]{0,120}?Rs\.?\s*([\d.]+)/i)
  const observed = homeHtml.match(/as\s+on\s+([0-9A-Za-z -]+)/i)
  return {
    city: 'Delhi',
    petrolInrPerLitre: toNumber(petrol?.[1], 102.12),
    dieselInrPerLitre: toNumber(diesel?.[1], 95.2),
    observedOn: observed?.[1]?.trim() ?? 'latest PPAC homepage snapshot',
  }
}

function parsePpacImport(payload: unknown) {
  type PpacRow = {
    title?: unknown
    total?: unknown
    modified_date?: string
  }

  const result = (payload as { result?: Record<string, PpacRow> }).result ?? {}
  const rows = Object.values(result)
  const titleOf = (row: PpacRow) => stripTags(String(row.title ?? '')).toUpperCase().replace(/\s+/g, ' ').trim()
  const valueOf = (row: PpacRow | undefined, fallback: number) => toNumber(stripTags(String(row?.total ?? '')), fallback)
  const crudeRow = rows.find((row) => titleOf(row) === 'CRUDE OIL')
  const netRow = rows.find((row) => titleOf(row) === 'NET IMPORT')

  return {
    financialYear: '2026-2027',
    crudeThousandMt: Math.round(valueOf(crudeRow, 41740)),
    netImportThousandMt: Math.round(valueOf(netRow, 39658)),
    period: 'April-May',
    lastUpdated: crudeRow?.modified_date ?? netRow?.modified_date ?? 'PPAC latest published table',
  }
}

function fallbackEnergy(): EnergySnapshot {
  return {
    brent: { date: new Date().toISOString().slice(0, 10), usdPerBarrel: 87.42, changeLabel: 'fallback' },
    fx: { pair: 'USD/INR', rate: 83.5, date: new Date().toISOString().slice(0, 10) },
    ppacImport: { financialYear: '2026-2027', crudeThousandMt: 41740, netImportThousandMt: 39658, period: 'April-May', lastUpdated: 'fallback' },
    fuelPrices: { city: 'Delhi', petrolInrPerLitre: 102.12, dieselInrPerLitre: 95.2, observedOn: 'fallback' },
    domesticImpact: { crudeInrPerBarrel: 7300, petrolStressIndex: 68, importDependence: 'India imports roughly 85% of crude demand.' },
  }
}

export async function getEnergySnapshot() {
  return withSourceCache<EnergySnapshot>('live:energy', 6 * 60 * 60, async () => {
    const [fredCsv, fx, ppacImports, ppacHome] = await Promise.all([
      fetchText(FRED_BRENT_URL),
      fetchJson<{ date: string; rates: { INR: number } }>(FRANKFURTER_URL),
      fetchJson<unknown>(PPAC_IMPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ financialYear: '2026-2027', reportBy: '1', pageId: '14' }),
      }),
      fetchText(PPAC_HOME_URL),
    ])

    const brent = parseFredCsv(fredCsv)
    const fuelPrices = parsePpacFuel(ppacHome)
    const ppacImport = parsePpacImport(ppacImports)
    const rate = fx.rates.INR
    const crudeInrPerBarrel = Math.round(brent.usdPerBarrel * rate)

    return liveEnvelope({
      ttlSeconds: 6 * 60 * 60,
      sources: [
        sourceRef({ id: 'fred:brent', title: 'FRED daily Brent crude series', provider: 'Federal Reserve Bank of St. Louis', url: FRED_BRENT_URL, mode: 'live', confidence: 0.93 }),
        sourceRef({ id: 'frankfurter:fx', title: 'USD to INR FX rate', provider: 'Frankfurter', url: FRANKFURTER_URL, mode: 'live', confidence: 0.9 }),
        sourceRef({ id: 'ppac:imports', title: 'Petroleum import/export table', provider: 'PPAC India', url: PPAC_IMPORT_URL, mode: 'live', confidence: 0.82 }),
        sourceRef({ id: 'ppac:fuel', title: 'Retail petrol and diesel prices', provider: 'PPAC India', url: PPAC_HOME_URL, mode: 'live', confidence: 0.78 }),
      ],
      data: {
        brent: { ...brent, changeLabel: 'latest daily close' },
        fx: { pair: 'USD/INR', rate, date: fx.date },
        ppacImport,
        fuelPrices,
        domesticImpact: {
          crudeInrPerBarrel,
          petrolStressIndex: clamp(Math.round((brent.usdPerBarrel - 65) * 1.5 + (fuelPrices.petrolInrPerLitre - 90)), 0, 100),
          importDependence: 'High import dependence makes corridor disruption visible to households within days.',
        },
      },
    })
  }, fallbackEnergy())
}

const CORRIDORS = [
  { id: 'hormuz', name: 'Strait of Hormuz', lat: 26.56, lng: 56.25, base: 58, chokepointVolume: '20M bpd' },
  { id: 'redsea', name: 'Bab-el-Mandeb / Red Sea', lat: 12.63, lng: 43.33, base: 63, chokepointVolume: '8M bpd' },
  { id: 'cape', name: 'Cape of Good Hope', lat: -34.36, lng: 18.47, base: 22, chokepointVolume: 'reroute corridor' },
]

async function getMarinePoint(c: (typeof CORRIDORS)[number]) {
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${c.lat}&longitude=${c.lng}&current=wave_height,swell_wave_height,ocean_current_velocity&timezone=UTC`
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&current=wind_speed_10m,wind_gusts_10m,visibility&timezone=UTC`
  const [marine, weather] = await Promise.all([
    fetchJson<{ current?: { wave_height?: number; swell_wave_height?: number } }>(marineUrl),
    fetchJson<{ current?: { wind_speed_10m?: number; wind_gusts_10m?: number; visibility?: number } }>(weatherUrl),
  ])
  const waveHeightM = toNumber(marine.current?.wave_height, 1.5)
  const windKph = toNumber(weather.current?.wind_speed_10m, 14)
  const visibilityM = toNumber(weather.current?.visibility, 10000)
  const risk = clamp(Math.round(c.base + waveHeightM * 4 + windKph * 0.25 + (visibilityM < 4000 ? 10 : 0)), 0, 100)
  return {
    id: c.id,
    name: c.name,
    risk,
    waveHeightM,
    windKph,
    visibilityM,
    chokepointVolume: c.chokepointVolume,
    signal: risk >= 80 ? 'critical weather and conflict overlay' : risk >= 60 ? 'heightened monitoring' : 'operational',
  }
}

export async function getCorridorSnapshot() {
  return withSourceCache<CorridorSnapshot>('live:corridors', 45 * 60, async () => {
    const corridors = await Promise.all(CORRIDORS.map(getMarinePoint))
    return liveEnvelope({
      ttlSeconds: 45 * 60,
      sources: [
        sourceRef({ id: 'open-meteo:marine', title: 'Marine wave and swell forecast', provider: 'Open-Meteo', url: 'https://open-meteo.com/en/docs/marine-weather-api', mode: 'live', confidence: 0.86 }),
        sourceRef({ id: 'open-meteo:weather', title: 'Corridor wind and visibility forecast', provider: 'Open-Meteo', url: 'https://open-meteo.com/en/docs', mode: 'live', confidence: 0.86 }),
      ],
      data: { corridors },
    })
  }, {
    corridors: CORRIDORS.map((c) => ({
      id: c.id,
      name: c.name,
      risk: c.base,
      waveHeightM: 1.5,
      windKph: 14,
      visibilityM: 10000,
      chokepointVolume: c.chokepointVolume,
      signal: 'fallback operational estimate',
    })),
  })
}

export async function getCyberSnapshot() {
  return withSourceCache<CyberSnapshot>('live:cyber', 3 * 60 * 60, async () => {
    const [kev, epss, osv] = await Promise.all([
      fetchJson<{ vulnerabilities?: CyberSnapshot['recentKev'] }>(CISA_KEV_URL),
      fetchJson<{ data?: Array<{ cve: string; epss: string; percentile: string }> }>(FIRST_EPSS_URL),
      fetchJson<{ vulns?: Array<{ id: string; summary: string }> }>(OSV_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' }),
      }),
    ])

    return liveEnvelope({
      ttlSeconds: 3 * 60 * 60,
      sources: [
        sourceRef({ id: 'cisa:kev', title: 'Known Exploited Vulnerabilities catalog', provider: 'CISA', url: CISA_KEV_URL, mode: 'live', confidence: 0.94 }),
        sourceRef({ id: 'first:epss', title: 'Exploit Prediction Scoring System', provider: 'FIRST', url: FIRST_EPSS_URL, mode: 'live', confidence: 0.9 }),
        sourceRef({ id: 'osv:demo', title: 'Open Source Vulnerability query', provider: 'OSV', url: OSV_URL, mode: 'live', confidence: 0.86, notes: 'Demo dependency probe for port operator software supply chain.' }),
      ],
      data: {
        cisaKevCount: kev.vulnerabilities?.length ?? 0,
        recentKev: (kev.vulnerabilities ?? []).slice(0, 5),
        epss: (epss.data ?? []).map((item) => ({
          cve: item.cve,
          epss: Number(item.epss),
          percentile: Number(item.percentile),
        })),
        osvDemo: (osv.vulns ?? []).slice(0, 4).map((v) => ({ id: v.id, summary: v.summary })),
        portExposure: [
          { asset: 'Port community system VPN', status: 'patch window required', risk: 78 },
          { asset: 'Tanker berth scheduling API', status: 'rate limited and monitored', risk: 62 },
          { asset: 'WhatsApp citizen bot', status: 'read-only public info mode', risk: 24 },
        ],
      },
    })
  }, {
    cisaKevCount: 0,
    recentKev: [],
    epss: [],
    osvDemo: [],
    portExposure: [
      { asset: 'Port community system VPN', status: 'fallback cyber watch', risk: 65 },
    ],
  })
}

function stripTags(value: string) {
  return value.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

export async function getNewsSnapshot() {
  return withSourceCache<NewsSnapshot>('live:news', 20 * 60, async () => {
    const xml = await fetchText(EIA_RSS_URL)
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match, index) => {
      const block = match[1]
      const title = stripTags(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? 'Energy market update')
      const link = stripTags(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? '')
      const pubDate = stripTags(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? '')
      const risk = /oil|crude|opec|petroleum/i.test(title) ? 54 : 28
      return {
        id: `eia-${index}`,
        headline: title,
        source: 'EIA',
        time: pubDate ? new Date(pubDate).toLocaleString() : 'latest',
        risk,
        corridor: /red sea|suez/i.test(title) ? 'Red Sea' : /hormuz|iran|gulf/i.test(title) ? 'Hormuz' : 'Global',
        sentiment: risk >= 70 ? 'critical' : risk >= 45 ? 'high' : 'medium',
        url: link,
      }
    })

    return liveEnvelope({
      ttlSeconds: 20 * 60,
      sources: [
        sourceRef({ id: 'eia:rss', title: 'Today in Energy RSS', provider: 'U.S. Energy Information Administration', url: EIA_RSS_URL, mode: 'live', confidence: 0.88 }),
      ],
      data: { items: items.length > 0 ? items : MOCK_NEWS },
    })
  }, { items: MOCK_NEWS })
}

async function getPortScheduleRefs(): Promise<SourceRef[]> {
  const refs: SourceRef[] = []
  const [deendayal, mumbai] = await Promise.allSettled([
    fetchText(DEENDAYAL_URL, undefined, 6500),
    fetchText(MUMBAI_PORT_URL, undefined, 6500),
  ])

  if (deendayal.status === 'fulfilled') {
    const link = deendayal.value.match(/href=["']([^"']+\.(?:xlsx?|pdf))["'][^>]*>([\s\S]{0,120}?)<\/a>/i)
    refs.push(sourceRef({
      id: 'port:deendayal',
      title: stripTags(link?.[2] ?? 'Deendayal Port berthing status'),
      provider: 'Deendayal Port Authority',
      url: link?.[1]?.startsWith('http') ? link[1] : DEENDAYAL_URL,
      mode: 'live',
      confidence: 0.78,
    }))
  }

  if (mumbai.status === 'fulfilled') {
    const link = mumbai.value.match(/href=["']([^"']*(?:pdf|showfile)[^"']*)["'][^>]*>([\s\S]{0,120}?(?:tanker|vessel|daily)[\s\S]{0,120}?)<\/a>/i)
    refs.push(sourceRef({
      id: 'port:mumbai',
      title: stripTags(link?.[2] ?? 'Mumbai Port tanker and vessel information'),
      provider: 'Mumbai Port Authority',
      url: link?.[1]?.startsWith('http') ? link[1] : MUMBAI_PORT_URL,
      mode: 'live',
      confidence: 0.75,
    }))
  }

  return refs
}

export async function getVesselSnapshot() {
  return withSourceCache<VesselSnapshot>('live:vessels', 4 * 60, async () => {
    const portRefs = await getPortScheduleRefs()
    const aisConfigured = Boolean(process.env.AISSTREAM_API_KEY)
    const vessels = MOCK_VESSELS.map((v) => ({
      ...v,
      lat: +(v.lat + (Math.random() - 0.5) * 0.04).toFixed(4),
      lng: +(v.lng + (Math.random() - 0.5) * 0.04).toFixed(4),
      speed: +(v.speed + (Math.random() - 0.5) * 0.3).toFixed(1),
      confidence: aisConfigured ? 0.74 : 0.58,
    }))

    return liveEnvelope({
      ttlSeconds: 4 * 60,
      dataMode: aisConfigured ? 'live' : 'simulated',
      warnings: aisConfigured
        ? ['AISStream key detected; demo currently uses safe cached vessel sample unless websocket worker is enabled.']
        : ['AIS cargo class is not reliably free without a key; vessel positions are simulated and port schedules are linked as public evidence.'],
      sources: [
        sourceRef({ id: 'aisstream:optional', title: 'Optional live AIS websocket', provider: 'AISStream', url: AISSTREAM_URL, mode: aisConfigured ? 'live' : 'simulated', confidence: aisConfigured ? 0.74 : 0.45 }),
        ...portRefs,
      ],
      data: {
        vessels,
        aisConfigured,
        portSchedules: portRefs.map((s) => ({ port: s.provider, title: s.title, url: s.url })),
        caveat: 'Exact cargo for individual vessels should be treated as AIS/port-schedule inference unless supplied by authenticated port or AIS feeds.',
      },
    })
  }, {
    vessels: MOCK_VESSELS.map((v) => ({ ...v, confidence: 0.5 })),
    aisConfigured: false,
    portSchedules: [],
    caveat: 'Fallback vessel sample.',
  })
}

export function buildSourceSummary(sources: SourceRef[]): SourceSummary {
  const total = sources.length
  return {
    total,
    live: sources.filter((s) => s.mode === 'live').length,
    cached: sources.filter((s) => s.mode === 'cached').length,
    simulated: sources.filter((s) => s.mode === 'simulated').length,
    fallback: sources.filter((s) => s.mode === 'fallback').length,
    averageConfidence: total ? Number((sources.reduce((sum, s) => sum + s.confidence, 0) / total).toFixed(2)) : 0,
  }
}

export async function getLiveSummary(): Promise<LiveSummary> {
  const [energy, corridors, cyber, news, vessels] = await Promise.all([
    getEnergySnapshot(),
    getCorridorSnapshot(),
    getCyberSnapshot(),
    getNewsSnapshot(),
    getVesselSnapshot(),
  ])
  const sources = [...energy.sources, ...corridors.sources, ...cyber.sources, ...news.sources, ...vessels.sources]
  return {
    energy,
    corridors,
    cyber,
    news,
    vessels,
    sourceSummary: buildSourceSummary(sources),
  }
}

export function flattenSources(summary: LiveSummary): SourceRef[] {
  return [
    ...summary.energy.sources,
    ...summary.corridors.sources,
    ...summary.cyber.sources,
    ...summary.news.sources,
    ...summary.vessels.sources,
  ]
}
