import { Link, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useConfirmAttendance } from '@/features/attendance/useConfirmAttendance';
import { useEnablePush } from '@/features/push/useEnablePush';
import { useSessionStore } from '@/shared/state/useSessionStore';

export default function Home() {
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);
  const enablePush = useEnablePush();
  const confirm = useConfirmAttendance();

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  const { group, member } = session;
  const isAdmin = member.role === 'admin';

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
        style={styles.confirmButton}
        onPress={() => confirm.mutate()}
        disabled={confirm.isPending}
      >
        <Text style={styles.confirmText}>
          {confirm.isPending
            ? 'Submitting…'
            : confirm.data?.status === 'submitted'
              ? 'Attendance submitted ✓'
              : confirm.data?.status === 'already'
                ? 'Already confirmed ✓'
                : "Confirm today's attendance"}
        </Text>
      </Pressable>
      {confirm.error ? <Text style={styles.line}>{(confirm.error as Error).message}</Text> : null}

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

      {isAdmin ? (
        <Link href="/members" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Manage members</Text>
          </Pressable>
        </Link>
      ) : null}

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
  confirmButton: { backgroundColor: '#16a34a', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { paddingVertical: 8 },
  linkText: { color: '#2563eb' },
});
