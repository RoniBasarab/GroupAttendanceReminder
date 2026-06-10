import { FORMS } from '@gar/core';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { useSessionStore } from '@/shared/state/useSessionStore';

export default function Home() {
  const groupCode = useSessionStore((state) => state.groupCode);
  const formCount = Object.keys(FORMS).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Reminder</Text>
      <Text style={styles.line}>Scaffold ready · {formCount} form configs loaded</Text>
      <Text style={styles.line}>Group: {groupCode ?? 'not joined yet'}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  line: {
    color: '#444',
  },
});
