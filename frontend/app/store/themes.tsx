import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ExternalLink, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../src/lib/supabase';
import { useStoreContext } from '../../src/contexts/StoreContext';
import { Badge, Button, Card } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preview_image: string | null;
  is_premium: boolean | null;
  category: string | null;
}

export default function ThemesScreen() {
  const router = useRouter();
  const { store, refetchStore } = useStoreContext();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // Try the canonical 'themes' table; tolerate missing/permission errors gracefully.
    const { data, error } = await supabase
      .from('themes')
      .select('id,name,slug,description,preview_image,is_premium,category')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && Array.isArray(data)) {
      setThemes(data as Theme[]);
    } else {
      setThemes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onApply = async (theme: Theme) => {
    if (!store) return;
    if (theme.is_premium) {
      // Premium themes need the web upgrade flow
      router.push({
        pathname: '/store/webview',
        params: {
          url: `https://pictocart.in/themes/${theme.slug}`,
          title: theme.name,
        },
      });
      return;
    }
    setApplyingId(theme.id);
    const { error } = await supabase
      .from('stores')
      .update({ theme: { id: theme.id, slug: theme.slug } })
      .eq('id', store.id);
    setApplyingId(null);
    if (error) {
      Alert.alert('Could not apply theme', error.message);
      return;
    }
    await refetchStore();
    Alert.alert('Applied', `${theme.name} is now your store theme.`);
  };

  const currentThemeId =
    (store?.theme as any)?.id ?? (store?.theme as any)?.slug ?? null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  if (themes.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.empty}>
          <Sparkles size={28} color={t.primary} />
          <Text style={styles.emptyTitle}>Themes are managed on web</Text>
          <Text style={styles.emptySub}>
            Browse and apply themes from the web dashboard. We'll open it for
            you in an in-app browser.
          </Text>
          <Button
            label="Open theme marketplace"
            onPress={() =>
              router.push({
                pathname: '/store/webview',
                params: {
                  url: 'https://pictocart.in/themes',
                  title: 'Themes',
                },
              })
            }
            style={{ marginTop: 12 }}
            testID="themes-open-web"
            icon={<ExternalLink size={14} color="#fff" />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={themes}
        keyExtractor={(th) => th.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} tintColor={t.primary} />
        }
        renderItem={({ item }) => {
          const active = item.id === currentThemeId || item.slug === currentThemeId;
          return (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {item.preview_image ? (
                <Image
                  source={{ uri: item.preview_image }}
                  style={styles.themeImage}
                />
              ) : (
                <View style={[styles.themeImage, styles.placeholderImage]}>
                  <Sparkles size={20} color={t.primary} />
                </View>
              )}
              <View style={styles.themeBody}>
                <View style={styles.themeRow}>
                  <Text style={styles.themeName}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {item.is_premium ? (
                      <Badge label="Premium" color={t.primary} />
                    ) : null}
                    {active ? <Badge label="Active" color={t.success} /> : null}
                  </View>
                </View>
                {item.description ? (
                  <Text style={styles.themeDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.themeActions}>
                  {active ? (
                    <View style={styles.appliedRow}>
                      <Check size={14} color={t.success} />
                      <Text style={styles.appliedText}>Applied to your store</Text>
                    </View>
                  ) : (
                    <Button
                      label={item.is_premium ? 'View on web' : 'Apply'}
                      onPress={() => onApply(item)}
                      loading={applyingId === item.id}
                      size="sm"
                      testID={`theme-apply-${item.id}`}
                    />
                  )}
                </View>
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 32, alignItems: 'center' },
  emptyTitle: {
    color: t.foreground,
    fontWeight: '700',
    fontSize: 17,
    marginTop: 12,
  },
  emptySub: {
    color: t.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  themeImage: { width: '100%', height: 160, backgroundColor: t.muted },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },
  themeBody: { padding: 14 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: { color: t.foreground, fontWeight: '700', fontSize: 16, flex: 1 },
  themeDesc: { color: t.mutedForeground, fontSize: 13, marginTop: 4, lineHeight: 19 },
  themeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  appliedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appliedText: { color: t.success, fontWeight: '700', fontSize: 13 },
});
