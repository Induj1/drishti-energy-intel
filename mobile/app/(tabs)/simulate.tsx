import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, FONT_MONO, ROLE_OPTIONS, SCENARIOS } from '../../constants';
import {
  ActionButton,
  BigReadout,
  DataRow,
  MetricCard,
  Panel,
  SegBar,
  SegmentedControl,
  SourceRow,
  riskColor,
  riskLabel,
} from '../../components/hud';
import {
  resetSimulation,
  triggerSimulation,
  type AgentRunResponse,
  type SimulationResult,
} from '../../lib/api';

function policyLabel(decision?: string) {
  return (decision ?? 'human_review').replace(/_/g, ' ').toUpperCase();
}

function scenarioRisk(id: string) {
  if (id === 'combined_crisis') return 99;
  if (id === 'energy_port_cyber_shock') return 97;
  if (id === 'hormuz_closure') return 94;
  if (id === 'redsea_shutdown') return 72;
  if (id === 'opec_cut') return 65;
  return 58;
}

interface ScenarioCardProps {
  scenario: (typeof SCENARIOS)[number];
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}

function ScenarioCard({ scenario, active, disabled, onPress }: ScenarioCardProps) {
  const risk = scenarioRisk(scenario.id);
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.scenarioCard,
        {
          borderColor: active ? scenario.color : COLORS.borderDim,
          backgroundColor: active ? scenario.dimColor : COLORS.panel,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          opacity: disabled && !active ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.scenarioStrip, { backgroundColor: scenario.color }]} />
      <View style={styles.scenarioTop}>
        <Text style={[styles.scenarioIcon, { color: scenario.color }]}>{scenario.icon}</Text>
        <Text style={[styles.scenarioRisk, { color: riskColor(risk) }]}>{risk}</Text>
      </View>
      <Text style={styles.scenarioName} numberOfLines={2}>
        {scenario.name}
      </Text>
      <Text style={styles.scenarioDesc} numberOfLines={4}>
        {scenario.shortDesc}
      </Text>
      {active ? (
        <View style={[styles.activeBadge, { borderColor: scenario.color }]}>
          <Text style={[styles.activeBadgeText, { color: scenario.color }]}>ACTIVE</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

interface CrisisModalProps {
  visible: boolean;
  result: SimulationResult | null;
  run: AgentRunResponse | null;
  onDismiss: () => void;
}

function CrisisModal({ visible, result, run, onDismiss }: CrisisModalProps) {
  if (!result) return null;
  const risk = run?.overallRisk ?? scenarioRisk(result.scenario.name);
  const tone = riskColor(risk);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { borderColor: tone }]}>
          <Text style={[styles.modalAlert, { color: tone }]}>CRISIS ALERT</Text>
          <Text style={styles.modalTitle}>{result.scenario.name}</Text>
          <View style={styles.modalReadouts}>
            <BigReadout
              value={`+${result.scenario.impacts.priceChange}`}
              unit="price pct"
              color={COLORS.red}
              size={42}
            />
            <BigReadout
              value={String(result.scenario.impacts.transitDelayDays)}
              unit="delay days"
              color={COLORS.amber}
              size={42}
            />
            <BigReadout value={String(risk)} unit={riskLabel(risk)} color={tone} size={42} />
          </View>
          <Text style={styles.modalCopy}>
            {run?.policy.reason ??
              'Agent-backed crisis simulation has been broadcast to connected dashboards.'}
          </Text>
          <ActionButton label="Acknowledge" onPress={onDismiss} color={tone} variant="solid" />
        </View>
      </View>
    </Modal>
  );
}

export default function SimulateScreen() {
  const [role, setRole] = useState('minister');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [agentRun, setAgentRun] = useState<AgentRunResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario = SCENARIOS.find((s) => s.id === activeId) ?? null;
  const risk = agentRun?.overallRisk ?? (activeId ? scenarioRisk(activeId) : 0);
  const tone = risk ? riskColor(risk) : COLORS.cyan;
  const topRecs = result?.procurement?.recommendations.slice(0, 3) ?? [];

  const statusText = useMemo(() => {
    if (loading) return 'RUNNING MULTI-AGENT SIMULATION';
    if (result) return `${result.scenario.name.toUpperCase()} ACTIVE`;
    return 'SELECT A CRISIS VECTOR';
  }, [loading, result]);

  async function handleScenario(scenarioId: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAgentRun(null);
    setActiveId(scenarioId);
    try {
      const response = await triggerSimulation(scenarioId, role);
      setResult(response);
      setAgentRun(response.agentRun ?? null);
      setModalVisible(true);
    } catch {
      setError('SIMULATION FAILED. CHECK NETWORK OR BACKEND STATUS.');
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (loading) return;
    setLoading(true);
    try {
      await resetSimulation();
      setResult(null);
      setAgentRun(null);
      setActiveId(null);
      setError(null);
    } catch {
      setError('RESET FAILED. RETRY FROM A STABLE CONNECTION.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <CrisisModal
        visible={modalVisible}
        result={result}
        run={agentRun}
        onDismiss={() => setModalVisible(false)}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SCENARIO DEPLOY</Text>
          <Text style={styles.headerSub}>{statusText}</Text>
        </View>
        {risk ? (
          <View style={[styles.riskBadge, { borderColor: tone }]}>
            <Text style={[styles.riskBadgeValue, { color: tone }]}>{risk}</Text>
            <Text style={styles.riskBadgeLabel}>{riskLabel(risk)}</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Panel title="Command Role" rightLabel={role.toUpperCase()} accentColor={COLORS.cyan}>
        <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={setRole} color={COLORS.cyan} />
        <Text style={styles.roleCopy}>
          Role changes the agent response, from ministry policy to operator logistics to citizen-safe
          public guidance.
        </Text>
      </Panel>

      <View style={styles.scenarioGrid}>
        {SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            active={activeId === scenario.id}
            disabled={loading}
            onPress={() => handleScenario(scenario.id)}
          />
        ))}
      </View>

      {loading ? (
        <Panel title="Launch Sequence" rightLabel="working" accentColor={COLORS.amber}>
          <Text style={styles.loadingText}>Calling simulation, procurement, agent mesh, and policy gate...</Text>
          <SegBar value={68} color={COLORS.amber} height={8} />
        </Panel>
      ) : null}

      {result ? (
        <>
          <Panel title="Impact Telemetry" rightLabel={riskLabel(risk)} accentColor={tone}>
            <View style={styles.metricGrid}>
              <MetricCard
                label="Price Delta"
                value={`+${result.scenario.impacts.priceChange}%`}
                sub="Brent shock"
                tone={COLORS.red}
              />
              <MetricCard
                label="Delay"
                value={`${result.scenario.impacts.transitDelayDays}D`}
                sub="route impact"
                tone={COLORS.amber}
              />
            </View>
            <View style={styles.metricGrid}>
              <MetricCard
                label="SPR"
                value={`${result.scenario.impacts.sprDaysRemaining}D`}
                sub="buffer remaining"
                tone={result.scenario.impacts.sprDaysRemaining < 50 ? COLORS.red : COLORS.green}
              />
              <MetricCard
                label="Supply"
                value={`${result.scenario.impacts.affectedVolume}%`}
                sub="volume affected"
                tone={COLORS.purple}
              />
            </View>
            <DataRow
              label="GDP impact"
              value={`${result.scenario.impacts.gdpImpact}%`}
              valueColor={COLORS.red}
            />
            <DataRow
              label="Power stress"
              value={`${result.scenario.impacts.powerSectorStress}/100`}
              valueColor={riskColor(result.scenario.impacts.powerSectorStress)}
            />
          </Panel>

          <Panel title="Policy Gate" rightLabel={policyLabel(agentRun?.policy.decision)} accentColor={COLORS.amber}>
            <Text style={styles.policyReason}>
              {agentRun?.policy.reason ?? 'Policy gate is waiting for the agent mesh response.'}
            </Text>
            {(agentRun?.policy.requiredApprovals ?? ['Energy ministry duty officer']).slice(0, 3).map((approval) => (
              <DataRow key={approval} label="Approval" value={approval} valueColor={COLORS.amber} />
            ))}
          </Panel>

          <Panel title="Procurement Directive" rightLabel={`${topRecs.length} options`} accentColor={COLORS.purple}>
            <Text style={styles.procSummary}>{result.procurement.summary}</Text>
            {topRecs.map((rec, index) => {
              const color = riskColor(100 - rec.confidence);
              return (
                <View key={`${rec.supplier}-${index}`} style={styles.recCard}>
                  <View style={styles.recTop}>
                    <Text style={styles.recSupplier} numberOfLines={1}>
                      {rec.supplier}
                    </Text>
                    <Text style={[styles.recConfidence, { color }]}>{rec.confidence}%</Text>
                  </View>
                  <SegBar value={rec.confidence} color={color} height={6} />
                  <DataRow label="Route" value={rec.route} />
                  <DataRow label="Volume" value={rec.volume} />
                  <DataRow label="Timeline" value={rec.timeline} />
                  <DataRow label="Cost" value={rec.cost} />
                </View>
              );
            })}
          </Panel>

          <Panel title="Citizen Brief" rightLabel={`${Math.round((agentRun?.citizenBrief.confidence ?? 0.7) * 100)}%`} accentColor={COLORS.green}>
            <Text style={styles.briefTitle}>
              {agentRun?.citizenBrief.headline ?? 'Public fuel brief will appear after agent completion.'}
            </Text>
            <Text style={styles.briefBody}>
              {agentRun?.citizenBrief.impact ?? 'Use the Intel tab for citizen rumor checks and source links.'}
            </Text>
            {(agentRun?.citizenBrief.actions ?? []).slice(0, 3).map((action) => (
              <View key={action} style={styles.actionItem}>
                <Text style={styles.actionMarker}>OK</Text>
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </Panel>

          <Panel title="Source Proof" rightLabel={`${agentRun?.sources.length ?? 0} links`} accentColor={COLORS.green}>
            {(agentRun?.sources ?? []).slice(0, 6).map((source) => (
              <SourceRow key={source.id} source={source} />
            ))}
            {!agentRun?.sources.length ? (
              <Text style={styles.emptySource}>Source proof appears when the agent response returns.</Text>
            ) : null}
          </Panel>

          <ActionButton
            label="Abort Simulation"
            onPress={handleReset}
            color={COLORS.red}
            disabled={loading}
            style={styles.abortButton}
          />
        </>
      ) : null}
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
    paddingBottom: 40,
  },
  header: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 44,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: 20,
    color: COLORS.cyan,
    fontWeight: '700',
  },
  headerSub: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  riskBadge: {
    minWidth: 74,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  riskBadgeValue: {
    fontFamily: FONT_MONO,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  riskBadgeLabel: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    color: COLORS.textMid,
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
    fontSize: 11,
    color: COLORS.red,
    fontWeight: '700',
  },
  roleCopy: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 11,
    lineHeight: 17,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  scenarioCard: {
    width: '48.5%',
    minHeight: 170,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  scenarioStrip: {
    height: 3,
    marginHorizontal: -10,
    marginBottom: 10,
  },
  scenarioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scenarioIcon: {
    fontFamily: FONT_MONO,
    fontSize: 18,
    fontWeight: '700',
  },
  scenarioRisk: {
    fontFamily: FONT_MONO,
    fontSize: 14,
    fontWeight: '700',
  },
  scenarioName: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: COLORS.textHigh,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  scenarioDesc: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
    lineHeight: 15,
    marginTop: 7,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 'auto',
  },
  activeBadgeText: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    fontWeight: '700',
  },
  loadingText: {
    fontFamily: FONT_MONO,
    color: COLORS.amber,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  policyReason: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 8,
  },
  procSummary: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 8,
  },
  recCard: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDim,
  },
  recTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  recSupplier: {
    flex: 1,
    fontFamily: FONT_MONO,
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recConfidence: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    fontWeight: '700',
  },
  briefTitle: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  briefBody: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    padding: 9,
    marginTop: 7,
  },
  actionMarker: {
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
  emptySource: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 11,
    lineHeight: 17,
  },
  abortButton: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.panel,
    borderWidth: 2,
    borderRadius: 8,
    padding: 18,
  },
  modalAlert: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  modalReadouts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 14,
  },
  modalCopy: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
  },
});
