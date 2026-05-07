import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { StoreProvider, useStoreContext } from '../src/contexts/StoreContext';
import { PushNotifications } from '../src/lib/pushNotifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function NavigationGate({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { store, loading: storeLoading } = useStoreContext();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading || storeLoading) return;

    const seg0 = segments[0] as string | undefined;
    const inAuth = seg0 === 'auth';
    const inOnboarding = seg0 === 'onboarding';

    if (!session) {
      if (!inAuth) router.replace('/auth/login');
      return;
    }
    // Logged in
    if (!store) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }
    // Logged in + has store
    if (inAuth || inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading, store, storeLoading, segments, router]);

  return <>{children}</>;
}

function NotificationDeepLinkHandler() {
  const router = useRouter();
  useEffect(() => {
    // Handle taps on notifications when app is launched/backgrounded
    const sub = PushNotifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.order_id) {
          router.push(`/orders/${data.order_id}`);
        } else if (data?.product_id) {
          router.push(`/products/${data.product_id}`);
        } else if (data?.deep_link) {
          try {
            const url = new URL(String(data.deep_link));
            // pictocart://order/:id
            if (url.host === 'order' && url.pathname) {
              router.push(`/orders${url.pathname}`);
            } else if (url.host === 'product' && url.pathname) {
              router.push(`/products${url.pathname}`);
            }
          } catch {}
        }
      },
    );
    return () => sub.remove();
  }, [router]);

  // Initial URL handling for cold start deep links
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (!url) return;
      try {
        const u = Linking.parse(url);
        if (u.hostname === 'order' && u.path) {
          router.push(`/orders/${u.path.replace(/^\//, '')}`);
        } else if (u.hostname === 'product' && u.path) {
          router.push(`/products/${u.path.replace(/^\//, '')}`);
        }
      } catch {}
    });
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StoreProvider>
              <NavigationGate>
                <NotificationDeepLinkHandler />
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="orders/[id]"
                    options={{
                      headerShown: true,
                      title: 'Order',
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="products/new"
                    options={{
                      headerShown: true,
                      title: 'New Product',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="products/[id]"
                    options={{
                      headerShown: true,
                      title: 'Edit Product',
                    }}
                  />
                  <Stack.Screen name="store" />
                  <Stack.Screen name="more" />
                </Stack>
              </NavigationGate>
            </StoreProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
