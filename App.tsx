import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RNBootSplash from 'react-native-bootsplash';
import RootNavigator from './src/navigation';

// Force RTL for Arabic UI
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Note: After changing RTL settings, you MUST perform a full app restart
// (e.g., npm run android or npm run ios) for changes to take effect.

export default function App() {
  useEffect(() => {
    const init = async () => {
      // …do some stuff (data migrations, optimistic lookups, etc.)
    };

    init().finally(async () => {
      await RNBootSplash.hide({ fade: true });
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
...
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
