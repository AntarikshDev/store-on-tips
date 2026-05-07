import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'pictocart_biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'pictocart_biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'pictocart_biometric_password';

export const Biometric = {
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  },

  async isEnabled(): Promise<boolean> {
    try {
      const v = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return v === 'true';
    } catch {
      return false;
    }
  },

  async authenticate(reason = 'Sign in to Pictocart Seller'): Promise<boolean> {
    try {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });
      return r.success;
    } catch {
      return false;
    }
  },

  async enable(email: string, password: string): Promise<boolean> {
    try {
      const ok = await this.authenticate('Enable biometric login');
      if (!ok) return false;
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
      return true;
    } catch {
      return false;
    }
  },

  async getCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) return null;
      const ok = await this.authenticate();
      if (!ok) return null;
      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
      if (!email || !password) return null;
      return { email, password };
    } catch {
      return null;
    }
  },

  async disable(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
    } catch {}
  },
};
