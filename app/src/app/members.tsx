import type { MemberRole } from '@gar/core';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMembersQuery, useSetRole } from '@/features/members/useMembers';
import { useSessionStore } from '@/shared/state/useSessionStore';

export default function MembersScreen() {
  const session = useSessionStore((state) => state.session);
  const setRole = useSetRole();
  const { data, isLoading, error } = useMembersQuery();

  if (!session) return <Redirect href="/onboarding" />;
  if (session.member.role !== 'admin') return <Redirect href="/" />;

  const message =
    (setRole.error ?? error) instanceof Error ? (setRole.error ?? error)!.message : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Members</Text>
      {isLoading ? <ActivityIndicator /> : null}

      {data?.map((member) => {
        const isYou = member.id === session.member.id;
        const nextRole: MemberRole = member.role === 'admin' ? 'member' : 'admin';
        return (
          <View key={member.id} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>
                {member.firstName} {member.lastName}
                {isYou ? ' (you)' : ''}
              </Text>
              <Text style={styles.email}>{member.email}</Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.badge, member.role === 'admin' && styles.badgeAdmin]}>
                {member.role}
              </Text>
              <Pressable
                style={styles.roleBtn}
                disabled={setRole.isPending}
                onPress={() => setRole.mutate({ memberId: member.id, role: nextRole })}
              >
                <Text style={styles.roleBtnText}>
                  {nextRole === 'admin' ? 'Make admin' : 'Make member'}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {message ? <Text style={styles.error}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  info: { flex: 1, paddingRight: 8 },
  name: { fontWeight: '600' },
  email: { color: '#777', fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 },
  badgeAdmin: { color: '#2563eb', fontWeight: '700' },
  roleBtn: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  roleBtnText: { color: '#2563eb', fontSize: 13 },
  error: { color: '#dc2626', marginTop: 8 },
});
