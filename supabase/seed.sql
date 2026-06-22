-- ─────────────────────────────────────────────────────────────────────────────
-- DRISHTI seed data
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Vessels (12 oil tankers) ──────────────────────────────────────────────────
insert into public.vessels (id, name, lat, lng, speed, type, cargo, origin, destination, eta, risk_zone) values
  ('V001', 'Maharaja Agrasen',  26.5,  56.3, 14.2, 'VLCC',    'Crude Oil', 'Ras Tanura, SA',         'Vadinar, India',        '2026-06-28', 'hormuz'),
  ('V002', 'BW Messinia',       23.1,  62.4, 12.8, 'Suezmax', 'Crude Oil', 'Basra, Iraq',            'Paradip, India',        '2026-06-29', 'hormuz'),
  ('V003', 'SCF Yenisei',       15.2,  52.1, 11.4, 'VLCC',    'Crude Oil', 'Yanbu, SA',              'Mumbai, India',         '2026-07-01', 'redsea'),
  ('V004', 'Pacific Mimosa',    12.5,  44.8, 13.1, 'Aframax', 'Crude Oil', 'Jeddah, SA',             'Cochin, India',         '2026-07-02', 'redsea'),
  ('V005', 'Minerva Zenia',      8.3,  48.9, 12.0, 'VLCC',    'Crude Oil', 'Mina Al-Ahmadi, Kuwait', 'Kandla, India',         '2026-07-03', 'redsea'),
  ('V006', 'NS Bravo',           4.2,  45.3, 14.5, 'Suezmax', 'Crude Oil', 'Kharg Island, Iran',     'Mangalore, India',      '2026-07-05', 'safe'),
  ('V007', 'Advantage Atom',    -2.1,  51.2, 13.8, 'VLCC',    'Crude Oil', 'Salalah, Oman',          'Haldia, India',         '2026-07-06', 'safe'),
  ('V008', 'Salina',            -8.4,  55.6, 11.9, 'Aframax', 'Crude Oil', 'Mombasa',                'Chennai, India',        '2026-07-08', 'safe'),
  ('V009', 'Olympic Legacy',    20.3,  59.7, 15.2, 'VLCC',    'Crude Oil', 'UAE Fujairah',           'Visakhapatnam, India',  '2026-06-27', 'hormuz'),
  ('V010', 'Kriti Ocean',       17.8,  61.2, 13.4, 'Suezmax', 'Crude Oil', 'Dubai, UAE',             'Kochi, India',          '2026-06-30', 'hormuz'),
  ('V011', 'TI Africa',        -15.3,  42.1, 14.0, 'ULCC',    'Crude Oil', 'Lagos, Nigeria',         'Vadinar, India',        '2026-07-15', 'cape'),
  ('V012', 'Delta Captain',    -25.8,  38.4, 12.6, 'VLCC',    'Crude Oil', 'Port Harcourt, Nigeria', 'Mumbai, India',         '2026-07-18', 'cape')
on conflict (id) do nothing;

-- ── Risk feed (geopolitical intelligence) ────────────────────────────────────
insert into public.risk_feed (headline, source, corridor, risk_score, time_label) values
  ('Houthi rebels launch drone attack on commercial vessel near Bab-el-Mandeb strait', 'Reuters',        'Red Sea',    82, '14 min ago'),
  ('US sanctions additional Iranian oil exporters amid nuclear talks breakdown',        'Bloomberg',      'Hormuz',     71, '1 hr ago'),
  ('OPEC+ emergency meeting called as crude prices hit 3-month high',                   'FT',             'Global',     58, '2 hr ago'),
  ('Saudi Aramco increases Asian crude allocation amid spot market tightening',          'S&P Global',     'Hormuz',     34, '3 hr ago'),
  ('India SPR drawdown authorized as domestic fuel prices spike',                        'Economic Times', 'Domestic',   61, '4 hr ago'),
  ('Maritime security alert issued for vessels transiting Gulf of Aden',                 'IMB Piracy',     'Red Sea',    74, '5 hr ago'),
  ('Russia-Ukraine conflict disrupts Caspian pipeline alternative supply routes',        'WSJ',            'CPC Pipeline', 45, '6 hr ago'),
  ('India finalizes crude oil deal with UAE for 3-year supply agreement',               'PIB India',      'Hormuz',     15, '8 hr ago')
on conflict do nothing;
