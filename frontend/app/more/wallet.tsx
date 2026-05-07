import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet as WalletIcon } from 'lucide-react-native';
import { useWallet } from '../../src/hooks/queries';
import { lightTheme as t } from '../../src/theme/tokens';

export default function WalletScreen() {
  const { data: wallet } = useWallet();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card} testID="wallet-balance-card">
          <View style={styles.iconBox}>
            <WalletIcon size={20} color={t.primary} />
          </View>
          <Text style={styles.label}>AI Credit balance</Text>
          <Text style={styles.balance}>{(wallet as any)?.balance ?? 0}</Text>
          <Text style={styles.sub}>
            credits used: {(wallet as any)?.lifetime_used ?? 0}
          </Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Recharge coming soon</Text>
          <Text style={styles.noticeText}>
            For now you can recharge AI credits and manage subscriptions from
            the web dashboard. Razorpay native checkout is rolling out in V2.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  card: {
    backgroundColor: t.card,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: t.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: { color: t.mutedForeground, fontSize: 13 },
  balance: {
    color: t.foreground,
    fontSize: 40,
    fontWeight: '800',
    marginTop: 4,
  },
  sub: { color: t.mutedForeground, fontSize: 12, marginTop: 6 },
  notice: {
    marginTop: 16,
    backgroundColor: t.primarySoft,
    padding: 16,
    borderRadius: 12,
  },
  noticeTitle: { color: t.primaryStrong, fontWeight: '700', marginBottom: 4 },
  noticeText: { color: t.foreground, fontSize: 13, lineHeight: 19 },
});
