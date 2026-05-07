import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Eye, Globe, Sparkles } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';

import { useStoreContext } from '../../src/contexts/StoreContext';
import { supabase } from '../../src/lib/supabase';
import { Button, Card } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

export default function StoreScreen() {
  const { store, refetchStore } = useStoreContext();
  const [publishing, setPublishing] = React.useState(false);

  if (!store) return null;

  const storeUrl = store.custom_domain
    ? `https://${store.custom_domain}`
    : `https://pictocart.in/${store.slug}`;

  const togglePublish = async () => {
    setPublishing(true);
    const { error } = await supabase
      .from('stores')
      .update({ is_published: !store.is_published })
      .eq('id', store.id);
    setPublishing(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    await refetchStore();
  };

  const onShare = async () => {
    const can = await Sharing.isAvailableAsync();
    if (can) {
      await Sharing.shareAsync(storeUrl, { dialogTitle: 'Share your store' });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Store</Text>
          <Text style={styles.subtitle}>Preview & manage your storefront</Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Store hero card */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={styles.banner}>
              {store.banner_url ? (
                <Image
                  source={{ uri: store.banner_url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.bannerOverlay} />
            </View>
            <View style={styles.heroBody}>
              <View style={styles.logoWrap}>
                {store.logo_url ? (
                  <Image source={{ uri: store.logo_url }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Text style={styles.logoText}>
                      {store.name?.[0] ?? 'S'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.storeName}>{store.name}</Text>
              {store.description ? (
                <Text style={styles.storeDesc}>{store.description}</Text>
              ) : null}
              <View style={styles.urlRow}>
                <Globe size={14} color={t.mutedForeground} />
                <Text style={styles.url} numberOfLines={1}>
                  {storeUrl.replace(/^https?:\/\//, '')}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <Button
                  label={store.is_published ? 'Unpublish' : 'Publish'}
                  loading={publishing}
                  onPress={togglePublish}
                  variant={store.is_published ? 'outline' : 'primary'}
                  testID="publish-toggle-button"
                  fullWidth
                />
              </View>
              <View style={styles.actionsRow}>
                <Button
                  label="Open"
                  onPress={() => Linking.openURL(storeUrl)}
                  variant="secondary"
                  fullWidth
                  icon={<ExternalLink size={14} color={t.foreground} />}
                  testID="open-store-button"
                />
                <Button
                  label="Share"
                  onPress={onShare}
                  variant="secondary"
                  fullWidth
                  testID="share-store-button"
                />
              </View>
            </View>
          </Card>

          {/* Edit on web hint */}
          <View style={styles.hint}>
            <Sparkles size={16} color={t.primary} />
            <Text style={styles.hintText}>
              Use the web dashboard to redesign your storefront with the visual
              builder. Most other tasks (products, orders, settings) can be done
              right here.
            </Text>
          </View>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <Stat label="Status" value={store.is_published ? 'Live' : 'Draft'} />
            <Stat label="Slug" value={store.slug} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: typography.xxl, fontWeight: '700', color: t.foreground },
  subtitle: { color: t.mutedForeground, fontSize: 13, marginTop: 2 },
  banner: {
    height: 120,
    backgroundColor: t.primary,
    position: 'relative',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  heroBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
    marginTop: -32,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    padding: 4,
    backgroundColor: t.background,
    marginBottom: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: t.muted,
  },
  logoFallback: {
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  storeName: {
    fontSize: 22,
    fontWeight: '700',
    color: t.foreground,
  },
  storeDesc: {
    color: t.mutedForeground,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  url: { color: t.mutedForeground, fontSize: 13 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  hint: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: t.primarySoft,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  hintText: { color: t.primaryStrong, fontSize: 13, flex: 1, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: {
    flex: 1,
    padding: 14,
    backgroundColor: t.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
  },
  statLabel: { color: t.mutedForeground, fontSize: 12 },
  statValue: { color: t.foreground, fontWeight: '700', marginTop: 4 },
});
