import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  Users,
  Wallet,
  Bell,
  ShieldCheck,
} from 'lucide-react-native';

import { useAuth } from '../../src/contexts/AuthContext';
import { useStoreContext } from '../../src/contexts/StoreContext';
import { Biometric } from '../../src/lib/biometric';
import { lightTheme as t, typography } from '../../src/theme/tokens';

export default function MoreScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { store } = useStoreContext();
  const [bioEnabled, setBioEnabled] = React.useState(false);

  React.useEffect(() => {
    Biometric.isEnabled().then(setBioEnabled);
  }, []);

  const onLogout = () =>
    Alert.alert('Sign out?', 'You will be returned to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await Biometric.disable();
          await signOut();
        },
      },
    ]);

  const onToggleBio = async () => {
    if (bioEnabled) {
      await Biometric.disable();
      setBioEnabled(false);
      Alert.alert('Disabled', 'Biometric login has been disabled.');
    } else {
      Alert.alert(
        'Re-enter password',
        'For security, re-enter your password the next time you log in to enable biometric login.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>{user?.email ?? '—'}</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(((user?.user_metadata as any)?.full_name as string)?.[0] ??
                user?.email?.[0] ??
                'S'
              ).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {(user?.user_metadata as any)?.full_name ?? 'Seller'}
            </Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {store?.name ?? 'No store yet'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          <Row
            icon={<Users size={20} color={t.foreground} />}
            label="Customers"
            onPress={() => router.push('/more/customers' as any)}
            testID="more-customers"
          />
          <Row
            icon={<Wallet size={20} color={t.foreground} />}
            label="Wallet & AI credits"
            onPress={() => router.push('/more/wallet' as any)}
            testID="more-wallet"
          />
          <Row
            icon={<Bell size={20} color={t.foreground} />}
            label="Notifications"
            onPress={() => router.push('/more/notifications' as any)}
            testID="more-notifications"
          />
          <Row
            icon={<SettingsIcon size={20} color={t.foreground} />}
            label="Settings"
            onPress={() => router.push('/more/settings' as any)}
            testID="more-settings"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Row
            icon={<ShieldCheck size={20} color={t.foreground} />}
            label={`Biometric login · ${bioEnabled ? 'On' : 'Off'}`}
            onPress={onToggleBio}
            testID="more-biometric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Row
            icon={<HelpCircle size={20} color={t.foreground} />}
            label="Help center"
            onPress={() => router.push('/more/help' as any)}
            testID="more-help"
          />
        </View>

        <TouchableOpacity
          onPress={onLogout}
          style={styles.logout}
          testID="logout-button"
        >
          <LogOut size={18} color={t.destructive} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Pictocart Seller v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
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
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowText}>{label}</Text>
      <ChevronRight size={18} color={t.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: typography.xxl, fontWeight: '700', color: t.foreground },
  subtitle: { color: t.mutedForeground, fontSize: 13, marginTop: 2 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.card,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.border,
    marginTop: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  name: { color: t.foreground, fontSize: 16, fontWeight: '700' },
  storeName: { color: t.mutedForeground, fontSize: 13, marginTop: 2 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12,
    color: t.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: '700',
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: 6,
  },
  rowIcon: { width: 28, alignItems: 'center', marginRight: 12 },
  rowText: { flex: 1, color: t.foreground, fontSize: 14, fontWeight: '500' },
  logout: {
    marginHorizontal: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { color: t.destructive, fontWeight: '700', fontSize: 14 },
  version: {
    textAlign: 'center',
    color: t.mutedForeground,
    fontSize: 11,
    marginTop: 16,
  },
});
