import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { lightTheme as t, radius, typography } from '../theme/tokens';

export interface SelectOption {
  value: string;
  label: string;
  /** Group/section label — items sharing the same group render under that section. */
  group?: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  testID?: string;
  modalTitle?: string;
  disabled?: boolean;
}

/**
 * Modal-based dropdown for React Native — matches the web's Select UX:
 *  - clickable trigger showing the current label (or placeholder)
 *  - bottom-sheet modal with full option list
 *  - optional grouping (e.g. parent category > subcategories)
 */
export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  testID,
  modalTitle,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  // Group options by .group, preserving original order for ungrouped ones.
  const grouped: { group: string | null; items: SelectOption[] }[] = [];
  options.forEach((o) => {
    const g = o.group ?? null;
    const last = grouped[grouped.length - 1];
    if (last && last.group === g) last.items.push(o);
    else grouped.push({ group: g, items: [o] });
  });

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, disabled && { opacity: 0.5 }]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.85}
        testID={testID}
        disabled={disabled}
      >
        <Text
          style={[
            styles.triggerText,
            !selected && { color: t.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color={t.mutedForeground} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {modalTitle ?? label ?? 'Select'}
            </Text>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={styles.closeBtn}
              testID={testID ? `${testID}-close` : undefined}
            >
              <X size={18} color={t.foreground} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={grouped}
            keyExtractor={(g, i) => g.group ?? `g-${i}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: section }) => (
              <View>
                {section.group ? (
                  <Text style={styles.sectionLabel}>{section.group}</Text>
                ) : null}
                {section.items.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.optionRow,
                        opt.disabled && { opacity: 0.45 },
                        active && { backgroundColor: t.primarySoft },
                      ]}
                      disabled={opt.disabled}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      testID={testID ? `${testID}-option-${opt.value}` : undefined}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: t.primaryStrong, fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {active ? <Check size={16} color={t.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.empty}>No options available.</Text>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: t.foreground,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.background,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  triggerText: { color: t.foreground, fontSize: typography.base, flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: t.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.border,
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: t.foreground },
  closeBtn: { padding: 4 },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    color: t.mutedForeground,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: { color: t.foreground, fontSize: 15 },
  empty: {
    textAlign: 'center',
    color: t.mutedForeground,
    paddingVertical: 24,
  },
});
