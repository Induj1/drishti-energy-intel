import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, FONT_MONO } from '../../constants';
import {
  DataRow,
  MetricCard,
  Panel,
  SegBar,
  SourceRow,
  StatusLight,
  riskColor,
} from '../../components/hud';
import {
  fetchLiveSummary,
  fetchVessels,
  type LiveSummary,
  type Vessel,
} from '../../lib/api';

function zoneRisk(zone: string): number {
  const z = (zone ?? '').toLowerCase();
  if (z.includes('hormuz')) return 88;
  if (z.includes('red')) return 72;
  if (z.includes('cape')) return 28;
  return 18;
}

function zoneLabel(zone: string): string {
  const z = (zone ?? '').toLowerCase();
  if (z.includes('hormuz')) return 'HORMUZ';
  if (z.includes('red')) return 'RED SEA';
  if (z.includes('cape')) return 'CAPE';
  return 'SAFE';
}

function VesselCard({ item }: { item: Vessel }) {
  const risk = zoneRisk(item.riskZone);
  const color = riskColor(risk);
  const confidence = Math.round((item.confidence ?? 0.58) * 100);

  return (
    <View style={styles.card}>
      <View style={[styles.leftBar, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.nameBlock}>
            <Text style={styles.vesselName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.vesselMeta} numberOfLines={1}>
              {item.type} / {item.cargo}
            </Text>
          </View>
          <View style={[styles.zoneBadge, { borderColor: color }]}>
            <Text style={[styles.zoneBadgeText, { color }]}>{zoneLabel(item.riskZone)}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <Text style={styles.routeCity} numberOfLines={1}>
            {item.origin}
          </Text>
          <Text style={styles.routeArrow}>-&gt;</Text>
          <Text style={[styles.routeCity, styles.routeDest]} numberOfLines={1}>
            {item.destination}
          </Text>
        </View>

        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>SOURCE CONFIDENCE</Text>
          <Text style={[styles.confidenceValue, { color: riskColor(100 - confidence) }]}>
            {confidence}%
          </Text>
        </View>
        <SegBar value={confidence} color={riskColor(100 - confidence)} height={6} />

        <View style={styles.dataBlock}>
          <DataRow label="ETA" value={item.eta} />
          <DataRow label="Speed" value={`${item.speed.toFixed(1)} kt`} />
          <DataRow label="Coords" value={`${item.lat.toFixed(2)} / ${item.lng.toFixed(2)}`} />
          {typeof item.heading === 'number' ? (
            <DataRow label="Heading" value={`${Math.round(item.heading)} deg`} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function VesselsScreen() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [summary, setSummary] = useState<LiveSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const live = await fetchLiveSummary();
      setSummary(live);
      setVessels(live.vessels.data.vessels);
      setError(null);
    } catch {
      try {
        const data = await fetchVessels();
        setVessels(data);
        setError('LIVE SUMMARY DEGRADED. USING VESSEL ENDPOINT.');
      } catch {
        setError('VESSEL TELEMETRY UNAVAILABLE');
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const stats = useMemo(() => {
    const high = vessels.filter((v) => zoneRisk(v.riskZone) >= 70).length;
    const avgConfidence = vessels.length
      ? Math.round(
          (vessels.reduce((sum, v) => sum + (v.confidence ?? 0.58), 0) / vessels.length) * 100
        )
      : 0;
    const modes = summary?.vessels.dataMode.toUpperCase() ?? 'SIMULATED';
    return { high, avgConfidence, modes };
  }, [summary, vessels]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>ASSET TRACKING</Text>
          <Text style={styles.headerSub}>
            {String(vessels.length).padStart(2, '0')} UNITS / {stats.modes}
          </Text>
        </View>
        <StatusLight color={COLORS.green} label="TRACKING" blink />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={vessels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VesselCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.metricGrid}>
              <MetricCard
                label="High Risk"
                value={String(stats.high)}
                sub="corridor exposure"
                tone={stats.high ? COLORS.red : COLORS.green}
              />
              <MetricCard
                label="Confidence"
                value={`${stats.avgConfidence || '--'}%`}
                sub={summary?.vessels.data.aisConfigured ? 'AIS enabled' : 'public evidence'}
                tone={stats.avgConfidence >= 70 ? COLORS.green : COLORS.amber}
              />
            </View>

            {summary?.vessels.data.caveat ? (
              <Panel title="Evidence Caveat" rightLabel={summary.vessels.dataMode.toUpperCase()} accentColor={COLORS.amber}>
                <Text style={styles.caveatText}>{summary.vessels.data.caveat}</Text>
              </Panel>
            ) : null}
          </View>
        }
        ListFooterComponent={
          summary?.vessels.sources.length ? (
            <Panel title="Port And AIS Sources" rightLabel={`${summary.vessels.sources.length} links`} accentColor={COLORS.green}>
              {summary.vessels.sources.slice(0, 5).map((source) => (
                <SourceRow key={source.id} source={source} />
              ))}
            </Panel>
          ) : null
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>[ - ]</Text>
              <Text style={styles.emptyText}>ACQUIRING VESSEL TELEMETRY...</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    minHeight: 86,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: 19,
    color: COLORS.cyan,
    fontWeight: '700',
  },
  headerSub: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
    marginTop: 4,
  },
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.red,
    backgroundColor: COLORS.redDim,
    borderRadius: 6,
    padding: 10,
  },
  errorText: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: COLORS.red,
    fontWeight: '700',
  },
  list: {
    padding: 10,
    gap: 10,
    paddingBottom: 32,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  caveatText: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 11,
    lineHeight: 17,
  },
  card: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  leftBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  vesselName: {
    fontFamily: FONT_MONO,
    fontSize: 13,
    color: COLORS.cyan,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vesselMeta: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  zoneBadge: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  zoneBadgeText: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  routeCity: {
    flex: 1,
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textHigh,
    textTransform: 'uppercase',
  },
  routeDest: {
    textAlign: 'right',
  },
  routeArrow: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: COLORS.textMid,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  confidenceLabel: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
  },
  confidenceValue: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  dataBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDim,
    marginTop: 10,
    paddingTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    fontFamily: FONT_MONO,
    fontSize: 26,
    color: COLORS.textMid,
  },
  emptyText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
  },
});
