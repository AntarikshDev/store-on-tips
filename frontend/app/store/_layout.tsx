import { Stack } from 'expo-router';

export default function StoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#141821',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="themes" options={{ title: 'Themes' }} />
      <Stack.Screen name="logo" options={{ title: 'Logo' }} />
      <Stack.Screen name="webview" options={{ title: 'Storefront' }} />
    </Stack>
  );
}
