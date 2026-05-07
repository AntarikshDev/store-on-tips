import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Node.js 20 (used for Expo web SSR) lacks native WebSocket — polyfill so the
// Supabase realtime layer doesn't crash on import.
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws');
    (globalThis as any).WebSocket = ws.WebSocket || ws;
  } catch {}
}

// Hardcoded per project spec — these are public anon keys, not secrets.
// (Existing Supabase backend is shared with the web app; do not change.)
const SUPABASE_URL = 'https://qxeyndsvkfsmkilkzmuc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZXluZHN2a2ZzbWtpbGt6bXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjc1MzQsImV4cCI6MjA5MDY0MzUzNH0.Pq6YLc_cyp886zdGBQjYcpZluNf3s5H6frYY9UQEkjI';

/**
 * SecureStore-backed adapter for Supabase Auth.
 * SecureStore values must be ≤ 2 KB on iOS — Supabase session JSON is ~1.5 KB so safe.
 * Falls back to in-memory on web (for static export).
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('[SecureStore.get] failed', e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('[SecureStore.set] failed', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[SecureStore.remove] failed', e);
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
