import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  ImagePlus,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '../../src/lib/supabase';
import { useStoreContext } from '../../src/contexts/StoreContext';
import { useWallet } from '../../src/hooks/queries';
import { Button, Input } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

const MAX_IMAGES = 6;

interface AIProductResponse {
  product?: {
    title?: string;
    description?: string;
    shortDescription?: string;
    tags?: string[];
    suggestedPrice?: number;
    seoTitle?: string;
    seoDescription?: string;
  };
  _meta?: {
    new_balance?: number;
    credits_charged?: number;
    cache_hit?: boolean;
  };
  error?: string;
  code?: string;
}

export default function NewProductScreen() {
  const router = useRouter();
  const { store } = useStoreContext();
  const qc = useQueryClient();
  const { data: wallet, refetch: refetchWallet } = useWallet();

  // Photos: keep both local URI and (after upload) public URL
  const [images, setImages] = useState<{ local: string; remote?: string }[]>(
    [],
  );
  const [productHint, setProductHint] = useState('');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [inventory, setInventory] = useState('1');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = (wallet as any)?.balance ?? 0;

  const compress = async (uri: string) => {
    const m = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    return m.uri;
  };

  const uploadImage = async (uri: string, idx: number): Promise<string> => {
    if (!store) throw new Error('No store');
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const key = `${store.id}/${Date.now()}_${idx}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(key, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('product-images').getPublicUrl(key);
    return data.publicUrl;
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled && result.assets) {
      const compressed = await Promise.all(
        result.assets.map((a) => compress(a.uri)),
      );
      const newImages = compressed.map((local) => ({ local }));
      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled && result.assets?.[0]) {
      const local = await compress(result.assets[0].uri);
      setImages((prev) => [...prev, { local }].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  /**
   * Ensure first image is uploaded so we have a public URL the edge
   * function can fetch + analyse.
   */
  const ensureFirstImageUploaded = async (): Promise<string | null> => {
    if (images.length === 0) return null;
    const first = images[0];
    if (first.remote) return first.remote;
    try {
      const url = await uploadImage(first.local, 0);
      setImages((prev) => {
        const next = [...prev];
        next[0] = { local: first.local, remote: url };
        return next;
      });
      return url;
    } catch (e: any) {
      console.warn('[generate] upload failed', e);
      return null;
    }
  };

  const onGenerate = async () => {
    setError(null);
    if (!store) return;
    if (images.length === 0 && !productHint.trim()) {
      Alert.alert(
        'Add a photo or hint',
        'Add at least one photo or a short product hint before generating.',
      );
      return;
    }
    setGenerating(true);
    try {
      const imageUrl = await ensureFirstImageUploaded();
      const { data, error: fnErr } = await supabase.functions.invoke<
        AIProductResponse
      >('generate-product', {
        body: {
          imageUrl,
          productHint: productHint.trim() || undefined,
          category: category.trim() || undefined,
          store_id: store.id,
        },
      });

      // Edge fn errors usually surface via fnErr OR via data.error/code
      const code = (fnErr as any)?.code ?? data?.code;
      const msg =
        (fnErr as any)?.message ??
        data?.error ??
        '';

      if (code === 'INSUFFICIENT_CREDITS' || /insufficient/i.test(msg)) {
        Alert.alert(
          'Out of AI credits',
          'You\'ve run out of AI credits. Top up to keep generating.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Top up',
              onPress: () => router.push('/more/wallet' as any),
            },
          ],
        );
        return;
      }
      if (fnErr) throw fnErr;
      if (!data?.product) throw new Error('No product returned');

      const p = data.product;
      if (p.title) setTitle(p.title);
      if (p.shortDescription) setShortDescription(p.shortDescription);
      if (p.description) setDescription(p.description);
      if (p.suggestedPrice && !price) setPrice(String(p.suggestedPrice));
      if (p.tags?.length) setTags(p.tags.join(', '));
      if (p.seoTitle) setSeoTitle(p.seoTitle);
      if (p.seoDescription) setSeoDescription(p.seoDescription);

      await refetchWallet();
      const charged = data._meta?.credits_charged ?? 0;
      const cached = data._meta?.cache_hit;
      Alert.alert(
        '✨ Generated',
        cached
          ? 'Filled in from cache (no credits charged).'
          : `Filled in. ${charged} credit${charged === 1 ? '' : 's'} used.`,
      );
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    setError(null);
    if (!store) return;
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid price.');
      return;
    }
    setSaving(true);
    try {
      // Upload any not-yet-uploaded images
      const urls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const im = images[i];
        if (im.remote) {
          urls.push(im.remote);
        } else {
          try {
            const u = await uploadImage(im.local, i);
            urls.push(u);
          } catch (e) {
            console.warn('[upload] failed', e);
          }
        }
      }

      const tagArr = tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { error: insErr } = await supabase.from('products').insert({
        store_id: store.id,
        title: title.trim(),
        description: description.trim() || null,
        short_description: shortDescription.trim() || null,
        price: priceNum,
        compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
        inventory_count: parseInt(inventory, 10) || 0,
        category: category.trim() || null,
        tags: tagArr.length ? tagArr : null,
        images: urls.length ? urls : null,
        is_active: true,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      });
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Credit badge */}
          <TouchableOpacity
            style={styles.creditBadge}
            onPress={() => router.push('/more/wallet' as any)}
            activeOpacity={0.85}
            testID="credit-badge"
          >
            <Wallet size={14} color={t.primaryStrong} />
            <Text style={styles.creditText}>
              {balance} AI credit{balance === 1 ? '' : 's'}
            </Text>
            <Text style={styles.creditHint}>Tap to top up</Text>
          </TouchableOpacity>

          {/* Photos */}
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.imageGrid}>
            {images.map((im, i) => (
              <View key={i} style={styles.imageWrap}>
                <Image source={{ uri: im.local }} style={styles.img} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(i)}
                  testID={`remove-image-${i}`}
                >
                  <X size={14} color="#fff" />
                </TouchableOpacity>
                {i === 0 ? (
                  <View style={styles.firstBadge}>
                    <Text style={styles.firstBadgeText}>AI</Text>
                  </View>
                ) : null}
              </View>
            ))}
            {images.length < MAX_IMAGES ? (
              <View style={styles.addBox}>
                <TouchableOpacity
                  style={styles.addInner}
                  onPress={pickFromGallery}
                  testID="pick-from-gallery"
                >
                  <ImagePlus size={20} color={t.primary} />
                  <Text style={styles.addText}>Gallery</Text>
                </TouchableOpacity>
                <View style={{ height: 1, backgroundColor: t.border }} />
                <TouchableOpacity
                  style={styles.addInner}
                  onPress={pickFromCamera}
                  testID="pick-from-camera"
                >
                  <Camera size={20} color={t.primary} />
                  <Text style={styles.addText}>Camera</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          <Text style={styles.helper}>
            Up to {MAX_IMAGES} photos. The first photo is used by AI.
          </Text>

          {/* AI generation */}
          <View style={{ height: 16 }} />
          <Input
            label="Product hint (optional)"
            value={productHint}
            onChangeText={setProductHint}
            placeholder="e.g. Hand-block printed cotton kurta in pastel pink"
            multiline
            numberOfLines={2}
            autoCapitalize="sentences"
            testID="product-hint-input"
          />
          <Button
            label="✨ Generate with AI"
            onPress={onGenerate}
            loading={generating}
            fullWidth
            size="lg"
            testID="generate-with-ai-button"
            icon={<Sparkles size={16} color="#fff" />}
            style={{ marginBottom: 4 }}
            disabled={generating || saving}
          />
          <Text style={styles.helper}>
            Uses 1 AI credit. Auto-fills title, description, tags, price, and
            SEO from your photo + hint.
          </Text>

          {/* Manual fields */}
          <View style={{ height: 16 }} />
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Cotton kurta — pastel pink"
            autoCapitalize="sentences"
            testID="product-title-input"
          />
          <Input
            label="Short description"
            value={shortDescription}
            onChangeText={setShortDescription}
            placeholder="One-line summary for cards"
            autoCapitalize="sentences"
            testID="product-short-description-input"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Full product description"
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
            testID="product-description-input"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Price (₹)"
                value={price}
                onChangeText={setPrice}
                placeholder="999"
                keyboardType="decimal-pad"
                testID="product-price-input"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Compare at"
                value={comparePrice}
                onChangeText={setComparePrice}
                placeholder="1499"
                keyboardType="decimal-pad"
                testID="product-compare-price-input"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Stock"
                value={inventory}
                onChangeText={setInventory}
                placeholder="1"
                keyboardType="number-pad"
                testID="product-stock-input"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Category"
                value={category}
                onChangeText={setCategory}
                placeholder="Apparel"
                autoCapitalize="words"
                testID="product-category-input"
              />
            </View>
          </View>
          <Input
            label="Tags (comma-separated)"
            value={tags}
            onChangeText={setTags}
            placeholder="cotton, summer, pastel"
            testID="product-tags-input"
          />
          <Input
            label="SEO title"
            value={seoTitle}
            onChangeText={setSeoTitle}
            placeholder="Auto-filled by AI"
            testID="product-seo-title-input"
          />
          <Input
            label="SEO description"
            value={seoDescription}
            onChangeText={setSeoDescription}
            placeholder="Auto-filled by AI"
            multiline
            numberOfLines={2}
            testID="product-seo-description-input"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Create product"
            onPress={onSave}
            loading={saving}
            fullWidth
            size="lg"
            testID="product-save-button"
            style={{ marginTop: 8 }}
            disabled={generating || saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primarySoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  creditText: { color: t.primaryStrong, fontWeight: '700', fontSize: 13 },
  creditHint: { color: t.primaryStrong, fontSize: 11, opacity: 0.7 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: t.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageWrap: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: t.primary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  firstBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: t.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  addInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addText: { color: t.primary, fontSize: 11, fontWeight: '700' },
  helper: { color: t.mutedForeground, fontSize: 12, marginTop: 6 },
  error: {
    color: t.destructive,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 13,
  },
});
