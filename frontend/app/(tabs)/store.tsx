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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Mail,
  Palette,
  Search,
  Sparkles,
  Wand2,
  FileText,
  BookOpen,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';

import { useStoreContext } from '../../src/contexts/StoreContext';
import { supabase } from '../../src/lib/supabase';
import { Button, Card } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

export default function StoreScreen() {
  const router = useRouter();
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

  const openWeb = (path: string, title: string) =>
    router.push({
      pathname: '/store/webview',
      params: { url: `https://pictocart.in${path}`, title },
    });

  const sections: {
    title: string;
    items: {
      icon: React.ReactNode;
      label: string;
      sub?: string;
      onPress: () => void;
      testID: string;
    }[];
  }[] = [
    {
      title: 'Design',
      items: [
        {
          icon: <Palette size={18} color={t.primary} />,
          label: 'Themes',
          sub: 'Browse and apply themes',
          onPress: () => router.push('/store/themes'),
          testID: 'store-link-themes',
        },
        {
          icon: <Wand2 size={18} color={t.primary} />,
          label: 'Customise',
          sub: 'Visual builder (opens on web)',
          onPress: () => openWeb('/customise', 'Customise'),
          testID: 'store-link-customise',
        },
        {
          icon: <ImageIcon size={18} color={t.primary} />,
          label: 'Logo',
          sub: 'Upload a square logo',
          onPress: () => router.push('/store/logo'),
          testID: 'store-link-logo',
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          icon: <Globe size={18} color={t.primary} />,
          label: 'Domain',
          sub: store.custom_domain ?? `pictocart.in/${store.slug}`,
          onPress: () => openWeb('/settings/domain', 'Domain'),
          testID: 'store-link-domain',
        },
        {
          icon: <Search size={18} color={t.primary} />,
          label: 'SEO',
          sub: 'Title, description, keywords',
          onPress: () => openWeb('/settings/seo', 'SEO'),
          testID: 'store-link-seo',
        },
        {
          icon: <Mail size={18} color={t.primary} />,
          label: 'Email branding',
          sub: 'Sender name, header, footer',
          onPress: () => openWeb('/settings/email-branding', 'Email branding'),
          testID: 'store-link-email',
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          icon: <FileText size={18} color={t.primary} />,
          label: 'Pages',
          sub: 'About, Contact, Policies',
          onPress: () => openWeb('/pages', 'Pages'),
          testID: 'store-link-pages',
        },
        {
          icon: <BookOpen size={18} color={t.primary} />,
          label: 'Blog',
          sub: 'Posts, drafts, SEO',
          onPress: () => openWeb('/blog', 'Blog'),
          testID: 'store-link-blog',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Store</Text>
          <Text style={styles.subtitle}>Preview & manage your storefront</Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Hero card */}
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

          {/* Storefront sections */}
          {sections.map((section) => (
            <View key={section.title} style={{ marginTop: 20 }}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.testID}
                  style={styles.item}
                  onPress={item.onPress}
                  activeOpacity={0.85}
                  testID={item.testID}
                >
                  <View style={styles.itemIcon}>{item.icon}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.sub ? (
                      <Text style={styles.itemSub} numberOfLines={1}>
                        {item.sub}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight size={16} color={t.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={styles.hint}>
            <Sparkles size={16} color={t.primaryStrong} />
            <Text style={styles.hintText}>
              Heavy editors (visual builder, advanced settings) open in an
              in-app browser. Your seller session persists.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sectionLabel: {
    fontSize: 12,
    color: t.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: 8,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: t.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { color: t.foreground, fontSize: 15, fontWeight: '600' },
  itemSub: { color: t.mutedForeground, fontSize: 12, marginTop: 2 },
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
});
