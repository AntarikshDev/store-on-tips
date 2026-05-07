import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Mail,
  MapPin,
  Phone,
  Truck,
  Package as PackageIcon,
  CreditCard,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useOrder } from '../../src/hooks/queries';
import { supabase } from '../../src/lib/supabase';
import { Badge, Button, Card } from '../../src/components/ui';
import {
  lightTheme as t,
  orderStatusColor,
  paymentStatusColor,
  typography,
} from '../../src/theme/tokens';

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v || 0);

const STATUS_FLOW = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
] as const;

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, refetch } = useOrder(id as string);
  const qc = useQueryClient();
  const [updating, setUpdating] = React.useState(false);

  const advance = async () => {
    if (!order) return;
    const idx = STATUS_FLOW.indexOf((order.status ?? 'pending') as any);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    setUpdating(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', order.id);
    setUpdating(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await refetch();
    qc.invalidateQueries({ queryKey: ['orders'] });
    qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const cancelOrder = async () => {
    if (!order) return;
    Alert.alert('Cancel order?', 'This cannot be undone.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', order.id);
          setUpdating(false);
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          await refetch();
          qc.invalidateQueries({ queryKey: ['orders'] });
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={t.primary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={{ color: t.mutedForeground }}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const items = (order.items as any[]) ?? [];
  const addr = order.customer_address as any;
  const currentIdx = STATUS_FLOW.indexOf((order.status ?? 'pending') as any);
  const cancelled = order.status === 'cancelled';
  const isFinal = currentIdx === STATUS_FLOW.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.orderNo}>#{order.order_number}</Text>
          <Text style={styles.created}>
            Placed{' '}
            {new Date(order.created_at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
          <View style={styles.badgesRow}>
            <Badge
              label={(order.status ?? 'pending').toUpperCase()}
              color={orderStatusColor[order.status ?? 'pending']}
            />
            <Badge
              label={(order.payment_status ?? 'pending').toUpperCase()}
              color={paymentStatusColor[order.payment_status ?? 'pending']}
            />
          </View>
        </View>

        {/* Status timeline */}
        {!cancelled ? (
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Status</Text>
            {STATUS_FLOW.map((s, i) => {
              const reached = i <= currentIdx;
              const Icon = reached ? CheckCircle2 : Circle;
              return (
                <View key={s} style={styles.timelineRow}>
                  <Icon
                    size={20}
                    color={reached ? t.success : t.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.timelineText,
                      reached
                        ? { color: t.foreground, fontWeight: '600' }
                        : { color: t.mutedForeground },
                    ]}
                  >
                    {s[0].toUpperCase() + s.slice(1)}
                  </Text>
                </View>
              );
            })}
            {!isFinal ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button
                  label={`Mark ${STATUS_FLOW[currentIdx + 1]}`}
                  onPress={advance}
                  loading={updating}
                  fullWidth
                  testID="advance-status-button"
                />
              </View>
            ) : null}
            {!isFinal && order.status !== 'cancelled' ? (
              <Button
                label="Cancel order"
                onPress={cancelOrder}
                variant="outline"
                fullWidth
                style={{ marginTop: 8 }}
                testID="cancel-order-button"
              />
            ) : null}
          </Card>
        ) : null}

        {/* Customer */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.customerName}>
            {order.customer_name ?? 'Guest'}
          </Text>
          {order.customer_email ? (
            <View style={styles.iconRow}>
              <Mail size={14} color={t.mutedForeground} />
              <Text
                style={styles.contact}
                onPress={() =>
                  Linking.openURL(`mailto:${order.customer_email}`)
                }
              >
                {order.customer_email}
              </Text>
            </View>
          ) : null}
          {order.customer_phone ? (
            <View style={styles.iconRow}>
              <Phone size={14} color={t.mutedForeground} />
              <Text
                style={styles.contact}
                onPress={() => Linking.openURL(`tel:${order.customer_phone}`)}
              >
                {order.customer_phone}
              </Text>
            </View>
          ) : null}
          {addr ? (
            <View style={[styles.iconRow, { alignItems: 'flex-start' }]}>
              <MapPin size={14} color={t.mutedForeground} />
              <Text style={[styles.contact, { color: t.foreground }]}>
                {[
                  addr.line1,
                  addr.line2,
                  addr.city,
                  addr.state,
                  addr.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Items */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          {items.map((it: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              {it.image ? (
                <Image source={{ uri: it.image }} style={styles.itemImg} />
              ) : (
                <View style={[styles.itemImg, { alignItems: 'center', justifyContent: 'center' }]}>
                  <PackageIcon size={18} color={t.mutedForeground} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {it.title ?? it.name ?? 'Item'}
                </Text>
                <Text style={styles.itemQty}>
                  Qty {it.quantity ?? 1}
                  {it.variant ? ` · ${it.variant}` : ''}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatINR((Number(it.price) || 0) * (it.quantity ?? 1))}
              </Text>
            </View>
          ))}
        </Card>

        {/* Totals */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Total</Text>
          <Row label="Subtotal" value={formatINR(Number(order.subtotal) || 0)} />
          <Row label="Tax" value={formatINR(Number(order.tax) || 0)} />
          <Row
            label="Shipping"
            value={formatINR(Number(order.shipping) || 0)}
          />
          <View style={styles.divider} />
          <Row
            label="Total"
            value={formatINR(Number(order.total) || 0)}
            bold
          />
          {order.payment_method ? (
            <View style={[styles.iconRow, { marginTop: 8 }]}>
              <CreditCard size={14} color={t.mutedForeground} />
              <Text style={styles.contact}>
                Paid via {order.payment_method}
              </Text>
            </View>
          ) : null}
        </Card>

        {order.tracking_number ? (
          <Card style={{ marginTop: 12 }}>
            <View style={styles.iconRow}>
              <Truck size={16} color={t.primary} />
              <Text style={[styles.contact, { color: t.foreground, fontWeight: '600' }]}>
                AWB {order.tracking_number}
              </Text>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.totalsRow}>
      <Text style={[styles.totalLabel, bold && { fontWeight: '700', color: t.foreground }]}>
        {label}
      </Text>
      <Text style={[styles.totalValue, bold && { fontWeight: '800', fontSize: 18 }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: {
    backgroundColor: t.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.border,
  },
  orderNo: { fontSize: typography.xl, fontWeight: '800', color: t.foreground },
  created: { color: t.mutedForeground, fontSize: 13, marginTop: 2 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: t.mutedForeground,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  timelineText: { fontSize: 14 },
  customerName: { color: t.foreground, fontSize: 16, fontWeight: '700' },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  contact: { color: t.primary, fontSize: 14, flex: 1 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  itemImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: t.muted,
  },
  itemTitle: { color: t.foreground, fontSize: 14, fontWeight: '500' },
  itemQty: { color: t.mutedForeground, fontSize: 12, marginTop: 2 },
  itemPrice: { color: t.foreground, fontWeight: '700', fontSize: 14 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { color: t.mutedForeground, fontSize: 14 },
  totalValue: { color: t.foreground, fontSize: 14, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: t.border,
    marginVertical: 8,
  },
});
