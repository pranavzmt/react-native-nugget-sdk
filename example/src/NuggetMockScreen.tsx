import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNuggetSDK } from './components/NuggetSDKProvider';

export default function NuggetMockScreen() {
  const [result, setResult] = useState<string>('');
  const { sdk } = useNuggetSDK();
  const chatDeeplink = 'stashfin://unified-support/conversation?flowType=ticketing&omniTicketingFlow=true';

  const openNuggetSDK = async () => {
    try {
      const opened = await sdk.openNuggetSDK(chatDeeplink);
      setResult(opened ? 'SDK opened successfully' : 'Failed to open SDK');
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const verifyDeeplink = async () => {
    try {
      const canOpen = await sdk.canOpenDeeplink(chatDeeplink);
      setResult(`Can open deeplink: ${canOpen}`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={openNuggetSDK}>
        <Text style={styles.buttonText}>Open Nugget SDK</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={verifyDeeplink}>
        <Text style={styles.buttonText}>Verify Deeplink</Text>
      </TouchableOpacity>
      <Text style={styles.result}>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#007AFF', padding: 16, margin: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  result: { marginTop: 20, fontSize: 16 },
});


