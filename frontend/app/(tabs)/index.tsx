import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowUpRight,
  Bell,
  Eye,
  Package,
  ShoppingBag,
  Sparkles,
  Wallet,
  Plus,
} from 'lucide-react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useAuth } from '../../src/contexts/AuthContext';
import { useStoreContext } from '../../src/contexts/StoreContext';
import { useDashboardStats, useWallet } from '../../src/hooks/queries';
import { Badge, Card } from '../../src/components/ui';
import {
  lightTheme as t,
  orderStatusColor,
  spacing,
  typography,
} from '../../src/theme/tokens';
import {
  registerForPushAsync,
  registerPushTokenWithBackend,
} from '../../src/lib/pushNotifications';

const { width: SCREEN_W } = Dimensions.get('window');

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v || 0);

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { store } = useStoreContext();
  const { data: stats, isLoading, refetch, isRefetching } = useDashboardStats();
  const { data: wallet } = useWallet();

  // Register push token on mount
  useEffect(() => {
    (async () => {
      const tk = await registerForPushAsync();
      if (tk) await registerPushTokenWithBackend(tk);
    })();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const fullName: string =
    (user?.user_metadata as any)?.full_name?.split(' ')[0] ?? 'Seller';

  const chartData =
    stats?.revenue7d.map((d) => ({ value: d.value, label: d.label })) ??
    Array.from({ length: 7 }).map((_, i) => ({ value: 0, label: '' }));

  const maxRevenue = Math.max(1, ...chartData.map((d) => d.value));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={t.primary}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name} testID="dashboard-store-name">
              {fullName} 👋
            </Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {store?.name ?? 'Your store'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/more/notifications' as any)}
            style={styles.bellBtn}
            testID="dashboard-notifications-button"
          >
            <Bell size={20} color={t.foreground} />
            {(stats?.pendingOrders ?? 0) > 0 ? (
              <View style={styles.bellDot} />
            ) : null}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        ) : (
          <View style={styles.body}>
            {/* Revenue card */}
            <Card style={styles.heroCard} testID="dashboard-revenue-card">
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroLabel}>Revenue (7d)</Text>
                  <Text style={styles.heroValue}>
                    {formatINR(
                      chartData.reduce((s, x) => s + x.value, 0),
                    )}
                  </Text>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {stats?.totalOrders ?? 0} orders
                  </Text>
                </View>
              </View>
              <View style={{ height: 140, marginTop: 12, marginLeft: -12 }}>
                <LineChart
                  data={chartData}
                  width={SCREEN_W - 64}
                  height={120}
                  initialSpacing={10}
                  spacing={(SCREEN_W - 100) / 7}
                  thickness={2.5}
                  color={t.primary}
                  startFillColor={t.primary}
                  endFillColor={t.primary}
                  startOpacity={0.25}
                  endOpacity={0.0}
                  areaChart
                  curved
                  hideDataPoints
                  hideRules
                  hideYAxisText
                  yAxisColor="transparent"
                  xAxisColor={t.border}
                  yAxisLabelTexts={[]}
                  xAxisLabelTextStyle={{
                    color: t.mutedForeground,
                    fontSize: 10,
                  }}
                  maxValue={maxRevenue * 1.2}
                />
              </View>
            </Card>

            {/* Stat tiles */}
            <View style={styles.tilesRow}>
              <StatTile
                icon={<ShoppingBag size={18} color={t.primary} />}
                label="Pending"
                value={String(stats?.pendingOrders ?? 0)}
                onPress={() => router.push('/(tabs)/orders')}
                testID="dashboard-tile-pending"
              />
              <StatTile
                icon={<Package size={18} color={t.primary} />}
                label="Products"
                value={String(stats?.totalProducts ?? 0)}
                onPress={() => router.push('/(tabs)/products')}
                testID="dashboard-tile-products"
              />
            </View>
            <View style={styles.tilesRow}>
              <StatTile
                icon={<Wallet size={18} color={t.primary} />}
                label="AI credits"
                value={String((wallet as any)?.balance ?? 0)}
                onPress={() => router.push('/more/wallet' as any)}
                testID="dashboard-tile-credits"
              />
              <StatTile
                icon={<Eye size={18} color={t.primary} />}
                label="Storefront"
                value={store?.is_published ? 'Live' : 'Draft'}
                onPress={() => router.push('/(tabs)/store')}
                testID="dashboard-tile-store"
              />
            </View>

            {/* Smart actions */}
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.actionsRow}>
              <SmartAction
                icon={<Plus size={18} color={t.primary} />}
                label="Add product"
                onPress={() => router.push('/products/new')}
                testID="dashboard-action-add-product"
              />
              <SmartAction
                icon={<Sparkles size={18} color={t.primary} />}
                label="Edit storefront"
                onPress={() => router.push('/(tabs)/store')}
                testID="dashboard-action-storefront"
              />
            </View>

            {/* Recent orders */}
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent orders</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/orders')}
                testID="dashboard-view-all-orders"
              >
                <Text style={styles.linkText}>View all</Text>
              </TouchableOpacity>
            </View>

            {(stats?.recentOrders ?? []).length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Text style={styles.emptyText}>No orders yet</Text>
                <Text style={styles.emptySub}>
                  Orders placed on your storefront will appear here.
                </Text>
              </Card>
            ) : (
              (stats?.recentOrders ?? []).map((o) => (
                <Card
                  key={o.id}
                  style={{ marginBottom: 10, padding: 14 }}
                  onPress={() => router.push(`/orders/${o.id}`)}
                  testID={`order-row-${o.id}`}
                >
                  <View style={styles.orderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderNo}>#{o.order_number}</Text>
                      <Text style={styles.orderCustomer} numberOfLines={1}>
                        {o.customer_name ?? 'Guest'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.orderAmount}>
                        {formatINR(Number(o.total) || 0)}
                      </Text>
                      <Badge
                        label={(o.status ?? 'pending').toUpperCase()}
                        color={orderStatusColor[o.status ?? 'pending']}
                      />
                    </View>
                    <ArrowUpRight
                      size={16}
                      color={t.mutedForeground}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  icon,
  label,
  value,
  onPress,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
      style={styles.tile}
    >
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </TouchableOpacity>
  );
}

function SmartAction({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
      style={styles.smartAction}
    >
      {icon}
      <Text style={styles.smartActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { color: t.mutedForeground, fontSize: 14 },
  name: { color: t.foreground, fontSize: typography.xxl, fontWeight: '700' },
  storeName: { color: t.mutedForeground, marginTop: 2, fontSize: 13 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: t.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    backgroundColor: t.destructive,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: t.background,
  },
  loading: { padding: 64, alignItems: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  heroCard: {
    backgroundColor: t.card,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: { color: t.mutedForeground, fontSize: 13 },
  heroValue: {
    color: t.foreground,
    fontWeight: '700',
    fontSize: typography.display,
    marginTop: 2,
  },
  heroBadge: {
    backgroundColor: t.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: { color: t.primaryStrong, fontWeight: '600', fontSize: 12 },
  tilesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: t.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.border,
    padding: 14,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: t.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileLabel: { color: t.mutedForeground, fontSize: 12 },
  tileValue: {
    color: t.foreground,
    fontSize: typography.lg,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: t.foreground,
  },
  actionsRow: { flexDirection: 'row', gap: 12 },
  smartAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primarySoft,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  smartActionText: {
    color: t.primaryStrong,
    fontWeight: '700',
    fontSize: 13,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: { color: t.primary, fontWeight: '700', fontSize: 13 },
  orderRow: { flexDirection: 'row', alignItems: 'center' },
  orderNo: { fontWeight: '700', color: t.foreground, fontSize: 14 },
  orderCustomer: { color: t.mutedForeground, marginTop: 2, fontSize: 12 },
  orderAmount: { fontWeight: '700', color: t.foreground, marginBottom: 4 },
  emptyText: { color: t.foreground, fontWeight: '600' },
  emptySub: {
    color: t.mutedForeground,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
