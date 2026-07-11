/**
 * Root component — hand-rolled navigator.
 *
 * Why not react-navigation? For 5 screens with linear flow it adds ~800KB and a
 * stack of providers we don't need. A single useState + screen registry is plenty.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { I18nManager, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { PhotoCaptureScreen } from './src/screens/PhotoCaptureScreen';
import { MarkPointsScreen } from './src/screens/MarkPointsScreen';
import { LiveTryOnScreen } from './src/screens/LiveTryOnScreen';
import { SnapshotScreen } from './src/screens/SnapshotScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useAppStore } from './src/store/appStore';
import { colors } from './src/theme';
import type { ScreenName } from './src/navigation/types';

// Enable RTL up-front so Hebrew strings render in the right direction
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  // Note: setting forceRTL requires app restart on iOS. The store's language
  // setting persists so user choice applies on next launch.
}

interface StackEntry {
  name: ScreenName;
  params?: any;
}

export default function App() {
  const language = useAppStore(s => s.language);
  const [stack, setStack] = useState<StackEntry[]>([{ name: 'Welcome' }]);

  const nav = useMemo(() => ({
    push: (name: ScreenName, params?: any) =>
      setStack(s => [...s, { name, params }]),
    pop: () =>
      setStack(s => (s.length > 1 ? s.slice(0, -1) : s)),
    replace: (name: ScreenName, params?: any) =>
      setStack(s => [...s.slice(0, -1), { name, params }]),
  }), []);

  const current = stack[stack.length - 1];

  const renderScreen = useCallback(() => {
    switch (current.name) {
      case 'Welcome':       return <WelcomeScreen       nav={nav} params={current.params} />;
      case 'PhotoCapture':  return <PhotoCaptureScreen  nav={nav} params={current.params} />;
      case 'MarkPoints':    return <MarkPointsScreen    nav={nav} params={current.params} />;
      case 'LiveTryOn':     return <LiveTryOnScreen     nav={nav} params={current.params} />;
      case 'Snapshot':      return <SnapshotScreen      nav={nav} params={current.params} />;
      case 'Settings':      return <SettingsScreen      nav={nav} params={current.params} />;
      default:              return <WelcomeScreen       nav={nav} />;
    }
  }, [current, nav]);

  // Re-render on language change so Hebrew/English strings update
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      <View key={language} style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}
