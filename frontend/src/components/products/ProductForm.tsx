/**
 * Comprehensive Product Form — full parity with the web's
 * `src/pages/ProductForm.tsx`. Used by both /products/new and /products/[id].
 *
 * Mirrors:
 *  - Product Type select (8 options)
 *  - Images & Product Hint card with "Generate with AI" button (calls
 *    `generate-product` edge fn; charges credits; auto-fills fields)
 *  - Product Details card (Title / Short Description / Description with
 *    Plain Text + Key Highlights tabs)
 *  - Type-specific fields (fashion/food/electronics/beauty/handmade/digital/service)
 *  - Pricing & Discount (MRP + Discount% + Selling Price with auto-calc + savings badge)
 *  - Variants (with category presets + add option/value chips)
 *  - Status switch (Active/Draft)
 *  - Organization (Category dropdown w/ subcategory groups + SKU + Tags chips)
 *  - Inventory (Stock Quantity)
 *  - SEO (SEO Title 60 + counter, SEO Description 160 + counter)
 *  - Save Draft + Publish/Update buttons
 *  - AI credit badge in header
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  ChevronLeft,
  ImagePlus,
  Plus,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '../../lib/supabase';
import { useStoreContext } from '../../contexts/StoreContext';
import { useWallet } from '../../hooks/queries';
import { useCategories } from '../../hooks/useCategories';
import { Button, Input } from '../ui';
import { Select, SelectOption } from '../Select';
import {
  lightTheme as t,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import ProductTypeFields, {
  PRODUCT_TYPES,
  ProductType,
  getDefaultProductType,
} from './ProductTypeFields';
import VariantMatrix, { VariantOption } from './VariantMatrix';

const MAX_IMAGES = 6;

interface AIProductResponse {
  product?: {
    title?: string;
    description?: string;
    shortDescription?: string;
    suggestedPrice?: number;
    category?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    highlights?: string[];
    product_type?: ProductType;
    metadata?: Record<string, any>;
  };
  _meta?: {
    new_balance?: number;
    credits_charged?: number;
    cache_hit?: boolean;
  };
  error?: string;
  code?: string;
}

interface ProductFormProps {
  productId?: string;
  initial?: any | null;
  loadingInitial?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  productId,
  initial,
  loadingInitial,
}) => {
  const router = useRouter();
  const { store } = useStoreContext();
  const qc = useQueryClient();
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const { parentCategories, getSubcategories, loading: catsLoading } =
    useCategories();
  const isEdit = !!productId;

  // Core fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [productHint, setProductHint] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<{ local: string; remote?: string }[]>(
    [],
  );
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [inventoryCount, setInventoryCount] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [productType, setProductType] = useState<ProductType>(
    getDefaultProductType(store?.category),
  );
  const [typeMetadata, setTypeMetadata] = useState<Record<string, any>>({});
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState('');
  const [descriptionTab, setDescriptionTab] =
    useState<'plain' | 'highlights'>('plain');

  // Async state
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = (wallet as any)?.balance ?? 0;

  // Hydrate for edit mode
  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title ?? '');
    setDescription(initial.description ?? '');
    setShortDescription(initial.short_description ?? '');
    setPrice(initial.price != null ? String(initial.price) : '');
    if (initial.compare_at_price != null) {
      setCompareAtPrice(String(initial.compare_at_price));
      if (initial.price && initial.compare_at_price > initial.price) {
        const d = Math.round(
          ((initial.compare_at_price - initial.price) /
            initial.compare_at_price) *
            100,
        );
        if (d > 0) setDiscountPercent(String(d));
      }
    }
    const aiData = (initial.ai_generated_data as Record<string, any>) || {};
    if (aiData.product_hint) setProductHint(aiData.product_hint);
    setCategory(initial.category ?? '');
    setSku(initial.sku ?? '');
    setTags((initial.tags as string[]) ?? []);
    setImages(
      ((initial.images as string[]) ?? []).map((url) => ({
        local: url,
        remote: url,
      })),
    );
    setVariants((initial.variants as VariantOption[]) ?? []);
    setInventoryCount(String(initial.inventory_count ?? 0));
    setIsActive(initial.is_active ?? true);
    setSeoTitle(initial.seo_title ?? '');
    setSeoDescription(initial.seo_description ?? '');
    if (aiData.product_type) setProductType(aiData.product_type as ProductType);
    if (aiData.highlights) setHighlights(aiData.highlights);
    const { product_type, highlights: _, product_hint: _h, ...rest } = aiData;
    setTypeMetadata(rest || {});
  }, [initial]);

  // Image helpers
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
      const next = compressed.map((local) => ({ local }));
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
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

  // Pricing auto-calc
  const onChangeMRP = (mrp: string) => {
    setCompareAtPrice(mrp);
    if (mrp && discountPercent) {
      const sp = Math.round(Number(mrp) * (1 - Number(discountPercent) / 100));
      setPrice(String(sp));
    } else if (mrp && !discountPercent) {
      setPrice(mrp);
    }
  };
  const onChangeDiscount = (d: string) => {
    setDiscountPercent(d);
    if (compareAtPrice && d) {
      const sp = Math.round(Number(compareAtPrice) * (1 - Number(d) / 100));
      setPrice(String(sp));
    } else if (compareAtPrice && !d) {
      setPrice(compareAtPrice);
    }
  };
  const onChangePrice = (sp: string) => {
    setPrice(sp);
    if (compareAtPrice && sp) {
      const d = Math.round(
        ((Number(compareAtPrice) - Number(sp)) / Number(compareAtPrice)) * 100,
      );
      setDiscountPercent(d > 0 ? String(d) : '');
    }
  };

  // Tags + highlights
  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags((p) => [...p, v]);
    setTagInput('');
  };
  const removeTag = (v: string) => setTags(tags.filter((x) => x !== v));
  const addHighlight = () => {
    const v = highlightInput.trim();
    if (v) setHighlights((p) => [...p, v]);
    setHighlightInput('');
  };
  const removeHighlight = (i: number) =>
    setHighlights(highlights.filter((_, idx) => idx !== i));

  // AI generation
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
    } catch (e) {
      console.warn('[generate] upload failed', e);
      return null;
    }
  };

  const onGenerate = async () => {
    setError(null);
    if (!store) return;
    if (images.length === 0) {
      Alert.alert(
        'Upload an image',
        'Add at least one product photo before generating with AI.',
      );
      return;
    }
    setAiLoading(true);
    try {
      const imageUrl = await ensureFirstImageUploaded();
      const { data, error: fnErr } = await supabase.functions.invoke<
        AIProductResponse
      >('generate-product', {
        body: {
          imageUrl,
          productHint: productHint.trim() || undefined,
          category: category || store.category,
          storeName: store.name,
          productType,
          store_id: store.id,
        },
      });
      const code = (fnErr as any)?.code ?? data?.code;
      const msg = (fnErr as any)?.message ?? data?.error ?? '';
      if (code === 'INSUFFICIENT_CREDITS' || /insufficient/i.test(msg)) {
        Alert.alert(
          'Out of AI credits',
          "You've run out of AI credits. Top up to keep generating.",
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
      if (p.description) setDescription(p.description);
      if (p.shortDescription) setShortDescription(p.shortDescription);
      if (p.suggestedPrice && !price) setPrice(String(p.suggestedPrice));
      if (p.category) setCategory(p.category);
      if (p.tags?.length) setTags(p.tags);
      if (p.seoTitle) setSeoTitle(p.seoTitle);
      if (p.seoDescription) setSeoDescription(p.seoDescription);
      if (p.highlights) setHighlights(p.highlights);
      if (p.product_type) setProductType(p.product_type);
      if (p.metadata && typeof p.metadata === 'object') {
        setTypeMetadata((prev) => ({ ...prev, ...p.metadata }));
      }
      await refetchWallet();
      const charged = data._meta?.credits_charged ?? 0;
      Alert.alert(
        '✨ AI generated',
        data._meta?.cache_hit
          ? 'Filled in from cache (no credits charged).'
          : `Filled in. ${charged} credit${charged === 1 ? '' : 's'} used.`,
      );
    } catch (e: any) {
      setError(e?.message ?? 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Save / Publish
  const handleSave = async (asDraft: boolean) => {
    setError(null);
    if (!store) return;
    if (!title.trim()) {
      setError('Product title is required');
      return;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Valid price is required');
      return;
    }
    setSaving(true);
    try {
      // Upload pending images
      const urls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const im = images[i];
        if (im.remote) {
          urls.push(im.remote);
          continue;
        }
        try {
          urls.push(await uploadImage(im.local, i));
        } catch (e) {
          console.warn('[upload] failed', e);
        }
      }

      const payload: any = {
        store_id: store.id,
        title: title.trim(),
        description: description || null,
        short_description: shortDescription || null,
        price: priceNum,
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        category: category || null,
        sku: sku || null,
        tags: tags.length ? tags : null,
        images: urls.length ? urls : null,
        variants: variants.length ? variants : null,
        inventory_count: Number(inventoryCount) || 0,
        is_active: asDraft ? false : isActive,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        ai_generated_data: {
          product_type: productType,
          highlights,
          product_hint: productHint || undefined,
          ...typeMetadata,
        },
      };

      let err;
      if (isEdit && productId) {
        const { error: e } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId);
        err = e;
      } else {
        const { error: e } = await supabase.from('products').insert(payload);
        err = e;
      }
      if (err) throw err;

      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Build category options w/ groups
  const categoryOptions: SelectOption[] = useMemo(() => {
    const out: SelectOption[] = [];
    parentCategories.forEach((p) => {
      const subs = getSubcategories(p.id);
      if (subs.length === 0) {
        out.push({ value: p.name, label: p.name });
      } else {
        subs.forEach((s) =>
          out.push({
            value: `${p.name} > ${s.name}`,
            label: s.name,
            group: p.name,
          }),
        );
      }
    });
    return out;
  }, [parentCategories, getSubcategories]);

  // Loading state for edit
  if (isEdit && loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  // Savings
  const showSavings =
    Number(compareAtPrice) > 0 &&
    Number(price) > 0 &&
    Number(price) < Number(compareAtPrice);
  const finalDiscount = showSavings
    ? discountPercent ||
      String(
        Math.round(
          ((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) *
            100,
        ),
      )
    : '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="product-form-back"
        >
          <ChevronLeft size={20} color={t.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </Text>
          <Text style={styles.headerSub}>
            {isEdit ? 'Update product details' : 'Upload an image and let AI do the rest'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.creditBadge}
          onPress={() => router.push('/more/wallet' as any)}
          testID="credit-badge"
        >
          <Wallet size={12} color={t.primaryStrong} />
          <Text style={styles.creditText}>{balance}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Type */}
        <Card title="Product Type">
          <Select
            value={productType}
            onChange={(v) => setProductType(v as ProductType)}
            options={PRODUCT_TYPES.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
            placeholder="Select product type"
            testID="product-type-select"
            modalTitle="Product Type"
          />
        </Card>

        {/* Images & Product Hint */}
        <Card
          title="Images & Product Hint"
          right={
            <Button
              label={aiLoading ? 'Generating…' : 'Generate with AI'}
              onPress={onGenerate}
              size="sm"
              variant="outline"
              loading={aiLoading}
              disabled={aiLoading || images.length === 0}
              icon={<Sparkles size={12} color={t.foreground} />}
              testID="generate-with-ai-button"
            />
          }
        >
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
          {images.length > 0 && images.length < 4 ? (
            <View style={styles.aiTip}>
              <Text style={styles.aiTipText}>
                💡 Upload 4–5 photos from different angles for much better
                AI-generated details.
              </Text>
            </View>
          ) : null}

          <Input
            label="One-liner about this product"
            value={productHint}
            onChangeText={setProductHint}
            placeholder="e.g. Georgette saree with stone work and shimmer finish"
            autoCapitalize="sentences"
            testID="product-hint-input"
          />
          <Text style={styles.helper}>
            Briefly describe the product — this helps AI generate accurate
            details.
          </Text>
        </Card>

        {/* Product Details */}
        <Card title="Product Details">
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Product title"
            autoCapitalize="sentences"
            testID="product-title-input"
          />
          <Input
            label="Short Description"
            value={shortDescription}
            onChangeText={setShortDescription}
            placeholder="One-line summary"
            autoCapitalize="sentences"
            testID="product-short-description-input"
          />

          {/* Plain / Highlights tabs */}
          <Text style={styles.fieldLabel}>Description</Text>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, descriptionTab === 'plain' && styles.tabActive]}
              onPress={() => setDescriptionTab('plain')}
              testID="desc-tab-plain"
            >
              <Text
                style={[
                  styles.tabText,
                  descriptionTab === 'plain' && styles.tabTextActive,
                ]}
              >
                Plain Text
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                descriptionTab === 'highlights' && styles.tabActive,
              ]}
              onPress={() => setDescriptionTab('highlights')}
              testID="desc-tab-highlights"
            >
              <Text
                style={[
                  styles.tabText,
                  descriptionTab === 'highlights' && styles.tabTextActive,
                ]}
              >
                Key Highlights
              </Text>
            </TouchableOpacity>
          </View>
          {descriptionTab === 'plain' ? (
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Full product description…"
              multiline
              numberOfLines={5}
              autoCapitalize="sentences"
              testID="product-description-input"
            />
          ) : (
            <View>
              {highlights.map((h, i) => (
                <View key={i} style={styles.highlightRow}>
                  <Text style={styles.highlightDot}>•</Text>
                  <Text style={styles.highlightText}>{h}</Text>
                  <TouchableOpacity
                    onPress={() => removeHighlight(i)}
                    testID={`highlight-remove-${i}`}
                  >
                    <X size={14} color={t.destructive} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.inlineRow}>
                <Input
                  value={highlightInput}
                  onChangeText={setHighlightInput}
                  placeholder="Add a key feature…"
                  testID="highlight-input"
                />
              </View>
              <Button
                label="Add highlight"
                variant="secondary"
                size="sm"
                onPress={addHighlight}
                icon={<Plus size={12} color={t.foreground} />}
                testID="highlight-add"
              />
            </View>
          )}
        </Card>

        {/* Type-specific */}
        {productType !== 'physical' ? (
          <Card
            title={`${
              PRODUCT_TYPES.find((p) => p.value === productType)?.label
            } Details`}
          >
            <ProductTypeFields
              productType={productType}
              metadata={typeMetadata}
              onChange={(k, v) =>
                setTypeMetadata((prev) => ({ ...prev, [k]: v }))
              }
            />
          </Card>
        ) : null}

        {/* Pricing & Discount */}
        <Card title="Pricing & Discount">
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="MRP (₹)"
                value={compareAtPrice}
                onChangeText={onChangeMRP}
                placeholder="Maximum Retail Price"
                keyboardType="decimal-pad"
                testID="product-mrp-input"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Discount (%)"
                value={discountPercent}
                onChangeText={onChangeDiscount}
                placeholder="0"
                keyboardType="number-pad"
                testID="product-discount-input"
              />
            </View>
          </View>
          <Input
            label="Selling Price (₹)"
            value={price}
            onChangeText={onChangePrice}
            placeholder="Auto-calculated or enter manually"
            keyboardType="decimal-pad"
            testID="product-price-input"
          />
          {showSavings ? (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsStrike}>
                ₹{Number(compareAtPrice).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.savingsFinal}>
                ₹{Number(price).toLocaleString('en-IN')}
              </Text>
              <View style={styles.discountTag}>
                <Text style={styles.discountTagText}>
                  {finalDiscount}% OFF
                </Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* Variants */}
        <Card>
          <VariantMatrix
            category={category}
            options={variants}
            onChange={setVariants}
          />
        </Card>

        {/* Status */}
        <Card title="Status">
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              {isActive ? 'Active' : 'Draft'}
            </Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: t.muted, true: t.primary }}
              thumbColor="#fff"
              testID="product-active-switch"
            />
          </View>
        </Card>

        {/* Organization */}
        <Card title="Organization">
          <Select
            label="Category"
            value={category}
            onChange={setCategory}
            options={
              catsLoading
                ? [{ value: '__loading', label: 'Loading…', disabled: true }]
                : categoryOptions.length
                  ? categoryOptions
                  : [
                      {
                        value: '__none',
                        label: 'No categories — create them on web',
                        disabled: true,
                      },
                    ]
            }
            placeholder="Select category"
            testID="product-category-select"
            modalTitle="Category"
          />
          <Input
            label="SKU"
            value={sku}
            onChangeText={setSku}
            placeholder="ABC-123"
            autoCapitalize="characters"
            testID="product-sku-input"
          />

          <Text style={styles.fieldLabel}>Tags</Text>
          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <Input
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add tag…"
                testID="tag-input"
              />
            </View>
            <Button
              label="Add"
              variant="secondary"
              size="sm"
              onPress={addTag}
              testID="tag-add"
            />
          </View>
          {tags.length > 0 ? (
            <View style={styles.chipsRow}>
              {tags.map((tg) => (
                <View key={tg} style={styles.chip}>
                  <Text style={styles.chipText}>{tg}</Text>
                  <TouchableOpacity
                    onPress={() => removeTag(tg)}
                    testID={`tag-remove-${tg}`}
                  >
                    <X size={12} color={t.foreground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Inventory */}
        <Card title="Inventory">
          <Input
            label="Stock Quantity"
            value={inventoryCount}
            onChangeText={setInventoryCount}
            placeholder="0"
            keyboardType="number-pad"
            testID="product-stock-input"
          />
        </Card>

        {/* SEO */}
        <Card title="SEO">
          <Input
            label="SEO Title"
            value={seoTitle}
            onChangeText={(v) => setSeoTitle(v.slice(0, 60))}
            placeholder="Under 60 characters"
            testID="product-seo-title-input"
          />
          <Text style={styles.counter}>{seoTitle.length}/60</Text>
          <Input
            label="SEO Description"
            value={seoDescription}
            onChangeText={(v) => setSeoDescription(v.slice(0, 160))}
            placeholder="Under 160 characters"
            multiline
            numberOfLines={3}
            testID="product-seo-description-input"
          />
          <Text style={styles.counter}>{seoDescription.length}/160</Text>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {/* Sticky bottom actions */}
      <View style={styles.footer}>
        <Button
          label="Save Draft"
          variant="outline"
          onPress={() => handleSave(true)}
          loading={saving}
          fullWidth
          testID="product-save-draft"
        />
        <Button
          label={isEdit ? 'Update' : 'Publish'}
          onPress={() => handleSave(false)}
          loading={saving}
          fullWidth
          testID="product-save-button"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Card primitive
// ──────────────────────────────────────────────────────────────────────────
const Card: React.FC<{
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, right, children }) => (
  <View style={styles.card}>
    {title || right ? (
      <View style={styles.cardHeader}>
        {title ? <Text style={styles.cardTitle}>{title}</Text> : <View />}
        {right ? <View>{right}</View> : null}
      </View>
    ) : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
    gap: 8,
    backgroundColor: t.background,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: t.foreground,
  },
  headerSub: { fontSize: 12, color: t.mutedForeground, marginTop: 1 },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primarySoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  creditText: { color: t.primaryStrong, fontWeight: '700', fontSize: 12 },
  card: {
    backgroundColor: t.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: t.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: t.foreground },
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
  helper: {
    color: t.mutedForeground,
    fontSize: 11,
    marginTop: -4,
    marginBottom: 8,
  },
  aiTip: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginVertical: 12,
  },
  aiTipText: { color: '#92400E', fontSize: 12, lineHeight: 17 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: t.foreground,
    marginBottom: 6,
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: t.muted,
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: t.background },
  tabText: { fontSize: 12, color: t.mutedForeground, fontWeight: '600' },
  tabTextActive: { color: t.foreground },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  highlightDot: { color: t.primary, fontSize: 18, fontWeight: '700' },
  highlightText: { flex: 1, color: t.foreground, fontSize: 14 },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  savingsStrike: {
    color: t.mutedForeground,
    textDecorationLine: 'line-through',
    fontSize: 13,
  },
  savingsFinal: { color: '#15803D', fontWeight: '800', fontSize: 16 },
  discountTag: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: { color: t.foreground, fontSize: 14, fontWeight: '600' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  chipText: { color: t.foreground, fontSize: 12, fontWeight: '600' },
  counter: {
    color: t.mutedForeground,
    fontSize: 11,
    marginTop: -4,
    marginBottom: 8,
    textAlign: 'right',
  },
  error: {
    color: t.destructive,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: t.background,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
});

export default ProductForm;
