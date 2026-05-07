import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Package } from 'lucide-react-native';

import { useProducts } from '../../src/hooks/queries';
import { Button } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v || 0);

export default function ProductsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useProducts();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>
            {data?.length ?? 0} {(data?.length ?? 0) === 1 ? 'product' : 'products'}
          </Text>
        </View>
        <Button
          label="Add"
          size="sm"
          onPress={() => router.push('/products/new')}
          testID="add-product-button"
          icon={<Plus size={14} color="#fff" />}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={t.primary}
            />
          }
          renderItem={({ item }) => {
            const img = item.images?.[0];
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => router.push(`/products/${item.id}`)}
                testID={`product-row-${item.id}`}
              >
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Package size={20} color={t.mutedForeground} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {formatINR(Number(item.price) || 0)} ·{' '}
                    {item.inventory_count ?? 0} in stock
                  </Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: item.is_active
                            ? t.success
                            : t.mutedForeground,
                        },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Package size={28} color={t.primary} />
              </View>
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptySub}>
                Add your first product to start selling.
              </Text>
              <Button
                label="Add product"
                onPress={() => router.push('/products/new')}
                style={{ marginTop: 16 }}
                size="md"
                testID="empty-add-product-button"
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: typography.xxl, fontWeight: '700', color: t.foreground },
  subtitle: { color: t.mutedForeground, fontSize: 13, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: t.muted,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '600', color: t.foreground, fontSize: 15 },
  meta: { color: t.mutedForeground, fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: t.mutedForeground, fontSize: 11, fontWeight: '600' },
  empty: { padding: 32, alignItems: 'center' },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: t.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { color: t.foreground, fontWeight: '700', fontSize: 17 },
  emptySub: {
    color: t.mutedForeground,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
