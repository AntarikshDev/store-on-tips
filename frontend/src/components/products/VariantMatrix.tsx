/**
 * Mirror of web src/components/products/VariantMatrix.tsx — RN port.
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Trash2, X } from 'lucide-react-native';
import { lightTheme as t, radius } from '../../theme/tokens';
import { Button } from '../ui';

export interface VariantOption {
  name: string;
  values: string[];
}

interface Props {
  category: string | null;
  options: VariantOption[];
  onChange: (options: VariantOption[]) => void;
}

const CATEGORY_PRESETS: Record<string, VariantOption[]> = {
  Fashion: [
    { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Color', values: [] },
  ],
  Food: [
    { name: 'Weight', values: ['250g', '500g', '1kg'] },
    { name: 'Type', values: [] },
  ],
  Electronics: [
    { name: 'Storage', values: ['64GB', '128GB', '256GB'] },
    { name: 'Color', values: [] },
  ],
  Beauty: [
    { name: 'Size', values: ['50ml', '100ml', '200ml'] },
    { name: 'Shade', values: [] },
  ],
};

const matchPresetKey = (cat: string | null): string | null => {
  if (!cat) return null;
  const lower = cat.toLowerCase();
  for (const k of Object.keys(CATEGORY_PRESETS)) {
    if (lower.includes(k.toLowerCase())) return k;
  }
  return null;
};

const VariantMatrix: React.FC<Props> = ({ category, options, onChange }) => {
  const [newValue, setNewValue] = useState<Record<number, string>>({});
  const presetKey = matchPresetKey(category);

  const loadPreset = () => {
    if (presetKey) onChange(CATEGORY_PRESETS[presetKey]);
  };

  const addOption = () => onChange([...options, { name: '', values: [] }]);

  const removeOption = (i: number) =>
    onChange(options.filter((_, idx) => idx !== i));

  const updateOptionName = (i: number, name: string) => {
    const next = [...options];
    next[i] = { ...next[i], name };
    onChange(next);
  };

  const addValue = (oi: number) => {
    const v = (newValue[oi] || '').trim();
    if (!v) return;
    const next = [...options];
    if (!next[oi].values.includes(v)) {
      next[oi] = { ...next[oi], values: [...next[oi].values, v] };
      onChange(next);
    }
    setNewValue({ ...newValue, [oi]: '' });
  };

  const removeValue = (oi: number, vi: number) => {
    const next = [...options];
    next[oi] = {
      ...next[oi],
      values: next[oi].values.filter((_, i) => i !== vi),
    };
    onChange(next);
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Variants</Text>
        <View style={styles.headerActions}>
          {presetKey ? (
            <Button
              label={`Load ${presetKey} preset`}
              variant="outline"
              size="sm"
              onPress={loadPreset}
              testID="variant-load-preset"
            />
          ) : null}
          <Button
            label="Add option"
            variant="outline"
            size="sm"
            onPress={addOption}
            icon={<Plus size={12} color={t.foreground} />}
            testID="variant-add-option"
          />
        </View>
      </View>

      {options.map((opt, oi) => (
        <View key={oi} style={styles.optionCard}>
          <View style={styles.optRow}>
            <TextInput
              style={styles.input}
              value={opt.name}
              onChangeText={(v) => updateOptionName(oi, v)}
              placeholder="Option name (e.g. Size, Color)"
              placeholderTextColor={t.mutedForeground}
              testID={`variant-name-${oi}`}
            />
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => removeOption(oi)}
              testID={`variant-remove-${oi}`}
            >
              <Trash2 size={16} color={t.destructive} />
            </TouchableOpacity>
          </View>

          {opt.values.length > 0 ? (
            <View style={styles.chipsRow}>
              {opt.values.map((val, vi) => (
                <View key={vi} style={styles.chip}>
                  <Text style={styles.chipText}>{val}</Text>
                  <TouchableOpacity
                    onPress={() => removeValue(oi, vi)}
                    testID={`variant-${oi}-remove-${vi}`}
                  >
                    <X size={12} color={t.foreground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.optRow}>
            <TextInput
              style={styles.input}
              value={newValue[oi] || ''}
              onChangeText={(v) => setNewValue({ ...newValue, [oi]: v })}
              onSubmitEditing={() => addValue(oi)}
              placeholder="Add value…"
              placeholderTextColor={t.mutedForeground}
              testID={`variant-value-input-${oi}`}
            />
            <Button
              label="Add"
              variant="secondary"
              size="sm"
              onPress={() => addValue(oi)}
              testID={`variant-value-add-${oi}`}
            />
          </View>
        </View>
      ))}

      {options.length === 0 ? (
        <Text style={styles.empty}>
          No variants added. Add options like Size, Color, etc.
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 14, fontWeight: '700', color: t.foreground },
  headerActions: { flexDirection: 'row', gap: 8 },
  optionCard: {
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: t.background,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: t.foreground,
    fontSize: 14,
  },
  iconBtn: { padding: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
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
  empty: {
    textAlign: 'center',
    color: t.mutedForeground,
    fontSize: 13,
    paddingVertical: 16,
  },
});

export default VariantMatrix;
