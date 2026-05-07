import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Store as StoreIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { useStoreContext } from '../src/contexts/StoreContext';
import { Button, Input } from '../src/components/ui';
import { lightTheme as t, spacing, typography } from '../src/theme/tokens';

const CATEGORIES = [
  'Fashion & Apparel',
  'Beauty & Personal Care',
  'Home & Living',
  'Electronics',
  'Food & Beverage',
  'Handcrafted',
  'Books & Stationery',
  'Other',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { refetchStore } = useStoreContext();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

  const generateSlug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40);

  const onNameChange = (v: string) => {
    setName(v);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(v));
    }
  };

  const next = () => {
    setError(null);
    if (step === 1 && !name.trim()) {
      setError('Store name is required.');
      return;
    }
    if (step === 2 && !slug.trim()) {
      setError('Store URL is required.');
      return;
    }
    if (step === 4 && !category) {
      setError('Please pick a category.');
      return;
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const back = () => {
    if (step === 1) {
      Alert.alert('Sign out?', 'You will return to the login screen.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ]);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const finish = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    // Append a short suffix to slug to avoid collisions
    const finalSlug = slug + '-' + Math.random().toString(36).slice(2, 6);
    const { error: e } = await supabase.from('stores').insert({
      user_id: user.id,
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      category,
      is_published: false,
      onboarding_step: 7,
    });
    setLoading(false);
    if (e) {
      setError(e.message ?? 'Could not create your store.');
      return;
    }
    await refetchStore();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={back} style={styles.backBtn} testID="onboarding-back">
            <ChevronLeft size={22} color={t.foreground} />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.stepCounter}>
            {step}/{totalSteps}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <View>
              <View style={styles.iconHero}>
                <StoreIcon size={32} color={t.primary} />
              </View>
              <Text style={styles.h1}>Welcome! Let’s name your store.</Text>
              <Text style={styles.sub}>
                This is what your customers will see.
              </Text>
              <View style={{ marginTop: 24 }}>
                <Input
                  label="Store name"
                  value={name}
                  onChangeText={onNameChange}
                  placeholder="e.g. Aanya's Boutique"
                  autoCapitalize="words"
                  testID="onboarding-name-input"
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.h1}>Pick your store URL</Text>
              <Text style={styles.sub}>
                Your storefront will be live at pictocart.in/{slug}.
              </Text>
              <View style={{ marginTop: 24 }}>
                <Input
                  label="Store URL"
                  value={slug}
                  onChangeText={(v) => setSlug(generateSlug(v))}
                  placeholder="aanyas-boutique"
                  testID="onboarding-slug-input"
                />
                <Text style={styles.helper}>
                  Lowercase letters, numbers, and dashes only.
                </Text>
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.h1}>Tell us about your store</Text>
              <Text style={styles.sub}>
                A one-line tagline helps customers know what you sell. (Optional)
              </Text>
              <View style={{ marginTop: 24 }}>
                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Hand-crafted ethnic wear delivered across India."
                  multiline
                  numberOfLines={4}
                  autoCapitalize="sentences"
                  testID="onboarding-description-input"
                />
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.h1}>What do you sell?</Text>
              <Text style={styles.sub}>Pick a primary category.</Text>
              <View style={{ marginTop: 16 }}>
                {CATEGORIES.map((c) => {
                  const selected = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      testID={`onboarding-cat-${c}`}
                      style={[
                        styles.catItem,
                        selected && {
                          borderColor: t.primary,
                          backgroundColor: t.primarySoft,
                        },
                      ]}
                      onPress={() => setCategory(c)}
                    >
                      <Text
                        style={[
                          styles.catText,
                          selected && { color: t.primaryStrong, fontWeight: '700' },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.h1}>Add products later</Text>
              <Text style={styles.sub}>
                Once your store is live, you can add products from the Products
                tab — including images from your camera or gallery.
              </Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>Tip 💡</Text>
                <Text style={styles.tipText}>
                  Sellers who add at least 5 products in the first week receive
                  3x more orders on average.
                </Text>
              </View>
            </View>
          )}

          {step === 6 && (
            <View>
              <Text style={styles.h1}>Get notified instantly</Text>
              <Text style={styles.sub}>
                We’ll send a push notification the moment a customer places an
                order so you can fulfil it fast. You can grant permission on the
                next screen.
              </Text>
            </View>
          )}

          {step === 7 && (
            <View>
              <Text style={styles.h1}>You’re all set 🎉</Text>
              <Text style={styles.sub}>
                We’ll create your store now. You can publish it whenever you’re
                ready from the dashboard.
              </Text>
              <View style={styles.summaryCard}>
                <SummaryRow label="Name" value={name} />
                <SummaryRow label="URL" value={`pictocart.in/${slug}`} />
                {category ? <SummaryRow label="Category" value={category} /> : null}
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          {step < totalSteps ? (
            <Button
              testID="onboarding-next-button"
              label="Continue"
              onPress={next}
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              testID="onboarding-finish-button"
              label="Create my store"
              onPress={finish}
              loading={loading}
              fullWidth
              size="lg"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 6, borderRadius: 8 },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: t.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: t.primary,
  },
  stepCounter: {
    fontSize: 12,
    color: t.mutedForeground,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  scroll: { padding: 24, paddingTop: 16, flexGrow: 1 },
  iconHero: {
    width: 60,
    height: 60,
    backgroundColor: t.primarySoft,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  h1: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: t.foreground,
    marginBottom: 8,
  },
  sub: { color: t.mutedForeground, fontSize: 15, lineHeight: 22 },
  helper: { color: t.mutedForeground, fontSize: 12, marginTop: -4 },
  catItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: 8,
  },
  catText: { fontSize: 15, color: t.foreground },
  tipCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: t.primarySoft,
    borderRadius: 12,
  },
  tipTitle: { fontWeight: '700', color: t.primaryStrong, marginBottom: 4 },
  tipText: { color: t.foreground, fontSize: 14, lineHeight: 20 },
  summaryCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: t.muted,
    borderRadius: 12,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sumLabel: { color: t.mutedForeground, fontSize: 13 },
  sumValue: { color: t.foreground, fontWeight: '600', fontSize: 14, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  error: {
    marginTop: 16,
    color: t.destructive,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: t.border,
    backgroundColor: t.background,
  },
});
