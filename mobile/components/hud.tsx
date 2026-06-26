import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS, FONT_MONO } from '../constants';
import type { SourceRef } from '../lib/api';

const BRACKET_SIZE = 10;
const BRACKET_THICK = 2;
const SEG_COUNT = 20;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function CornerBrackets({ color = COLORS.borderAccent }: { color?: string }) {
  return (
    <>
      <View style={[styles.corner, styles.cornerTL]}>
        <View style={[styles.cornerH, { backgroundColor: color }]} />
        <View style={[styles.cornerV, { backgroundColor: color }]} />
      </View>
      <View style={[styles.corner, styles.cornerTR]}>
        <View style={[styles.cornerH, { backgroundColor: color }]} />
        <View style={[styles.cornerV, { backgroundColor: color }]} />
      </View>
      <View style={[styles.corner, styles.cornerBL]}>
        <View style={[styles.cornerV, { backgroundColor: color }]} />
        <View style={[styles.cornerH, { backgroundColor: color }]} />
      </View>
      <View style={[styles.corner, styles.cornerBR]}>
        <View style={[styles.cornerV, { backgroundColor: color }]} />
        <View style={[styles.cornerH, { backgroundColor: color }]} />
      </View>
    </>
  );
}

interface PanelProps {
  title?: string;
  rightLabel?: string;
  children: React.ReactNode;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Panel({
  title,
  rightLabel,
  children,
  accentColor = COLORS.cyan,
  style,
  contentStyle,
}: PanelProps) {
  return (
    <View style={[styles.panel, style]}>
      <CornerBrackets color={accentColor} />
      {title ? (
        <View style={styles.panelTitleRow}>
          <Text style={[styles.panelTitle, { color: accentColor }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.panelRule, { backgroundColor: `${accentColor}33` }]} />
          {rightLabel ? (
            <Text style={styles.panelRightLabel} numberOfLines={1}>
              {rightLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.panelContent, contentStyle]}>{children}</View>
    </View>
  );
}

interface SegBarProps {
  value: number;
  color: string;
  height?: number;
  total?: number;
}

export function SegBar({ value, color, height = 8, total = SEG_COUNT }: SegBarProps) {
  const filled = Math.round((clamp(value) / 100) * total);
  return (
    <View style={[styles.segBarRow, { height }]}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segBlock,
            {
              height,
              backgroundColor: i < filled ? color : COLORS.segEmpty,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface StatusLightProps {
  color: string;
  label: string;
  blink?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StatusLight({ color, label, blink = false, style }: StatusLightProps) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!blink) {
      anim.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.25,
          duration: 520,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink, anim]);

  return (
    <View style={[styles.statusLightRow, style]}>
      <Animated.View
        style={[
          styles.statusDot,
          {
            backgroundColor: color,
            opacity: blink ? anim : 1,
            shadowColor: color,
          },
        ]}
      />
      <Text style={[styles.statusLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface DataRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

export function DataRow({ label, value, valueColor }: DataRowProps) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.dataValue, valueColor ? { color: valueColor } : undefined]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

interface BigReadoutProps {
  value: string;
  unit: string;
  color?: string;
  size?: number;
}

export function BigReadout({ value, unit, color, size = 58 }: BigReadoutProps) {
  const c = color ?? COLORS.cyan;
  return (
    <View style={styles.bigReadoutWrap}>
      <Text style={[styles.bigReadoutValue, { color: c, fontSize: size, lineHeight: size + 4 }]}>
        {value}
      </Text>
      <Text style={styles.bigReadoutUnit} numberOfLines={1}>
        {unit}
      </Text>
    </View>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
  style?: StyleProp<ViewStyle>;
}

export function MetricCard({ label, value, tone = COLORS.cyan, sub, style }: MetricCardProps) {
  return (
    <View style={[styles.metricCard, style]}>
      <View style={[styles.metricStrip, { backgroundColor: tone }]} />
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? (
        <Text style={styles.metricSub} numberOfLines={2}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ActionButton({
  label,
  onPress,
  color = COLORS.cyan,
  disabled = false,
  variant = 'outline',
  style,
  textStyle,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          borderColor: disabled ? COLORS.borderDim : color,
          backgroundColor:
            variant === 'solid' ? `${color}22` : disabled ? COLORS.surface : 'transparent',
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.actionButtonText, { color: disabled ? COLORS.textLow : color }, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface SegmentedControlProps<T extends string> {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  color?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  color = COLORS.cyan,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((item) => {
        const active = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.segmentButton,
              active && { backgroundColor: `${color}1f`, borderColor: color },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={[styles.segmentLabel, { color: active ? color : COLORS.textMid }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface SourceRowProps {
  source: SourceRef;
}

function modeColor(mode: SourceRef['mode']) {
  if (mode === 'live') return COLORS.green;
  if (mode === 'cached') return COLORS.cyan;
  if (mode === 'simulated') return COLORS.amber;
  return COLORS.red;
}

export function SourceRow({ source }: SourceRowProps) {
  const color = modeColor(source.mode);
  return (
    <Pressable
      onPress={() => {
        if (source.url) Linking.openURL(source.url).catch(() => undefined);
      }}
      style={({ pressed }) => [styles.sourceRow, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      <View style={[styles.sourceModeDot, { backgroundColor: color }]} />
      <View style={styles.sourceMain}>
        <Text style={styles.sourceTitle} numberOfLines={1}>
          {source.title}
        </Text>
        <Text style={styles.sourceProvider} numberOfLines={1}>
          {source.provider} / {source.mode.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.sourceConfidence, { color }]}>{Math.round(source.confidence * 100)}%</Text>
    </Pressable>
  );
}

export function riskColor(score: number) {
  if (score >= 80) return COLORS.red;
  if (score >= 60) return COLORS.amber;
  if (score >= 40) return COLORS.amber;
  return COLORS.green;
}

export function riskLabel(score: number) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'ELEVATED';
  return 'NOMINAL';
}

const textBase: TextStyle = {
  fontFamily: FONT_MONO,
  letterSpacing: 0,
  textTransform: 'uppercase',
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  panelTitle: {
    ...textBase,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  panelRule: {
    flex: 1,
    height: 1,
  },
  panelRightLabel: {
    ...textBase,
    color: COLORS.textMid,
    fontSize: 9,
    maxWidth: 110,
  },
  panelContent: {
    padding: 12,
  },
  corner: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    zIndex: 2,
  },
  cornerTL: { top: -1, left: -1 },
  cornerTR: { top: -1, right: -1 },
  cornerBL: { bottom: -1, left: -1 },
  cornerBR: { bottom: -1, right: -1 },
  cornerH: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_THICK,
    top: 0,
    left: 0,
  },
  cornerV: {
    position: 'absolute',
    width: BRACKET_THICK,
    height: BRACKET_SIZE,
    top: 0,
    left: 0,
  },
  segBarRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  segBlock: {
    flex: 1,
    borderRadius: 1,
  },
  statusLightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  statusLabel: {
    ...textBase,
    fontSize: 10,
    flexShrink: 1,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  dataLabel: {
    ...textBase,
    fontSize: 10,
    color: COLORS.textMid,
    flex: 1,
  },
  dataValue: {
    ...textBase,
    fontSize: 12,
    color: COLORS.textHigh,
    textAlign: 'right',
    maxWidth: '58%',
  },
  bigReadoutWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  bigReadoutValue: {
    ...textBase,
    fontWeight: '700',
  },
  bigReadoutUnit: {
    ...textBase,
    fontSize: 11,
    color: COLORS.textMid,
    marginTop: 2,
  },
  metricCard: {
    flex: 1,
    minHeight: 92,
    backgroundColor: COLORS.panelAlt,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  metricStrip: {
    height: 3,
    marginHorizontal: -10,
    marginBottom: 9,
  },
  metricLabel: {
    ...textBase,
    color: COLORS.textMid,
    fontSize: 9,
    marginBottom: 4,
  },
  metricValue: {
    ...textBase,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 3,
  },
  metricSub: {
    fontFamily: FONT_MONO,
    letterSpacing: 0,
    color: COLORS.textMid,
    fontSize: 10,
    lineHeight: 14,
  },
  actionButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonText: {
    ...textBase,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  segmented: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentLabel: {
    ...textBase,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  sourceRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  sourceModeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourceMain: {
    flex: 1,
    minWidth: 0,
  },
  sourceTitle: {
    fontFamily: FONT_MONO,
    letterSpacing: 0,
    color: COLORS.textHigh,
    fontSize: 11,
    lineHeight: 15,
  },
  sourceProvider: {
    ...textBase,
    color: COLORS.textMid,
    fontSize: 9,
    marginTop: 2,
  },
  sourceConfidence: {
    ...textBase,
    fontSize: 11,
    fontWeight: '700',
  },
});

export { FONT_MONO };
export const HUD_FONT = Platform.select<string>({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
}) as string;
