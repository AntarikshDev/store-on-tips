import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

import { useOrders } from '../../src/hooks/queries';
import { Badge } from '../../src/components/ui';
import { lightTheme as t, orderStatusColor, typography } from '../../src/theme/tokens';

const STATUS_FILTERS = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v || 0);

const fmtDate = (s: string) => {
  const d = new Date(s);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useOrders();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    return data.filter((o) => o.status === filter);
  }, [data, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>{filtered.length} {filter !== 'all' ? filter : 'total'}</Text>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS as any}
          keyExtractor={(s) => s as string}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const active = filter === item;
            return (
              <TouchableOpacity
                onPress={() => setFilter(item as any)}
                style={[styles.chip, active && styles.chipActive]}
                testID={`filter-${item}`}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {(item as string)[0].toUpperCase() + (item as string).slice(1)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={t.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.row}
              onPress={() => router.push(`/orders/${item.id}`)}
              testID={`order-row-${item.id}`}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.orderNo}>#{item.order_number}</Text>
                  <Text style={styles.orderDate}>
                    {' '}
                    · {fmtDate(item.created_at)}
                  </Text>
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  {item.customer_name ?? 'Guest'}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <Badge
                    label={(item.status ?? 'pending').toUpperCase()}
                    color={orderStatusColor[item.status ?? 'pending']}
                  />
                </View>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>
                  {formatINR(Number(item.total) || 0)}
                </Text>
                <ChevronRight size={18} color={t.mutedForeground} />
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySub}>
                {filter === 'all'
                  ? 'When customers place orders they’ll show up here.'
                  : `No ${filter} orders.`}
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: typography.xxl, fontWeight: '700', color: t.foreground },
  subtitle: { color: t.mutedForeground, fontSize: 13, marginTop: 2 },
  filterRow: { paddingVertical: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: t.muted,
  },
  chipActive: { backgroundColor: t.primary },
  chipText: { color: t.foreground, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
  },
  orderNo: { fontWeight: '700', color: t.foreground, fontSize: 14 },
  orderDate: { color: t.mutedForeground, fontSize: 12 },
  customer: { color: t.foreground, fontSize: 13, marginTop: 4 },
  right: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  amount: { fontWeight: '700', color: t.foreground, fontSize: 14 },
  sep: { height: 8 },
  empty: { padding: 32, alignItems: 'center' },
  emptyTitle: { color: t.foreground, fontWeight: '700', fontSize: 16 },
  emptySub: {
    color: t.mutedForeground,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
