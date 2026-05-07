import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { lightTheme as t, radius, spacing, typography } from '../theme/tokens';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  style,
  textStyle,
  testID,
  icon,
}) => {
  const isDisabled = disabled || loading;

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: t.primary }
      : variant === 'secondary'
        ? { backgroundColor: t.secondary }
        : variant === 'outline'
          ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.border }
          : variant === 'destructive'
            ? { backgroundColor: t.destructive }
            : { backgroundColor: 'transparent' };

  const textColor =
    variant === 'primary' || variant === 'destructive'
      ? '#fff'
      : variant === 'secondary'
        ? t.foreground
        : t.foreground;

  const sizeStyle: ViewStyle =
    size === 'sm'
      ? { paddingVertical: 8, paddingHorizontal: 12 }
      : size === 'lg'
        ? { paddingVertical: 16, paddingHorizontal: 20 }
        : { paddingVertical: 12, paddingHorizontal: 16 };

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.btn,
        variantStyle,
        sizeStyle,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
          <Text
            style={[
              styles.btnText,
              { color: textColor, fontSize: size === 'sm' ? 13 : 15 },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, testID }) => {
  const C: any = onPress ? TouchableOpacity : View;
  return (
    <C
      testID={testID}
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      {children}
    </C>
  );
};

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, color, textColor, style }) => {
  const bg = color ?? t.muted;
  return (
    <View style={[styles.badge, { backgroundColor: bg + '22' }, style]}>
      <View style={[styles.dot, { backgroundColor: bg }]} />
      <Text style={[styles.badgeText, { color: textColor ?? bg }]}>{label}</Text>
    </View>
  );
};

export const Divider = ({ style }: { style?: ViewStyle }) => (
  <View style={[{ height: 1, backgroundColor: t.border }, style]} />
);

interface InputProps {
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  label?: string;
  error?: string | null;
  testID?: string;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  rightIcon?: React.ReactNode;
}

import { TextInput } from 'react-native';

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  label,
  error,
  testID,
  multiline,
  numberOfLines,
  editable = true,
  rightIcon,
}) => {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          error ? { borderColor: t.destructive } : null,
          !editable && { opacity: 0.6 },
        ]}
      >
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.mutedForeground}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            multiline && { height: (numberOfLines ?? 3) * 22, textAlignVertical: 'top' },
          ]}
        />
        {rightIcon ? <View style={{ paddingRight: 12 }}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: {
    backgroundColor: t.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: t.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: t.foreground,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.base,
    color: t.foreground,
  },
  errorText: {
    color: t.destructive,
    fontSize: 12,
    marginTop: 4,
  },
});
