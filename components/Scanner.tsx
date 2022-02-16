import { BarCodeScannedCallback, BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';

import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Button from './Button';
import { StatusBar } from 'expo-status-bar';
import i18n from '../i18n';
import { openSettings } from 'expo-linking';

interface Props {
  onBarCodeScanned?: BarCodeScannedCallback;
  style?: StyleProp<ViewStyle>;
}

export default ({ onBarCodeScanned, style }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { t } = i18n;

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting for camera permission</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={{ ...styles.container, backgroundColor: '#000' }}>
        <Text style={{ color: '#fff' }}>{t('qrscan-no-permission')}</Text>
        <Button
          title={t('qrscan-go-to-settings')}
          style={{ marginVertical: 12, paddingHorizontal: 12 }}
          onPress={() => openSettings()}
        />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <Camera
      onBarCodeScanned={onBarCodeScanned}
      barCodeScannerSettings={{
        barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
      }}
      style={[StyleSheet.absoluteFill, styles.container]}
    ></Camera>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // the rock-solid workaround
  },
});
