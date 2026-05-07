import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Camera, ImagePlus, Plus, Trash2, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '../../src/lib/supabase';
import { useStoreContext } from '../../src/contexts/StoreContext';
import { Button, Input } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

const MAX_IMAGES = 6;

export default function NewProductScreen() {
  const router = useRouter();
  const { store } = useStoreContext();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [inventory, setInventory] = useState('1');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]); // local URIs
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compress = async (uri: string) => {
    const m = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    return m.uri;
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add product images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled && result.assets) {
      const uris = await Promise.all(result.assets.map((a) => compress(a.uri)));
      setImages((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take product photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const uri = await compress(result.assets[0].uri);
      setImages((prev) => [...prev, uri].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const uploadImage = async (uri: string, idx: number): Promise<string> => {
    if (!store) throw new Error('No store');
    // Convert URI → blob via fetch
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
      // Upload images
      const urls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        try {
          const u = await uploadImage(images[i], i);
          urls.push(u);
        } catch (e: any) {
          console.warn('[upload] failed', e);
          // Continue without image
        }
      }

      const compareNum = comparePrice ? parseFloat(comparePrice) : null;
      const invNum = parseInt(inventory, 10);

      const { error: insErr } = await supabase.from('products').insert({
        store_id: store.id,
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        compare_at_price: compareNum,
        inventory_count: Number.isFinite(invNum) ? invNum : 0,
        category: category.trim() || null,
        images: urls.length ? urls : null,
        is_active: true,
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
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, i) => (
              <View key={i} style={styles.imageWrap}>
                <Image source={{ uri }} style={styles.img} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(i)}
                  testID={`remove-image-${i}`}
                >
                  <X size={14} color="#fff" />
                </TouchableOpacity>
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

          <Text style={styles.helper}>Up to {MAX_IMAGES} photos.</Text>

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
            value={description}
            onChangeText={setDescription}
            placeholder="Tell shoppers about the product"
            multiline
            numberOfLines={3}
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Create product"
            onPress={onSave}
            loading={saving}
            fullWidth
            size="lg"
            testID="product-save-button"
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: t.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  addBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: t.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  addInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: { color: t.primary, fontSize: 11, fontWeight: '700' },
  helper: { color: t.mutedForeground, fontSize: 12, marginTop: 6 },
  error: {
    color: t.destructive,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
});
