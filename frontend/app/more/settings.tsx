import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStoreContext } from '../../src/contexts/StoreContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { lightTheme as t } from '../../src/theme/tokens';

export default function SettingsScreen() {
  const { store } = useStoreContext();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.label}>Account</Text>
          <Row label="Email" value={user?.email ?? '—'} />
          <Row
            label="Full name"
            value={(user?.user_metadata as any)?.full_name ?? '—'}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Store</Text>
          <Row label="Name" value={store?.name ?? '—'} />
          <Row label="Slug" value={store?.slug ?? '—'} />
          <Row label="Category" value={store?.category ?? '—'} />
          <Row
            label="Status"
            value={store?.is_published ? 'Published' : 'Draft'}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Advanced settings like custom domains, payment gateway, shipping,
            SEO, and email branding are managed from the web dashboard at
            pictocart.in.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  card: {
    backgroundColor: t.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: t.mutedForeground,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  rowLabel: { color: t.mutedForeground, fontSize: 14 },
  rowValue: { color: t.foreground, fontWeight: '600', fontSize: 14, marginLeft: 16 },
  note: {
    backgroundColor: t.primarySoft,
    padding: 14,
    borderRadius: 12,
  },
  noteText: { color: t.primaryStrong, fontSize: 13, lineHeight: 19 },
});
