import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Mail, MessageCircle } from 'lucide-react-native';
import { lightTheme as t } from '../../src/theme/tokens';

const FAQ = [
  {
    q: 'How do I publish my store?',
    a: 'Go to the Store tab and tap “Publish”. Your storefront becomes live at pictocart.in/<your-slug>.',
  },
  {
    q: 'How do I add products?',
    a: 'Go to Products → Add. You can take photos with the camera or pick from your gallery (up to 6).',
  },
  {
    q: 'How are orders fulfilled?',
    a: 'When an order arrives, you’ll get a push notification. Tap the order, mark it through each stage to keep the customer updated.',
  },
  {
    q: 'Why am I not getting notifications?',
    a: 'Make sure notifications are enabled for Pictocart Seller in your phone’s system settings. They register automatically on first login.',
  },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h}>FAQs</Text>
        {FAQ.map((f, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.q}>{f.q}</Text>
            <Text style={styles.a}>{f.a}</Text>
          </View>
        ))}

        <Text style={[styles.h, { marginTop: 16 }]}>Need more help?</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL('mailto:support@pictocart.in')}
          testID="help-email"
        >
          <Mail size={18} color={t.foreground} />
          <Text style={styles.rowText}>Email support@pictocart.in</Text>
          <ChevronRight size={16} color={t.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL('https://pictocart.in/help')}
          testID="help-web"
        >
          <MessageCircle size={18} color={t.foreground} />
          <Text style={styles.rowText}>Visit help center</Text>
          <ChevronRight size={16} color={t.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  h: { color: t.mutedForeground, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  card: {
    backgroundColor: t.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: 8,
  },
  q: { color: t.foreground, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  a: { color: t.mutedForeground, fontSize: 13, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    gap: 12,
    marginBottom: 8,
  },
  rowText: { color: t.foreground, fontSize: 14, flex: 1, fontWeight: '500' },
});
