import React from 'react';
import { View, StatusBar, SafeAreaView, Platform } from 'react-native';
import NuggetMockScreen from './NuggetMockScreen';

const App = () => {
  return Platform.OS === 'ios' ? (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <NuggetMockScreen />
      </View>
    </SafeAreaView>
  ) : (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="light-content" />
      <NuggetMockScreen />
    </View>
  );
};

export default App;
