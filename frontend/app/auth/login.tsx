import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Fingerprint, Mail, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';
import { Biometric } from '../../src/lib/biometric';
import { Button, Input } from '../../src/components/ui';
import { lightTheme as t, spacing, typography } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      setBioAvailable(await Biometric.isAvailable());
      setBioEnabled(await Biometric.isEnabled());
    })();
  }, []);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    const { error: e } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (e) {
      setError(e.message ?? 'Could not sign in.');
      return;
    }
    // Offer biometric if first time login on this device
    if (bioAvailable && !bioEnabled) {
      Alert.alert(
        'Enable biometric login?',
        'Use Face ID / fingerprint to sign in faster next time.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              await Biometric.enable(email.trim().toLowerCase(), password);
            },
          },
        ],
      );
    }
  };

  const onBiometricLogin = async () => {
    const creds = await Biometric.getCredentials();
    if (!creds) {
      Alert.alert('Biometric login failed', 'Please sign in with your password.');
      return;
    }
    setEmail(creds.email);
    setPassword(creds.password);
    setLoading(true);
    const { error: e } = await signIn(creds.email, creds.password);
    setLoading(false);
    if (e) setError(e.message ?? 'Could not sign in.');
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
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.title}>Pictocart Seller</Text>
            <Text style={styles.subtitle}>
              Run your store on the go. Track sales, fulfil orders, ship fast.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              testID="login-email-input"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              testID="login-password-input"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              testID="login-submit-button"
              label="Sign in"
              onPress={onSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />

            <TouchableOpacity
              onPress={() => router.push('/auth/forgot')}
              style={styles.forgotLink}
              testID="forgot-password-link"
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {bioAvailable && bioEnabled ? (
              <Button
                testID="biometric-login-button"
                label="Use biometric login"
                onPress={onBiometricLogin}
                variant="outline"
                fullWidth
                style={{ marginTop: 8 }}
                icon={<Fingerprint size={18} color={t.foreground} />}
              />
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Pictocart?</Text>
            <TouchableOpacity
              onPress={() => router.push('/auth/signup')}
              testID="goto-signup-link"
            >
              <Text style={styles.footerLink}> Create a seller account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  brand: {
    alignItems: 'flex-start',
    marginBottom: 28,
    marginTop: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 28,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: t.foreground,
    marginBottom: 6,
  },
  subtitle: {
    color: t.mutedForeground,
    fontSize: typography.base,
    lineHeight: 22,
  },
  form: { marginTop: 8 },
  error: {
    color: t.destructive,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  forgotLink: { alignSelf: 'flex-end', paddingVertical: 12 },
  forgotText: {
    color: t.primary,
    fontWeight: '600',
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
