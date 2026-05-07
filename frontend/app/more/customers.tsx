import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Phone } from 'lucide-react-native';
import { useCustomers } from '../../src/hooks/queries';
import { lightTheme as t } from '../../src/theme/tokens';

export default function CustomersScreen() {
  const { data, isLoading, refetch, isRefetching } = useCustomers();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={t.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={styles.row} testID={`customer-row-${item.id}`}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.name?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name ?? 'Customer'}</Text>
                {item.email ? (
                  <View style={styles.metaRow}>
                    <Mail size={12} color={t.mutedForeground} />
                    <Text style={styles.meta}>{item.email}</Text>
                  </View>
                ) : null}
                {item.phone ? (
                  <View style={styles.metaRow}>
                    <Phone size={12} color={t.mutedForeground} />
                    <Text style={styles.meta}>{item.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No customers yet</Text>
              <Text style={styles.emptySub}>
                Customers who place orders will appear here.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    backgroundColor: t.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { color: t.foreground, fontWeight: '600', fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  meta: { color: t.mutedForeground, fontSize: 12 },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { color: t.foreground, fontSize: 16, fontWeight: '700' },
  emptySub: {
    color: t.mutedForeground,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
