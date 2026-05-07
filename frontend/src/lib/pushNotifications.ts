import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Show notifications while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
  } as any),
});

export async function registerForPushAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[push] not a physical device — skipping');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pictocart Seller',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') {
    console.log('[push] permission denied');
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenRes.data;
  } catch (e) {
    console.warn('[push] getExpoPushTokenAsync failed', e);
    return null;
  }
}

export async function registerPushTokenWithBackend(
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'register-push-token',
      {
        body: {
          token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          device_id: Device.osInternalBuildId ?? Device.modelId ?? null,
          app_version: Constants.expoConfig?.version ?? '1.0.0',
        },
      },
    );
    if (error) {
      console.warn('[push] register edge fn error', error);
      return { ok: false, error: error.message };
    }
    console.log('[push] registered', data);
    return { ok: true };
  } catch (e: any) {
    console.warn('[push] register exception', e);
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}

export const PushNotifications = Notifications;
