import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBase?: string };

export const API_BASE = extra.apiBase ?? 'https://drishti-intel.vercel.app';

export const SUPABASE_URL = 'https://bkzbcolbucbvnvyqveoe.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJremJjb2xidWNidm52eXF2ZW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTkwOTEsImV4cCI6MjA5NzY5NTA5MX0.BtfV46CsCH32Vzw3aEGxazLMi059U_YQ3-mychZhgHA';

export const COLORS = {
  bg: '#020809',
  surface: '#031314',
  panel: '#041b1c',
  panelAlt: '#071f22',
  borderDim: '#123336',
  borderAccent: '#00d4ff',
  cyan: '#00d4ff',
  green: '#00ff87',
  amber: '#ffb800',
  red: '#ff3232',
  purple: '#b06cff',
  ink: '#eefafa',
  textHigh: '#c8eeee',
  textMid: '#7aa0a2',
  textLow: '#416365',
  segEmpty: '#0b2528',
  black: '#010506',

  bgCard: '#041b1c',
  bgCardAlt: '#071f22',
  border: '#123336',
  orange: '#ffb800',
  orangeDim: '#1f1502',
  red2: '#ff3232',
  redDim: '#210606',
  green2: '#00ff87',
  greenDim: '#022015',
  blue: '#00d4ff',
  blueDim: '#021a21',
  yellow: '#ffb800',
  yellowDim: '#1f1502',
  purple2: '#b06cff',
  purpleDim: '#140a25',
  textPrimary: '#c8eeee',
  textSecondary: '#7aa0a2',
  textMuted: '#416365',
  tabBar: '#010809',
};

export const FONT_MONO: string = Platform.select<string>({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
}) as string;

export const ROLE_OPTIONS = [
  { id: 'minister', label: 'Minister' },
  { id: 'operator', label: 'Operator' },
  { id: 'citizen', label: 'Citizen' },
];

export const SCENARIOS = [
  {
    id: 'energy_port_cyber_shock',
    name: 'PORT CYBER SHOCK',
    icon: '[!]',
    color: COLORS.red,
    dimColor: COLORS.redDim,
    shortDesc: 'Port operations degraded; tanker queues and retail rumor risk rising.',
  },
  {
    id: 'hormuz_closure',
    name: 'HORMUZ CLOSURE',
    icon: '[H]',
    color: COLORS.red,
    dimColor: COLORS.redDim,
    shortDesc: 'Strait blockade with major crude transit exposure.',
  },
  {
    id: 'redsea_shutdown',
    name: 'RED SEA ESCALATION',
    icon: '[R]',
    color: COLORS.amber,
    dimColor: COLORS.yellowDim,
    shortDesc: 'Suez rerouting adds delay, insurance cost, and schedule pressure.',
  },
  {
    id: 'opec_cut',
    name: 'OPEC+ CUT',
    icon: '[O]',
    color: COLORS.amber,
    dimColor: COLORS.yellowDim,
    shortDesc: 'Supply cut raises Brent pressure and import procurement urgency.',
  },
  {
    id: 'combined_crisis',
    name: 'COMBINED CRISIS',
    icon: '[X]',
    color: COLORS.purple,
    dimColor: COLORS.purpleDim,
    shortDesc: 'Multi-vector energy shock with agents, policy gate, and public brief.',
  },
];

export const CORRIDOR_RISKS = [
  { id: 'hormuz', name: 'STRAIT OF HORMUZ', value: 78, color: COLORS.red },
  { id: 'redsea', name: 'RED SEA / BAB-EL-MANDEB', value: 65, color: COLORS.amber },
  { id: 'cape', name: 'CAPE OF GOOD HOPE', value: 12, color: COLORS.green },
];

export const AGENT_CHAIN = [
  'Source Watchtower',
  'Corridor Sentinel',
  'Cyber Guard',
  'Nasiko',
  'Policy Gate',
  'Citizen Brief',
];
