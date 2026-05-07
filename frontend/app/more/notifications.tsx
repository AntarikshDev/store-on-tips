import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { lightTheme as t } from '../../src/theme/tokens';

export default function NotificationsScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    Notifications.getPresentedNotificationsAsync().then((notifs) => {
      setItems(
        notifs.map((n) => ({
          id: n.request.identifier,
          title: n.request.content.title,
          body: n.request.content.body,
          date: n.date,
        })),
      );
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.icon}>
              <Bell size={16} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title ?? 'Notification'}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.date}>
                {new Date(item.date).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <View style={styles.icon}>
              <Bell size={20} color={t.primary} />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>
              You’ll be notified when a customer places an order, your AWB is
              generated, or your AI credit balance is low.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  row: {
    flexDirection: 'row',
    backgroundColor: t.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: t.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: t.foreground, fontWeight: '700', fontSize: 14 },
  body: { color: t.mutedForeground, fontSize: 13, marginTop: 2 },
  date: { color: t.mutedForeground, fontSize: 11, marginTop: 6 },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: {
    color: t.foreground,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 16,
  },
  emptySub: {
    color: t.mutedForeground,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
});
