import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Reminder</Text>
      <Text style={styles.subtitle}>Create a group for your class, or join one with a code.</Text>

      <Link href="/onboarding/create" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Create a group</Text>
        </Pressable>
      </Link>

      <Link href="/onboarding/join" asChild>
        <Pressable style={styles.buttonOutline}>
          <Text style={styles.buttonOutlineText}>Join a group</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#555', marginBottom: 12 },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonOutline: { borderWidth: 1, borderColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonOutlineText: { color: '#2563eb', fontWeight: '600', fontSize: 16 },
});
