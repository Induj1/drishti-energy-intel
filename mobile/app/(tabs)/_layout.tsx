import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_MONO } from '../../constants';

interface TabIconProps {
  glyph: string;
  label: string;
  focused: boolean;
}

function TabIcon({ glyph, label, focused }: TabIconProps) {
  const color = focused ? COLORS.cyan : COLORS.textMid;
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconGlyph, { color }]}>{glyph}</Text>
      <Text style={[styles.iconLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.activeBar, { backgroundColor: focused ? COLORS.cyan : 'transparent' }]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textMid,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'War Room',
          tabBarIcon: ({ focused }) => <TabIcon glyph="[+]" label="WAR" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="simulate"
        options={{
          title: 'Simulate',
          tabBarIcon: ({ focused }) => <TabIcon glyph=">>" label="SIM" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vessels"
        options={{
          title: 'Assets',
          tabBarIcon: ({ focused }) => <TabIcon glyph="->" label="ASSETS" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="intel"
        options={{
          title: 'Intel',
          tabBarIcon: ({ focused }) => <TabIcon glyph="~~" label="INTEL" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopColor: COLORS.borderDim,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 0,
    paddingTop: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    width: 74,
    gap: 3,
  },
  iconGlyph: {
    fontFamily: FONT_MONO,
    fontSize: 13,
    fontWeight: '700',
  },
  iconLabel: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    fontWeight: '700',
  },
  activeBar: {
    marginTop: 4,
    width: 30,
    height: 2,
    borderRadius: 1,
  },
});
