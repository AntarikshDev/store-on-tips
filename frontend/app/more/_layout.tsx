import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#141821',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="customers" options={{ title: 'Customers' }} />
      <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="help" options={{ title: 'Help' }} />
    </Stack>
  );
}
