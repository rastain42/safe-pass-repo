import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import CustomModal from '@/components/design/CustomModal';
import { useCamera } from '@/hooks/identity/useCamera';
import { useScanner } from '@/hooks/identity/useScanner';
import { SCAN_AREA_SIZE } from '@/utils/dimensions';

export default function ScanScreen() {
  const { hasPermission } = useCamera();
  const { scanned, modalVisible, modalContent, handleBarcodeScanned, resetScanner, closeModal } =
    useScanner();

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Demande d'accès à la caméra...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Accès à la caméra refusé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.overlay}>
          <View style={styles.unfilled} />
          <View style={styles.row}>
            <View style={styles.unfilled} />
            <View style={styles.scanArea}>
              <Text style={styles.scanText}>Placez le QR code du billet dans le cadre</Text>
            </View>
            <View style={styles.unfilled} />
          </View>
          <View style={styles.unfilled} />
        </View>
      </CameraView>

      {scanned && (
        <TouchableOpacity style={styles.button} onPress={resetScanner}>
          <Text style={styles.buttonText}>Scanner un autre billet</Text>
        </TouchableOpacity>
      )}
      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    margin: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0f0',
    padding: 15,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 40,
    minWidth: 180,
    position: 'absolute',
    bottom: 0,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
  },
  unfilled: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  row: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderWidth: 2,
    borderColor: '#0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    fontSize: 14,
  },
});
