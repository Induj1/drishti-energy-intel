import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, FONT_MONO } from '../../constants';
import {
  ActionButton,
  DataRow,
  MetricCard,
  Panel,
  SegBar,
  SourceRow,
  StatusLight,
  riskColor,
  riskLabel,
} from '../../components/hud';
import {
  checkRumor,
  fetchLiveSummary,
  fetchMissionBrief,
  fetchNews,
  type LiveSummary,
  type MissionBrief,
  type NewsItem,
  type RumorVerdict,
} from '../../lib/api';

function sentimentColor(value: string) {
  const lower = (value ?? '').toLowerCase();
  if (lower.includes('critical') || lower.includes('negative')) return COLORS.red;
  if (lower.includes('high') || lower.includes('neutral')) return COLORS.amber;
  return COLORS.green;
}

function IntelCard({ item }: { item: NewsItem }) {
  const color = riskColor(item.risk);
  return (
    <Pressable
      onPress={() => {
        if (item.url) Linking.openURL(item.url).catch(() => undefined);
      }}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: color, transform: [{ scale: pressed && item.url ? 0.99 : 1 }] },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.riskPill, { borderColor: color }]}>
          <Text style={[styles.riskPillText, { color }]}>{String(item.risk).padStart(2, '0')}</Text>
        </View>
        <Text style={styles.headline} numberOfLines={3}>
          {item.headline}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.sourceText}>{item.source}</Text>
        <Text style={styles.metaText}>{item.time}</Text>
      </View>
      <View style={styles.tagRow}>
        <View style={styles.corridorTag}>
          <Text style={styles.corridorText}>{(item.corridor || 'GLOBAL').toUpperCase()}</Text>
        </View>
        <View style={[styles.sentimentTag, { borderColor: sentimentColor(item.sentiment) }]}>
          <Text style={[styles.sentimentText, { color: sentimentColor(item.sentiment) }]}>
            {(item.sentiment || 'watch').toUpperCase()}
          </Text>
        </View>
      </View>
      <SegBar value={item.risk} color={color} height={5} />
    </Pressable>
  );
}

export default function IntelScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [summary, setSummary] = useState<LiveSummary | null>(null);
  const [brief, setBrief] = useState<MissionBrief | null>(null);
  const [rumor, setRumor] = useState('Fuel pumps are closing tonight');
  const [verdict, setVerdict] = useState<RumorVerdict | null>(null);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    const [newsResult, summaryResult, briefResult] = await Promise.allSettled([
      fetchNews(),
      fetchLiveSummary(),
      fetchMissionBrief('energy_port_cyber_shock', 'citizen'),
    ]);

    if (newsResult.status === 'fulfilled') setNews(newsResult.value);
    if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
    if (briefResult.status === 'fulfilled') setBrief(briefResult.value);

    if (newsResult.status === 'rejected' && summaryResult.status === 'rejected') {
      throw new Error('Intel feeds unavailable');
    }

    setLastRefresh(new Date());
    setError(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => setError('SIGINT FEEDS DEGRADED'));
    }, [load])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      load().catch(() => undefined);
    }, 60000);
    return () => clearInterval(timer);
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load().catch(() => setError('SIGINT FEEDS DEGRADED'));
    setRefreshing(false);
  }

  async function runRumorCheck() {
    if (checking || !rumor.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const response = await checkRumor(rumor.trim());
      setVerdict(response);
    } catch {
      setError('RUMOR CHECK FAILED');
    } finally {
      setChecking(false);
    }
  }

  const avgRisk = useMemo(() => {
    if (!news.length) return brief?.overallRisk ?? 0;
    return Math.round(news.reduce((sum, item) => sum + item.risk, 0) / news.length);
  }, [brief, news]);

  const cyberRisk = summary?.cyber.data.portExposure[0]?.risk ?? 64;
  const sources = brief?.sources ?? summary?.news.sources ?? [];
  const formattedTime = lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>SIGINT FEED</Text>
          <Text style={styles.headerSub}>
            {String(news.length).padStart(2, '0')} SIGNALS / UPD {formattedTime}
          </Text>
        </View>
        <StatusLight color={COLORS.green} label="LIVE BRIEF" blink />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.metricGrid}>
        <MetricCard
          label="Avg Risk"
          value={avgRisk ? String(avgRisk) : '--'}
          sub={avgRisk ? riskLabel(avgRisk) : 'scanning'}
          tone={avgRisk ? riskColor(avgRisk) : COLORS.cyan}
        />
        <MetricCard
          label="Cyber Watch"
          value={String(cyberRisk)}
          sub={`${summary?.cyber.data.cisaKevCount ?? 0} KEV tracked`}
          tone={riskColor(cyberRisk)}
        />
      </View>

      <Panel
        title="Citizen Fuel Brief"
        rightLabel={`${Math.round((brief?.citizenBrief.confidence ?? 0.7) * 100)}% conf`}
        accentColor={riskColor(brief?.overallRisk ?? avgRisk ?? 58)}
      >
        <Text style={styles.briefTitle}>
          {brief?.citizenBrief.headline ?? 'Verified fuel guidance is loading.'}
        </Text>
        <Text style={styles.briefBody}>
          {brief?.citizenBrief.impact ??
            'DRISHTI is checking public energy sources, cyber signals, and agent output.'}
        </Text>
        {(brief?.citizenBrief.actions ?? [
          'Avoid panic buying.',
          'Use official price and supply advisories.',
          'Share only verified updates.',
        ]).slice(0, 3).map((action) => (
          <View key={action} style={styles.actionItem}>
            <Text style={styles.actionMarker}>OK</Text>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </Panel>

      <Panel title="Rumor Check" rightLabel="public mode" accentColor={COLORS.amber}>
        <TextInput
          value={rumor}
          onChangeText={setRumor}
          multiline
          numberOfLines={4}
          placeholder="Paste a claim to verify"
          placeholderTextColor={COLORS.textLow}
          style={styles.rumorInput}
          textAlignVertical="top"
        />
        <ActionButton
          label={checking ? 'Checking Claim' : 'Check Claim'}
          onPress={runRumorCheck}
          disabled={checking}
          color={COLORS.amber}
          variant="solid"
          style={styles.rumorButton}
        />
        {verdict ? (
          <View style={styles.verdictBox}>
            <Text style={styles.verdictTitle}>{verdict.verdict.toUpperCase()}</Text>
            <Text style={styles.verdictBody}>{verdict.explanation}</Text>
            <Text style={styles.verdictAction}>{verdict.nextAction}</Text>
            <DataRow label="Confidence" value={`${Math.round(verdict.confidence * 100)}%`} valueColor={COLORS.amber} />
          </View>
        ) : null}
      </Panel>

      <Panel title="Cyber And Port Exposure" rightLabel={summary?.cyber.dataMode.toUpperCase() ?? 'READY'} accentColor={COLORS.purple}>
        {(summary?.cyber.data.portExposure ?? [
          { asset: 'Port community system VPN', status: 'fallback cyber watch', risk: 65 },
        ]).slice(0, 4).map((asset) => (
          <View key={asset.asset} style={styles.exposureRow}>
            <View style={styles.exposureTop}>
              <Text style={styles.exposureName} numberOfLines={1}>
                {asset.asset}
              </Text>
              <Text style={[styles.exposureRisk, { color: riskColor(asset.risk) }]}>{asset.risk}</Text>
            </View>
            <Text style={styles.exposureStatus} numberOfLines={2}>
              {asset.status}
            </Text>
            <SegBar value={asset.risk} color={riskColor(asset.risk)} height={5} />
          </View>
        ))}
      </Panel>

      <Panel title="Source Proof" rightLabel={`${sources.length} links`} accentColor={COLORS.green}>
        {sources.slice(0, 7).map((source) => (
          <SourceRow key={source.id} source={source} />
        ))}
        {!sources.length ? (
          <Text style={styles.emptySources}>Live source chips will appear after the next refresh.</Text>
        ) : null}
      </Panel>

      <Panel title="Signal Feed" rightLabel={`${news.length} items`} accentColor={COLORS.cyan}>
        {news.length ? (
          news.slice(0, 12).map((item) => <IntelCard key={item.id} item={item} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>~~~</Text>
            <Text style={styles.emptyText}>SCANNING INTELLIGENCE CHANNELS...</Text>
          </View>
        )}
      </Panel>
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
    paddingBottom: 34,
  },
  header: {
    minHeight: 86,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    paddingTop: 44,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
    marginBottom: 12,
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
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  briefTitle: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  briefBody: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
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
  rumorInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    color: COLORS.textHigh,
    fontFamily: FONT_MONO,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  rumorButton: {
    marginTop: 10,
  },
  verdictBox: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
    paddingLeft: 10,
    marginTop: 12,
  },
  verdictTitle: {
    fontFamily: FONT_MONO,
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '700',
  },
  verdictBody: {
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  verdictAction: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  exposureRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  exposureTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 3,
  },
  exposureName: {
    flex: 1,
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 12,
    fontWeight: '700',
  },
  exposureRisk: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    fontWeight: '700',
  },
  exposureStatus: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  emptySources: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 11,
    lineHeight: 17,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderLeftWidth: 4,
    borderRadius: 6,
    padding: 11,
    marginBottom: 9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  riskPill: {
    minWidth: 38,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  riskPillText: {
    fontFamily: FONT_MONO,
    fontSize: 13,
    fontWeight: '700',
  },
  headline: {
    flex: 1,
    fontFamily: FONT_MONO,
    color: COLORS.textHigh,
    fontSize: 11,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  sourceText: {
    fontFamily: FONT_MONO,
    color: COLORS.cyan,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaText: {
    flex: 1,
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 9,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
    marginBottom: 8,
  },
  corridorTag: {
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  corridorText: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 8,
    fontWeight: '700',
  },
  sentimentTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  sentimentText: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 42,
    gap: 12,
  },
  emptyIcon: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 24,
  },
  emptyText: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 10,
  },
});
