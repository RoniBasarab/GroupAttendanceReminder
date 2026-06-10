import type { AuthSession, CreateGroupRequest, JoinGroupRequest } from '@gar/core';
import { validateCreateGroup, validateJoinGroup } from '@gar/core';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { createGroup, joinGroup } from '@/shared/api/membership';
import { useSessionStore } from '@/shared/state/useSessionStore';

type Mode = 'create' | 'join';

/** Shared form for both create-group and join-group (they differ only by one field). */
export function MembershipForm({ mode }: { mode: Mode }) {
  const setSession = useSessionStore((state) => state.setSession);

  const [primary, setPrimary] = useState(''); // group name (create) or join code (join)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const mutation = useMutation<AuthSession, Error, CreateGroupRequest | JoinGroupRequest>({
    mutationFn: (input) =>
      mode === 'create'
        ? createGroup(input as CreateGroupRequest)
        : joinGroup(input as JoinGroupRequest),
    onSuccess: (session) => {
      setSession(session);
      router.replace('/');
    },
  });

  function onSubmit() {
    setLocalError(null);
    if (mode === 'create') {
      const input: CreateGroupRequest = { groupName: primary, firstName, lastName, email };
      const result = validateCreateGroup(input);
      if (!result.ok) return setLocalError(result.errors.join(' '));
      mutation.mutate(input);
    } else {
      const input: JoinGroupRequest = { joinCode: primary, firstName, lastName, email };
      const result = validateJoinGroup(input);
      if (!result.ok) return setLocalError(result.errors.join(' '));
      mutation.mutate(input);
    }
  }

  const error = localError ?? (mutation.error ? mutation.error.message : null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'create' ? 'Create a group' : 'Join a group'}</Text>

      <TextInput
        style={styles.input}
        placeholder={mode === 'create' ? 'Group name' : 'Join code'}
        autoCapitalize={mode === 'create' ? 'sentences' : 'characters'}
        autoCorrect={false}
        value={primary}
        onChangeText={setPrimary}
      />
      <TextInput style={styles.input} placeholder="First name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last name" value={lastName} onChangeText={setLastName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={mutation.isPending}
      >
        <Text style={styles.buttonText}>
          {mutation.isPending ? 'Please wait…' : mode === 'create' ? 'Create group' : 'Join group'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  error: { color: '#dc2626' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
