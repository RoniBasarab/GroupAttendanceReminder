import { Link, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useEnablePush } from '@/features/push/useEnablePush';
import { useSessionStore } from '@/shared/state/useSessionStore';

export default function Home() {
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);
  const enablePush = useEnablePush();

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  const { group, member } = session;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.line}>
        Signed in as {member.firstName} {member.lastName} ({member.role})
      </Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>Join code</Text>
        <Text style={styles.code}>{group.joinCode}</Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          Share.share({ message: `Join our attendance group with code ${group.joinCode}` })
        }
      >
        <Text style={styles.buttonText}>Share join code</Text>
      </Pressable>

      <Link href="/schedule" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Schedule</Text>
        </Pressable>
      </Link>

      <Pressable
        style={styles.button}
        onPress={() => enablePush.mutate()}
        disabled={enablePush.isPending}
      >
        <Text style={styles.buttonText}>
          {enablePush.isPending
            ? 'Enabling…'
            : enablePush.data && enablePush.data !== 'unavailable'
              ? 'Notifications on ✓'
              : 'Enable notifications'}
        </Text>
      </Pressable>
      {enablePush.data === 'unavailable' ? (
        <Text style={styles.line}>Notifications aren’t available on this device yet.</Text>
      ) : null}
      {enablePush.error ? <Text style={styles.line}>{(enablePush.error as Error).message}</Text> : null}

      <Pressable style={styles.link} onPress={clearSession}>
        <Text style={styles.linkText}>Sign out</Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  line: { color: '#444' },
  codeBox: { alignItems: 'center', gap: 4, paddingVertical: 12 },
  codeLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  code: { fontSize: 32, fontWeight: '700', letterSpacing: 4 },
  button: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { paddingVertical: 8 },
  linkText: { color: '#2563eb' },
});
