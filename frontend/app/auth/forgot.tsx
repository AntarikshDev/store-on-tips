import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';
import { Button, Input } from '../../src/components/ui';
import { lightTheme as t, typography } from '../../src/theme/tokens';

export default function ForgotScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    const { error: e } = await resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (e) {
      setError(e.message ?? 'Could not send reset email.');
      return;
    }
    setInfo('Check your inbox for the reset link.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            testID="forgot-back-button"
          >
            <ChevronLeft size={22} color={t.foreground} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter the email associated with your seller account and we’ll send
            you a reset link.
          </Text>

          <View style={{ marginTop: 24 }}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              testID="forgot-email-input"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <Button
              testID="forgot-submit-button"
              label="Send reset link"
              onPress={onSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backText: { color: t.foreground, fontSize: 15, marginLeft: 2 },
  title: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: t.foreground,
    marginBottom: 6,
  },
  subtitle: { color: t.mutedForeground, fontSize: 15, lineHeight: 22 },
  error: {
    color: t.destructive,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  info: {
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
});
