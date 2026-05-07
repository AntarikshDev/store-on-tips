/**
 * Mirror of web src/components/products/ProductTypeFields.tsx — RN port.
 * Keeps the same key/label/options so AI-generated metadata stays interoperable.
 */
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Input } from '../ui';
import { Select, SelectOption } from '../Select';
import { lightTheme as t } from '../../theme/tokens';

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'physical', label: 'Physical Product' },
  { value: 'digital', label: 'Digital Product' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'beauty', label: 'Beauty & Cosmetics' },
  { value: 'handmade', label: 'Handmade / Craft' },
  { value: 'service', label: 'Service' },
];

export type ProductType =
  | 'physical'
  | 'digital'
  | 'food'
  | 'fashion'
  | 'electronics'
  | 'beauty'
  | 'handmade'
  | 'service';

const CATEGORY_TO_TYPE: Record<string, ProductType> = {
  fashion: 'fashion', clothing: 'fashion', apparel: 'fashion',
  food: 'food', grocery: 'food', bakery: 'food', restaurant: 'food',
  electronics: 'electronics', gadgets: 'electronics', tech: 'electronics',
  beauty: 'beauty', cosmetics: 'beauty', skincare: 'beauty',
  handmade: 'handmade', craft: 'handmade', art: 'handmade',
  digital: 'digital', software: 'digital', ebook: 'digital',
  service: 'service', services: 'service',
};

export const getDefaultProductType = (
  storeCategory?: string | null,
): ProductType => {
  if (!storeCategory) return 'physical';
  const lower = storeCategory.toLowerCase();
  for (const [key, type] of Object.entries(CATEGORY_TO_TYPE)) {
    if (lower.includes(key)) return type;
  }
  return 'physical';
};

interface Props {
  productType: ProductType;
  metadata: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const optionsFromArray = (arr: string[]): SelectOption[] =>
  arr.map((v) => ({ value: v, label: v }));

const ProductTypeFields: React.FC<Props> = ({ productType, metadata, onChange }) => {
  const field = (
    key: string,
    label: string,
    placeholder: string,
    multiline = false,
  ) => (
    <Input
      key={key}
      label={label}
      value={metadata[key] || ''}
      onChangeText={(v) => onChange(key, v)}
      placeholder={placeholder}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      autoCapitalize="sentences"
      testID={`type-field-${key}`}
    />
  );

  const selectField = (key: string, label: string, opts: string[]) => (
    <Select
      key={key}
      label={label}
      value={metadata[key] || ''}
      onChange={(v) => onChange(key, v)}
      options={optionsFromArray(opts)}
      placeholder={`Select ${label.toLowerCase()}`}
      testID={`type-select-${key}`}
    />
  );

  const toggleField = (key: string, label: string) => (
    <View style={styles.toggleRow} key={key}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={!!metadata[key]}
        onValueChange={(v) => onChange(key, v)}
        trackColor={{ false: t.muted, true: t.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  switch (productType) {
    case 'fashion':
      return (
        <View>
          {field('material', 'Material', 'e.g. 100% Cotton')}
          {field('care_instructions', 'Care Instructions', 'e.g. Machine wash cold', true)}
          {selectField('fit_type', 'Fit Type', ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized'])}
          {selectField('gender', 'Gender', ['Men', 'Women', 'Unisex', 'Kids', 'Boys', 'Girls'])}
        </View>
      );
    case 'food':
      return (
        <View>
          {field('ingredients', 'Ingredients', 'List all ingredients', true)}
          {field('nutritional_info', 'Nutritional Info', 'Calories, protein, etc.', true)}
          {field('shelf_life', 'Shelf Life', 'e.g. 6 months')}
          {field('allergens', 'Allergens', 'e.g. Contains nuts, gluten')}
          {field('fssai_license', 'FSSAI License No.', 'License number')}
        </View>
      );
    case 'electronics':
      return (
        <View>
          {field('warranty_period', 'Warranty Period', 'e.g. 1 year manufacturer warranty')}
          {field('model_number', 'Model Number', 'e.g. MX-2024')}
          {field('power_rating', 'Power Rating', 'e.g. 65W')}
          {field('connectivity', 'Connectivity', 'e.g. Bluetooth 5.3, WiFi 6')}
        </View>
      );
    case 'beauty':
      return (
        <View>
          {field('ingredients', 'Ingredients', 'Key ingredients', true)}
          {selectField('skin_type', 'Skin Type', ['All Skin Types', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'])}
          {field('usage_instructions', 'Usage Instructions', 'How to use', true)}
          {field('expiry_date', 'Expiry Date', 'MM/YYYY')}
        </View>
      );
    case 'handmade':
      return (
        <View>
          {field('making_time', 'Making Time', 'e.g. 3-5 days')}
          {field('material', 'Material', 'e.g. Handwoven jute')}
          {toggleField('customization_available', 'Customization Available')}
        </View>
      );
    case 'digital':
      return (
        <View>
          {field('file_format', 'File Format', 'e.g. PDF, MP4, ZIP')}
          {field('download_link', 'Download Link', 'URL for digital delivery')}
          {selectField('license_type', 'License Type', ['Personal Use', 'Commercial Use', 'Extended License', 'Open Source'])}
        </View>
      );
    case 'service':
      return (
        <View>
          {field('duration', 'Duration', 'e.g. 1 hour session')}
          {field('delivery_method', 'Delivery Method', 'e.g. Online / In-person')}
          {toggleField('booking_required', 'Booking Required')}
        </View>
      );
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  toggleLabel: { color: t.foreground, fontSize: 14, fontWeight: '500' },
});

export default ProductTypeFields;
