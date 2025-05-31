import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NuggetModule } from 'nugget-rn';

export default function NuggetMockScreen() {
  const [result, setResult] = useState<string>('');
  let nuggetPlugin = new NuggetModule();
   const chetDeeplink = 'stashfin://unified-support/conversation?flowType=ticketing&omniTicketingFlow=true';
  const openNuggetSDK = () => {
    // Replace 'yourdeeplink://' with the actual deeplink if needed
    nuggetPlugin.openNuggetSDK(chetDeeplink).then((nuggetSDKResult: string) => {
      setResult(nuggetSDKResult);
    });
  };

  const verifyDeeplink = () => {
    // Replace 'yourdeeplink://' with the actual deeplink you want to verify
    nuggetPlugin.canOpenDeeplink(chetDeeplink).then((canOpenDeeplink: boolean) => {
      setResult(`Can open deeplink: ${canOpenDeeplink}`);
    });
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


