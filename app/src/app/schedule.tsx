import type { FormKind } from '@gar/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  useAddException,
  useRemoveException,
  useScheduleQuery,
  useSetWeekly,
} from '@/features/schedule/useSchedule';
import { useSessionStore } from '@/shared/state/useSessionStore';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
type DayKind = 'off' | FormKind;
const CHOICES: DayKind[] = ['off', 'morning', 'evening'];
const CHOICE_LABEL: Record<DayKind, string> = { off: 'Off', morning: 'Morning', evening: 'Evening' };

export default function ScheduleScreen() {
  const session = useSessionStore((state) => state.session);
  const isAdmin = session?.member.role === 'admin';

  const { data, isLoading, error } = useScheduleQuery();
  const setWeekly = useSetWeekly();
  const addException = useAddException();
  const removeException = useRemoveException();

  const [week, setWeek] = useState<DayKind[]>(() => Array(7).fill('off'));
  const [exDate, setExDate] = useState('');
  const [exType, setExType] = useState<'extra' | 'cancelled'>('extra');
  const [exKind, setExKind] = useState<FormKind>('morning');

  useEffect(() => {
    if (!data) return;
    const next: DayKind[] = Array(7).fill('off');
    for (const day of data.weekly) next[day.weekday] = day.kind;
    setWeek(next);
  }, [data]);

  if (!session) return <Redirect href="/onboarding" />;

  function saveWeekly() {
    const days = week
      .map((kind, weekday) => ({ weekday, kind }))
      .filter((d): d is { weekday: number; kind: FormKind } => d.kind !== 'off');
    setWeekly.mutate(days);
  }

  function submitException() {
    addException.mutate(
      { date: exDate, exception: exType, kind: exType === 'extra' ? exKind : undefined },
      { onSuccess: () => setExDate('') },
    );
  }

  const mutationError =
    (setWeekly.error ?? addException.error ?? removeException.error) instanceof Error
      ? (setWeekly.error ?? addException.error ?? removeException.error)!.message
      : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Weekly schedule</Text>
      {isLoading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{(error as Error).message}</Text> : null}

      {data
        ? DAY_NAMES.map((name, weekday) => (
            <View key={weekday} style={styles.dayRow}>
              <Text style={styles.dayName}>{name}</Text>
              <View style={styles.segment}>
                {CHOICES.map((choice) => {
                  const selected = week[weekday] === choice;
                  return (
                    <Pressable
                      key={choice}
                      disabled={!isAdmin}
                      onPress={() =>
                        setWeek((prev) => prev.map((k, i) => (i === weekday ? choice : k)))
                      }
                      style={[styles.segBtn, selected && styles.segBtnOn]}
                    >
                      <Text style={[styles.segText, selected && styles.segTextOn]}>
                        {CHOICE_LABEL[choice]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        : null}

      {isAdmin && data ? (
        <Pressable style={styles.saveBtn} onPress={saveWeekly} disabled={setWeekly.isPending}>
          <Text style={styles.saveText}>{setWeekly.isPending ? 'Saving…' : 'Save weekly schedule'}</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.title, styles.section]}>Exceptions</Text>
      {data && data.exceptions.length === 0 ? <Text style={styles.muted}>None.</Text> : null}
      {data?.exceptions.map((ex) => (
        <View key={ex.date} style={styles.exRow}>
          <Text style={styles.exText}>
            {ex.date} · {ex.exception === 'cancelled' ? 'Cancelled' : `Extra (${ex.kind})`}
          </Text>
          {isAdmin ? (
            <Pressable onPress={() => removeException.mutate(ex.date)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      {isAdmin ? (
        <View style={styles.addBox}>
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            autoCapitalize="none"
            value={exDate}
            onChangeText={setExDate}
          />
          <View style={styles.segment}>
            {(['extra', 'cancelled'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setExType(t)}
                style={[styles.segBtn, exType === t && styles.segBtnOn]}
              >
                <Text style={[styles.segText, exType === t && styles.segTextOn]}>
                  {t === 'extra' ? 'Extra day' : 'Cancelled'}
                </Text>
              </Pressable>
            ))}
          </View>
          {exType === 'extra' ? (
            <View style={styles.segment}>
              {(['morning', 'evening'] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setExKind(k)}
                  style={[styles.segBtn, exKind === k && styles.segBtnOn]}
                >
                  <Text style={[styles.segText, exKind === k && styles.segTextOn]}>
                    {k === 'morning' ? 'Morning' : 'Evening'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Pressable style={styles.saveBtn} onPress={submitException} disabled={addException.isPending}>
            <Text style={styles.saveText}>{addException.isPending ? 'Adding…' : 'Add exception'}</Text>
          </Pressable>
        </View>
      ) : null}

      {mutationError ? <Text style={styles.error}>{mutationError}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700' },
  section: { marginTop: 20 },
  muted: { color: '#888' },
  error: { color: '#dc2626' },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dayName: { width: 90, fontWeight: '500' },
  segment: { flexDirection: 'row', flex: 1, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db' },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  segBtnOn: { backgroundColor: '#2563eb' },
  segText: { fontSize: 13, color: '#374151' },
  segTextOn: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: '600' },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  exText: { color: '#374151' },
  remove: { color: '#dc2626' },
  addBox: { gap: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
});
