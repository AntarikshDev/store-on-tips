import React, { useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../src/lib/supabase';
import { useProduct } from '../../src/hooks/queries';
import { Button, Input } from '../../src/components/ui';
import { lightTheme as t } from '../../src/theme/tokens';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id as string);
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [inventory, setInventory] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setTitle(product.title ?? '');
    setDescription(product.description ?? '');
    setPrice(String(product.price ?? ''));
    setComparePrice(
      product.compare_at_price ? String(product.compare_at_price) : '',
    );
    setInventory(String(product.inventory_count ?? 0));
    setCategory(product.category ?? '');
    setIsActive(!!product.is_active);
  }, [product]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={t.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={{ color: t.mutedForeground }}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const onSave = async () => {
    setError(null);
    setSaving(true);
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setSaving(false);
      setError('Enter a valid price');
      return;
    }
    const { error: e } = await supabase
      .from('products')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
        inventory_count: parseInt(inventory, 10) || 0,
        category: category.trim() || null,
        is_active: isActive,
      })
      .eq('id', product.id);
    setSaving(false);
    if (e) {
      setError(e.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ['products'] });
    router.back();
  };

  const onDelete = () =>
    Alert.alert('Delete product?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('products').delete().eq('id', product.id);
          qc.invalidateQueries({ queryKey: ['products'] });
          router.back();
        },
      },
    ]);

  const img = product.images?.[0];

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
          {img ? (
            <Image source={{ uri: img }} style={styles.preview} />
          ) : null}

          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            testID="edit-product-title"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Price (₹)"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Compare at"
                value={comparePrice}
                onChangeText={setComparePrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Stock"
                value={inventory}
                onChangeText={setInventory}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Category" value={category} onChangeText={setCategory} />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: t.muted, true: t.primary }}
              thumbColor="#fff"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Save changes"
            onPress={onSave}
            loading={saving}
            fullWidth
            size="lg"
            testID="edit-product-save"
          />
          <Button
            label="Delete product"
            onPress={onDelete}
            variant="outline"
            fullWidth
            style={{ marginTop: 8 }}
            textStyle={{ color: t.destructive }}
            testID="edit-product-delete"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: t.muted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.card,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: 12,
  },
  toggleLabel: { color: t.foreground, fontSize: 15, fontWeight: '500' },
  error: {
    color: t.destructive,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
});
