import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import {
  AGENT_CHAIN,
  COLORS,
  CORRIDOR_RISKS,
  FONT_MONO,
  ROLE_OPTIONS,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '../../constants';
import {
  ActionButton,
  BigReadout,
  DataRow,
  MetricCard,
  Panel,
  SegBar,
  SegmentedControl,
  SourceRow,
  StatusLight,
  riskColor,
  riskLabel,
} from '../../components/hud';
import {
  fetchLiveSummary,
  fetchSPR,
  fetchVessels,
  resetSimulation,
  runAgentMesh,
  triggerSimulation,
  type AgentRunResponse,
  type LiveSummary,
  type SimulationResult,
  type SPRData,
} from '../../lib/api';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RISK_MAP: Record<string, number> = {
  hormuz_closure: 94,
  redsea_shutdown: 72,
  opec_cut: 65,
  energy_port_cyber_shock: 97,
  combined_crisis: 99,
};

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function formatDecision(decision?: string) {
  return (decision ?? 'armed').replace(/_/g, ' ').toUpperCase();
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function fallbackStep(index: number) {
  return {
    id: `fallback-${index}`,
    agentName: AGENT_CHAIN[index],
    status: index < 2 ? 'completed' : 'queued',
    summary:
      index === 0
        ? 'Watching public energy, port, weather, and cyber sources.'
        : index === 1
        ? 'Overlaying corridors, vessels, and chokepoint risk.'
        : 'Ready for the next mobile command run.',
    confidence: index < 2 ? 0.78 : 0.65,
  } as const;
}

export default function WarRoomScreen() {
  const [role, setRole] = useState('minister');
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [agentRun, setAgentRun] = useState<AgentRunResponse | null>(null);
  const [liveSummary, setLiveSummary] = useState<LiveSummary | null>(null);
  const [sprData, setSprData] = useState<SPRData | null>(null);
  const [vesselCount, setVesselCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [liveViewers, setLiveViewers] = useState(1);
  const [rtConnected, setRtConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const loadTelemetry = useCallback(async () => {
    const [spr, vessels, summary] = await Promise.allSettled([
      fetchSPR(),
      fetchVessels(),
      fetchLiveSummary(),
    ]);

    if (spr.status === 'fulfilled') setSprData(spr.value);
    if (vessels.status === 'fulfilled') setVesselCount(vessels.value.length);
    if (summary.status === 'fulfilled') setLiveSummary(summary.value);

    if (summary.status === 'rejected' && vessels.status === 'rejected') {
      throw new Error('Live telemetry unavailable');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadTelemetry().catch(() => setError('LIVE TELEMETRY DEGRADED'));
    const telemetryTimer = setInterval(() => {
      loadTelemetry().catch(() => undefined);
    }, 60000);
    const metTimer = setInterval(() => setElapsed((s) => s + 1), 1000);

    return () => {
      mounted.current = false;
      clearInterval(telemetryTimer);
      clearInterval(metTimer);
    };
  }, [loadTelemetry]);

  useEffect(() => {
    const simChannel = supabase
      .channel('mobile_simulation_results')
      .on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table: 'simulation_results' } as never,
        (payload: {
          eventType?: string;
          new?: {
            scenario_id?: string;
            scenario_data?: SimulationResult['scenario'];
            procurement_data?: SimulationResult['procurement'];
            active?: boolean;
          };
        }) => {
          if (!mounted.current) return;
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new?.active) {
            setActiveScenario(payload.new.scenario_id ?? null);
            if (payload.new.scenario_data && payload.new.procurement_data) {
              setSimulationResult({
                scenario: payload.new.scenario_data,
                procurement: payload.new.procurement_data,
              });
            }
          }
          if (payload.eventType === 'DELETE' || payload.new?.active === false) {
            setActiveScenario(null);
            setSimulationResult(null);
          }
        }
      )
      .subscribe((status) => setRtConnected(status === 'SUBSCRIBED'));

    const presenceKey = Math.random().toString(36).slice(2);
    const presenceChannel = supabase.channel('mobile_war_room_presence', {
      config: { presence: { key: presenceKey } },
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setLiveViewers(Object.keys(presenceChannel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ joined_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(simChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadTelemetry();
    } catch {
      setError('LIVE TELEMETRY DEGRADED');
    } finally {
      setRefreshing(false);
    }
  }, [loadTelemetry]);

  const runAgents = useCallback(async () => {
    if (agentRunning) return;
    setAgentRunning(true);
    setError(null);
    try {
      const run = await runAgentMesh(activeScenario ?? 'energy_port_cyber_shock', role);
      setAgentRun(run);
      setActiveScenario(run.scenarioId);
    } catch {
      setError('AGENT MESH FAILED TO START');
    } finally {
      setAgentRunning(false);
    }
  }, [activeScenario, agentRunning, role]);

  const runDemo = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setError(null);
    try {
      await resetSimulation().catch(() => undefined);
      const result = await triggerSimulation('energy_port_cyber_shock', role);
      setSimulationResult(result);
      setAgentRun(result.agentRun ?? null);
      setActiveScenario('energy_port_cyber_shock');
      await loadTelemetry().catch(() => undefined);
    } catch {
      setError('DEMO MODE FAILED TO LAUNCH');
    } finally {
      setDemoRunning(false);
    }
  }, [demoRunning, loadTelemetry, role]);

  const clearDemo = useCallback(async () => {
    setError(null);
    await resetSimulation().catch(() => setError('RESET REQUEST FAILED'));
    setActiveScenario(null);
    setSimulationResult(null);
    setAgentRun(null);
  }, []);

  const risk = useMemo(() => {
    if (agentRun?.overallRisk) return agentRun.overallRisk;
    if (activeScenario) return RISK_MAP[activeScenario] ?? 58;
    return liveSummary?.energy.data.domesticImpact.petrolStressIndex ?? 47;
  }, [activeScenario, agentRun, liveSummary]);

  const tone = riskColor(risk);
  const brent = liveSummary?.energy.data.brent.usdPerBarrel ?? 87.4;
  const brentImpact = simulationResult?.scenario.impacts.priceChange ?? 0;
  const sprDays = sprData?.daysRemaining ?? simulationResult?.scenario.impacts.sprDaysRemaining ?? 64;
  const summary = agentRun?.sourceSummary ?? liveSummary?.sourceSummary;
  const verifiedSources = (summary?.live ?? 0) + (summary?.cached ?? 0);
  const totalSources = summary?.total ?? 0;
  const policy = formatDecision(agentRun?.policy.decision);
  const sources = agentRun?.sources ?? liveSummary?.energy.sources ?? [];
  const steps =
    agentRun?.steps.length
      ? agentRun.steps
      : AGENT_CHAIN.map((_, index) => fallbackStep(index));

  const corridors =
    liveSummary?.corridors.data.corridors.map((c) => ({
      id: c.id,
      name: c.name.toUpperCase(),
      value: activeScenario ? Math.min(100, c.risk + 12) : c.risk,
      color: riskColor(activeScenario ? Math.min(100, c.risk + 12) : c.risk),
      signal: c.signal,
    })) ??
    CORRIDOR_RISKS.map((c) => ({
      ...c,
      value: activeScenario ? Math.min(100, c.value + 12) : c.value,
      signal: 'operational',
    }));

  const brief = agentRun?.citizenBrief;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={COLORS.cyan}
          colors={[COLORS.cyan]}
        />
      }
    >
      <View style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerKicker}>SENTINELMESH MOBILE</Text>
          <Text style={styles.headerMeta}>MET {formatElapsed(elapsed)}</Text>
        </View>
        <StatusLight
          color={rtConnected ? COLORS.green : COLORS.amber}
          label={rtConnected ? `SYNC ${liveViewers}` : 'LOCAL'}
          blink={rtConnected}
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Panel title="Composite Threat Index" rightLabel={activeScenario ? 'SIM ACTIVE' : 'LIVE WATCH'} accentColor={tone}>
        <View style={styles.riskRow}>
          <BigReadout value={String(risk)} unit={riskLabel(risk)} color={tone} size={64} />
          <View style={styles.riskDetails}>
            <Text style={styles.riskCopy}>
              {agentRun?.scenarioName ??
                simulationResult?.scenario.name ??
                'India energy security command layer is watching live sources.'}
            </Text>
            <SegBar value={risk} color={tone} height={9} />
            <View style={styles.statusLine}>
              <StatusLight color={tone} label={riskLabel(risk)} blink={risk >= 80} />
              <Text style={styles.statusMuted}>{policy}</Text>
            </View>
          </View>
        </View>

        <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={setRole} color={COLORS.cyan} />
        <View style={styles.actionRow}>
          <ActionButton
            label={demoRunning ? 'Running Demo' : 'Run Winning Demo'}
            onPress={runDemo}
            disabled={demoRunning}
            color={COLORS.cyan}
            variant="solid"
            style={styles.actionHalf}
          />
          <ActionButton
            label={agentRunning ? 'Agents Running' : 'Run Agent Mesh'}
            onPress={runAgents}
            disabled={agentRunning}
            color={COLORS.purple}
            style={styles.actionHalf}
          />
        </View>
        {activeScenario ? (
          <ActionButton label="Clear Simulation" onPress={clearDemo} color={COLORS.red} style={styles.clearButton} />
        ) : null}
      </Panel>

      <View style={styles.metricGrid}>
        <MetricCard
          label="Brent Crude"
          value={formatMoney(brent * (1 + brentImpact / 100))}
          sub={brentImpact ? `shock +${brentImpact}%` : liveSummary?.energy.data.brent.changeLabel ?? 'latest close'}
          tone={brentImpact ? COLORS.red : COLORS.amber}
        />
        <MetricCard
          label="SPR Buffer"
          value={`${sprDays}D`}
          sub={`${sprData?.currentLevel ?? 346}M bbl available`}
          tone={sprDays < 50 ? COLORS.red : COLORS.green}
        />
      </View>
      <View style={styles.metricGrid}>
        <MetricCard
          label="Vessels"
          value={String(vesselCount || liveSummary?.vessels.data.vessels.length || 0)}
          sub={liveSummary?.vessels.data.aisConfigured ? 'AIS configured' : 'safe vessel sample'}
          tone={COLORS.cyan}
        />
        <MetricCard
          label="Sources"
          value={`${verifiedSources}/${totalSources || '--'}`}
          sub={`${Math.round((summary?.averageConfidence ?? 0.78) * 100)}% confidence`}
          tone={COLORS.green}
        />
      </View>

      <Panel title="Mission Graph" rightLabel={`${steps.length} agents`} accentColor={COLORS.green}>
        {steps.map((step, index) => {
          const color =
            step.status === 'failed'
              ? COLORS.red
              : step.status === 'needs_approval'
              ? COLORS.amber
              : step.status === 'completed'
              ? COLORS.green
              : COLORS.cyan;
          return (
            <View key={`${step.agentName}-${index}`} style={styles.agentStep}>
              <View style={[styles.agentIndex, { borderColor: color }]}>
                <Text style={[styles.agentIndexText, { color }]}>{pad2(index + 1)}</Text>
              </View>
              <View style={styles.agentBody}>
                <View style={styles.agentTop}>
                  <Text style={styles.agentName} numberOfLines={1}>
                    {step.agentName}
                  </Text>
                  <Text style={[styles.agentConfidence, { color }]}>
                    {Math.round(step.confidence * 100)}%
                  </Text>
                </View>
                <Text style={styles.agentSummary} numberOfLines={2}>
                  {step.summary}
                </Text>
              </View>
            </View>
          );
        })}
      </Panel>

      <Panel title="Citizen Impact" rightLabel="public mode" accentColor={COLORS.purple}>
        <Text style={styles.briefTitle}>
          {brief?.headline ?? 'Run the agent mesh to generate household fuel guidance.'}
        </Text>
        <Text style={styles.briefBody}>
          {brief?.impact ??
            'Mobile command mode keeps policy, operator, and citizen outputs together so field teams can move fast without losing source proof.'}
        </Text>
        <View style={styles.actionStack}>
          {(brief?.actions ?? [
            'Use official supply and price advisories.',
            'Avoid panic buying and duplicate rumor forwards.',
            'Share only verified DRISHTI brief links.',
          ]).slice(0, 3).map((action) => (
            <View key={action} style={styles.actionItem}>
              <Text style={styles.actionBullet}>OK</Text>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
      </Panel>

      <Panel title="Corridor Risk Telemetry" rightLabel="marine watch" accentColor={COLORS.amber}>
        {corridors.map((corridor) => (
          <View key={corridor.id ?? corridor.name} style={styles.corridorRow}>
            <View style={styles.corridorTop}>
              <Text style={styles.corridorName} numberOfLines={1}>
                {corridor.name}
              </Text>
              <Text style={[styles.corridorValue, { color: corridor.color }]}>{corridor.value}</Text>
            </View>
            <SegBar value={corridor.value} color={corridor.color} height={7} />
            <Text style={styles.corridorSignal} numberOfLines={1}>
              {corridor.signal}
            </Text>
          </View>
        ))}
      </Panel>

      <Panel title="Trust Stack" rightLabel={`${sources.length || 0} links`} accentColor={COLORS.green}>
        {(sources.length ? sources : liveSummary?.news.sources ?? []).slice(0, 6).map((source) => (
          <SourceRow key={source.id} source={source} />
        ))}
        {!sources.length && !liveSummary?.news.sources.length ? (
          <>
            <DataRow label="FRED Brent" value="standby" valueColor={COLORS.cyan} />
            <DataRow label="PPAC India" value="standby" valueColor={COLORS.cyan} />
            <DataRow label="CISA KEV" value="standby" valueColor={COLORS.cyan} />
          </>
        ) : null}
      </Panel>

      <View style={styles.footerRow}>
        <StatusLight color={COLORS.green} label="API ONLINE" />
        <StatusLight color={COLORS.cyan} label="RT SYNC" blink={rtConnected} />
        <StatusLight color={COLORS.green} label="POLICY GATE" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 10,
    paddingBottom: 32,
  },
  header: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 42,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
    marginBottom: 10,
  },
  logo: {
    width: 72,
    height: 36,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerKicker: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 12,
    fontWeight: '700',
  },
  headerMeta: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 10,
    marginTop: 2,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: COLORS.red,
    backgroundColor: COLORS.redDim,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    fontFamily: FONT_MONO,
    color: COLORS.red,
    fontSize: 11,
    fontWeight: '700',
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  riskDetails: {
    flex: 1,
    gap: 9,
  },
  riskCopy: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 12,
    lineHeight: 17,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusMuted: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionHalf: {
    flex: 1,
  },
  clearButton: {
    marginTop: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  agentStep: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  agentIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  agentIndexText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  agentBody: {
    flex: 1,
    minWidth: 0,
  },
  agentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  agentName: {
    flex: 1,
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  agentConfidence: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    fontWeight: '700',
  },
  agentSummary: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 10,
    lineHeight: 15,
  },
  briefTitle: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  briefBody: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  actionStack: {
    gap: 8,
    marginTop: 12,
  },
  actionItem: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    padding: 10,
  },
  actionBullet: {
    fontFamily: FONT_MONO,
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
  },
  actionText: {
    flex: 1,
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 11,
    lineHeight: 16,
  },
  corridorRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  corridorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  corridorName: {
    flex: 1,
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 11,
    fontWeight: '700',
  },
  corridorValue: {
    fontFamily: FONT_MONO,
    fontSize: 13,
    fontWeight: '700',
  },
  corridorSignal: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 10,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDim,
  },
});
