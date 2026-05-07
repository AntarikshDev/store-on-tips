import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightTheme as t } from '../../src/theme/tokens';

/**
 * In-app WebView fallback for storefront features that are heavy (dnd-kit
 * visual builder, advanced settings) and not feasible to reimplement in RN.
 *
 * Usage:  router.push({ pathname: '/store/webview', params: { url, title } })
 */
export default function StoreWebView() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const nav = useNavigation();
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (title) nav.setOptions({ title: String(title) });
  }, [title, nav]);

  if (!url) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: t.mutedForeground }}>Missing URL.</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <WebView
        source={{ uri: String(url) }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        style={{ flex: 1 }}
        renderLoading={() => (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        )}
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
