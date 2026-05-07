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

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error: e } = await signUp(
      email.trim().toLowerCase(),
      password,
      fullName.trim(),
    );
    setLoading(false);
    if (e) {
      setError(e.message ?? 'Could not create account.');
      return;
    }
    setInfo(
      'Account created! If email confirmation is required, check your inbox. Otherwise tap Sign in.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            testID="signup-back-button"
          >
            <ChevronLeft size={22} color={t.foreground} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create your seller account</Text>
          <Text style={styles.subtitle}>
            Free forever to get started. Add products in minutes.
          </Text>

          <View style={styles.form}>
            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Anjali Sharma"
              autoCapitalize="words"
              testID="signup-name-input"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              testID="signup-email-input"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              testID="signup-password-input"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Button
              testID="signup-submit-button"
              label="Create account"
              onPress={onSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.replace('/auth/login')}
              testID="goto-login-link"
            >
              <Text style={styles.footerLink}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  scroll: { flexGrow: 1, padding: 24 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: { color: t.foreground, fontSize: 15, marginLeft: 2 },
  title: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: t.foreground,
    marginBottom: 6,
  },
  subtitle: { color: t.mutedForeground, fontSize: 15, lineHeight: 22 },
  form: { marginTop: 24 },
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
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: { color: t.mutedForeground, fontSize: 14 },
  footerLink: { color: t.primary, fontWeight: '700', fontSize: 14 },
});
