import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_MONO } from './constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DRISHTI</Text>
      <Text style={styles.copy}>Expo Router entry is configured in index.ts.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    padding: 24,
  },
  title: {
    fontFamily: FONT_MONO,
    color: COLORS.cyan,
    fontSize: 24,
    fontWeight: '700',
  },
  copy: {
    fontFamily: FONT_MONO,
    color: COLORS.textMid,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
});
