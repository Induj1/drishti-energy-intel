export const MOCK_VESSELS = [
  { id: 'V001', name: 'Maharaja Agrasen', lat: 26.5, lng: 56.3, speed: 14.2, heading: 95, type: 'VLCC', cargo: 'Crude Oil', origin: 'Ras Tanura, SA', destination: 'Vadinar, India', eta: '2026-06-28', flag: 'Panama', riskZone: 'hormuz' },
  { id: 'V002', name: 'BW Messinia', lat: 23.1, lng: 62.4, speed: 12.8, heading: 88, type: 'Suezmax', cargo: 'Crude Oil', origin: 'Basra, Iraq', destination: 'Paradip, India', eta: '2026-06-29', flag: 'Norway', riskZone: 'hormuz' },
  { id: 'V003', name: 'SCF Yenisei', lat: 15.2, lng: 52.1, speed: 11.4, heading: 112, type: 'VLCC', cargo: 'Crude Oil', origin: 'Yanbu, SA', destination: 'Mumbai, India', eta: '2026-07-01', flag: 'Russia', riskZone: 'redsea' },
  { id: 'V004', name: 'Pacific Mimosa', lat: 12.5, lng: 44.8, speed: 13.1, heading: 105, type: 'Aframax', cargo: 'Crude Oil', origin: 'Jeddah, SA', destination: 'Cochin, India', eta: '2026-07-02', flag: 'Singapore', riskZone: 'redsea' },
  { id: 'V005', name: 'Minerva Zenia', lat: 8.3, lng: 48.9, speed: 12.0, heading: 118, type: 'VLCC', cargo: 'Crude Oil', origin: 'Mina Al-Ahmadi, Kuwait', destination: 'Kandla, India', eta: '2026-07-03', flag: 'Greece', riskZone: 'redsea' },
  { id: 'V006', name: 'NS Bravo', lat: 4.2, lng: 45.3, speed: 14.5, heading: 125, type: 'Suezmax', cargo: 'Crude Oil', origin: 'Kharg Island, Iran', destination: 'Mangalore, India', eta: '2026-07-05', flag: 'Malta', riskZone: 'safe' },
  { id: 'V007', name: 'Advantage Atom', lat: -2.1, lng: 51.2, speed: 13.8, heading: 132, type: 'VLCC', cargo: 'Crude Oil', origin: 'Salalah, Oman', destination: 'Haldia, India', eta: '2026-07-06', flag: 'Liberia', riskZone: 'safe' },
  { id: 'V008', name: 'Salina', lat: -8.4, lng: 55.6, speed: 11.9, heading: 88, type: 'Aframax', cargo: 'Crude Oil', origin: 'Mombasa', destination: 'Chennai, India', eta: '2026-07-08', flag: 'Cyprus', riskZone: 'safe' },
  { id: 'V009', name: 'Olympic Legacy', lat: 20.3, lng: 59.7, speed: 15.2, heading: 75, type: 'VLCC', cargo: 'Crude Oil', origin: 'UAE Fujairah', destination: 'Visakhapatnam, India', eta: '2026-06-27', flag: 'Greece', riskZone: 'hormuz' },
  { id: 'V010', name: 'Kriti Ocean', lat: 17.8, lng: 61.2, speed: 13.4, heading: 92, type: 'Suezmax', cargo: 'Crude Oil', origin: 'Dubai, UAE', destination: 'Kochi, India', eta: '2026-06-30', flag: 'Greece', riskZone: 'hormuz' },
  { id: 'V011', name: 'TI Africa', lat: -15.3, lng: 42.1, speed: 14.0, heading: 45, type: 'ULCC', cargo: 'Crude Oil', origin: 'Lagos, Nigeria', destination: 'Vadinar, India', eta: '2026-07-15', flag: 'Bahamas', riskZone: 'cape' },
  { id: 'V012', name: 'Delta Captain', lat: -25.8, lng: 38.4, speed: 12.6, heading: 52, type: 'VLCC', cargo: 'Crude Oil', origin: 'Port Harcourt, Nigeria', destination: 'Mumbai, India', eta: '2026-07-18', flag: 'Liberia', riskZone: 'cape' },
]

export const ROUTES = {
  hormuz: {
    name: 'Strait of Hormuz',
    color: '#ef4444',
    points: [[56.2, 26.6], [63.5, 22.8], [68.2, 20.1], [72.6, 19.4]],
    throughput: '20M barrels/day',
    riskLevel: 78,
  },
  redsea: {
    name: 'Red Sea / Suez',
    color: '#f97316',
    points: [[44.5, 12.8], [43.2, 16.5], [40.1, 22.3], [32.5, 29.9]],
    throughput: '8M barrels/day',
    riskLevel: 65,
  },
  cape: {
    name: 'Cape of Good Hope',
    color: '#22c55e',
    points: [[18.4, -34.2], [28.3, -30.1], [38.5, -22.4], [45.2, -12.3]],
    throughput: '4M barrels/day',
    riskLevel: 12,
  },
}

export const MOCK_NEWS = [
  { id: 1, headline: 'Houthi rebels launch drone attack on commercial vessel near Bab-el-Mandeb strait', source: 'Reuters', time: '14 min ago', risk: 82, corridor: 'Red Sea', sentiment: 'critical' },
  { id: 2, headline: 'US sanctions additional Iranian oil exporters amid nuclear talks breakdown', source: 'Bloomberg', time: '1 hr ago', risk: 71, corridor: 'Hormuz', sentiment: 'high' },
  { id: 3, headline: 'OPEC+ emergency meeting called as crude prices hit 3-month high', source: 'FT', time: '2 hr ago', risk: 58, corridor: 'Global', sentiment: 'high' },
  { id: 4, headline: 'Saudi Aramco increases Asian crude allocation amid spot market tightening', source: 'S&P Global', time: '3 hr ago', risk: 34, corridor: 'Hormuz', sentiment: 'medium' },
  { id: 5, headline: 'India SPR drawdown authorized as domestic fuel prices spike', source: 'Economic Times', time: '4 hr ago', risk: 61, corridor: 'Domestic', sentiment: 'high' },
  { id: 6, headline: 'Maritime security alert issued for vessels transiting Gulf of Aden', source: 'IMB Piracy', time: '5 hr ago', risk: 74, corridor: 'Red Sea', sentiment: 'critical' },
  { id: 7, headline: 'Russia-Ukraine conflict disrupts Caspian pipeline alternative supply routes', source: 'WSJ', time: '6 hr ago', risk: 45, corridor: 'CPC Pipeline', sentiment: 'medium' },
  { id: 8, headline: 'India finalizes crude oil deal with UAE for 3-year supply agreement', source: 'PIB India', time: '8 hr ago', risk: 15, corridor: 'Hormuz', sentiment: 'positive' },
]

export const SIMULATION_SCENARIOS = {
  hormuz_closure: {
    id: 'hormuz_closure',
    name: 'Hormuz Closure',
    description: 'Strait of Hormuz fully blocked',
    icon: '🔴',
    impacts: {
      priceChange: +24.8,
      transitDelayDays: 21,
      affectedVolume: 78,
      sprDaysRemaining: 9.5,
      gdpImpact: -1.8,
      powerSectorStress: 34,
    },
    alternatives: [
      { route: 'Cape of Good Hope', viability: 72, extraDays: 21, extraCost: '+$4.2/bbl', capacity: '60%' },
      { route: 'Iraq-Turkey Pipeline', viability: 45, extraDays: 5, extraCost: '+$1.8/bbl', capacity: '15%' },
      { route: 'US Gulf Coast (spot)', viability: 58, extraDays: 28, extraCost: '+$7.1/bbl', capacity: '25%' },
    ],
  },
  redsea_shutdown: {
    id: 'redsea_shutdown',
    name: 'Red Sea Shutdown',
    description: 'Houthi attacks close Red Sea route',
    icon: '🟠',
    impacts: {
      priceChange: +12.3,
      transitDelayDays: 14,
      affectedVolume: 32,
      sprDaysRemaining: 9.5,
      gdpImpact: -0.7,
      powerSectorStress: 18,
    },
    alternatives: [
      { route: 'Cape of Good Hope', viability: 88, extraDays: 14, extraCost: '+$2.1/bbl', capacity: '90%' },
      { route: 'Sumed Pipeline Egypt', viability: 62, extraDays: 3, extraCost: '+$0.9/bbl', capacity: '40%' },
    ],
  },
  opec_cut: {
    id: 'opec_cut',
    name: 'OPEC+ Emergency Cut',
    description: '3M bpd emergency production cut',
    icon: '🟡',
    impacts: {
      priceChange: +18.5,
      transitDelayDays: 0,
      affectedVolume: 45,
      sprDaysRemaining: 9.5,
      gdpImpact: -1.2,
      powerSectorStress: 22,
    },
    alternatives: [
      { route: 'US Strategic Reserve', viability: 70, extraDays: 7, extraCost: '+$3.4/bbl', capacity: '30%' },
      { route: 'West Africa (Nigeria)', viability: 65, extraDays: 18, extraCost: '+$2.8/bbl', capacity: '35%' },
      { route: 'Kazakhstan (CPC)', viability: 55, extraDays: 12, extraCost: '+$2.2/bbl', capacity: '20%' },
    ],
  },
  energy_port_cyber_shock: {
    id: 'energy_port_cyber_shock',
    name: 'Energy Port Cyber Shock',
    description: 'Hormuz risk spike plus tanker scheduling cyber disruption at an Indian energy port',
    icon: '!',
    impacts: {
      priceChange: +31.6,
      transitDelayDays: 18,
      affectedVolume: 68,
      sprDaysRemaining: 9.5,
      gdpImpact: -2.4,
      powerSectorStress: 52,
    },
    alternatives: [
      { route: 'Cape of Good Hope + West Africa pool', viability: 76, extraDays: 18, extraCost: '+$3.4/bbl', capacity: '45%' },
      { route: 'UAE/Oman short-haul swaps', viability: 64, extraDays: 6, extraCost: '+$1.7/bbl', capacity: '25%' },
      { route: 'SPR staged release with port priority berthing', viability: 82, extraDays: 1, extraCost: '+$0.8/bbl', capacity: '30%' },
    ],
  },
  combined_crisis: {
    id: 'combined_crisis',
    name: 'Combined Crisis',
    description: 'Hormuz + Red Sea + OPEC cut simultaneously',
    icon: '⚫',
    impacts: {
      priceChange: +48.2,
      transitDelayDays: 35,
      affectedVolume: 92,
      sprDaysRemaining: 9.5,
      gdpImpact: -4.1,
      powerSectorStress: 67,
    },
    alternatives: [
      { route: 'Cape of Good Hope', viability: 40, extraDays: 35, extraCost: '+$11.4/bbl', capacity: '45%' },
      { route: 'Emergency IEA Reserves', viability: 55, extraDays: 5, extraCost: '+$5.2/bbl', capacity: '30%' },
    ],
  },
}

export const INDIA_IMPORT_STATS = {
  dailyImports: 4.7,
  sprCapacity: 44.7,
  sprCurrent: 38.2,
  sprDays: 9.5,
  topSuppliers: [
    { country: 'Iraq', share: 22, flag: '🇮🇶' },
    { country: 'Saudi Arabia', share: 18, flag: '🇸🇦' },
    { country: 'Russia', share: 35, flag: '🇷🇺' },
    { country: 'UAE', share: 8, flag: '🇦🇪' },
    { country: 'USA', share: 9, flag: '🇺🇸' },
    { country: 'Others', share: 8, flag: '🌍' },
  ],
  brentPrice: 87.42,
  priceChange24h: +2.34,
}
