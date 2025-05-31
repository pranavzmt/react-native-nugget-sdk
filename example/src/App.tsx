import React from 'react';
import { NuggetSDKProvider } from './components/NuggetSDKProvider';
import NuggetMockScreen from './NuggetMockScreen';

export default function App() {
  return (
    <NuggetSDKProvider nameSpace="example-namespace">
      <NuggetMockScreen />
    </NuggetSDKProvider>
  );
}
