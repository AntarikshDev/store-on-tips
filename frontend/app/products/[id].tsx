import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductForm from '../../src/components/products/ProductForm';
import { useProduct } from '../../src/hooks/queries';
import { lightTheme as t } from '../../src/theme/tokens';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id as string);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProductForm
        productId={id as string}
        initial={product}
        loadingInitial={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
