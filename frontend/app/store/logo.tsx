import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '../../src/lib/supabase';
import { useStoreContext } from '../../src/contexts/StoreContext';
import { Button } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

export default function LogoScreen() {
  const router = useRouter();
  const { store, refetchStore } = useStoreContext();
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow gallery access to pick a logo.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!r.canceled && r.assets?.[0]) {
      // Resize to 512x512 and compress
      const m = await ImageManipulator.manipulateAsync(
        r.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.PNG },
      );
      setPicked(m.uri);
    }
  };

  const save = async () => {
    if (!picked || !store) return;
    setSaving(true);
    try {
      const resp = await fetch(picked);
      const blob = await resp.blob();
      const key = `${store.id}/logo_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(key, blob, {
          contentType: 'image/png',
          upsert: true,
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage
        .from('product-images')
        .getPublicUrl(key);

      const { error: updErr } = await supabase
        .from('stores')
        .update({ logo_url: pub.publicUrl })
        .eq('id', store.id);
      if (updErr) throw updErr;

      await refetchStore();
      router.back();
    } catch (e: any) {
      Alert.alert('Could not save logo', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const current = picked ?? store?.logo_url;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>Store logo</Text>
        <Text style={styles.subtitle}>
          Square image, displayed across your storefront, invoices, and emails.
        </Text>

        <View style={styles.previewWrap}>
          {current ? (
            <Image source={{ uri: current }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.placeholder]}>
              <ImagePlus size={28} color={t.primary} />
              <Text style={styles.placeholderText}>No logo yet</Text>
            </View>
          )}
        </View>

        <Button
          label={current ? 'Change logo' : 'Choose from gallery'}
          onPress={pick}
          variant="outline"
          fullWidth
          testID="logo-pick"
        />

        {picked ? (
          <Button
            label="Save logo"
            onPress={save}
            loading={saving}
            fullWidth
            size="lg"
            style={{ marginTop: 12 }}
            testID="logo-save"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  body: { padding: 24, gap: 12 },
  title: { fontSize: typography.xl, fontWeight: '700', color: t.foreground },
  subtitle: { color: t.mutedForeground, fontSize: 14, lineHeight: 20 },
  previewWrap: { alignItems: 'center', marginVertical: 16 },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 24,
    backgroundColor: t.muted,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: t.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  placeholderText: { color: t.mutedForeground, fontSize: 13 },
});
