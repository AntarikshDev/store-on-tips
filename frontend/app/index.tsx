import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { lightTheme as t } from '../src/theme/tokens';

// Splash — root navigation gate decides where to send the user.
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={t.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.background,
  },
});
