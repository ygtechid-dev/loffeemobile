import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import Firebase v9 functions
import { ref, get, push, set } from 'firebase/database';
import { database } from '../../config/Fire'; 
import moment from 'moment/moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Cameras = ({ navigation, route }) => {
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.Back);
  const [loading, setLoading] = useState(true);
  
  // Gunakan useRef untuk functional component
  const cameraRef = useRef(null);

  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      } else {
        // Untuk iOS, permission akan diminta otomatis saat kamera diakses
        // Tapi kita set true dulu, nanti handle error jika ditolak
        setHasPermission(true);
      }
    } catch (err) {
      console.error('Permission error:', err);
      Alert.alert('Error', 'Failed to request camera permission', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const handleQR = async (event) => {
    if (scanned) return;

    const res = event.nativeEvent.codeStringValue;
    console.log('QR code scanned:', res);

    try {
      setScanned(true); // Set scanned true di awal untuk prevent multiple scan
      
      const parsedData = JSON.parse(res);
      console.log('Parsed QR Data:', parsedData);
      
      if (!parsedData || !parsedData.nama_outlet) {
        throw new Error('Invalid QR data structure');
      }

      // Firebase v9 syntax - buat reference
      const waitingListRef = ref(database, 'waitingList');
      
      // Ambil data waiting list untuk menghitung nomor waiting
      const snapshot = await get(waitingListRef);
      const waitingListData = snapshot.val() || {};
      
      // Filter waitingListData berdasarkan parsedData.nama_outlet
      const filteredWaitingList = Object.values(waitingListData).filter(
        item => item.info && item.info.nama_outlet === parsedData.nama_outlet
      );

      console.log('Filtered waiting list:', filteredWaitingList);
      
      const nomorWaitingNumeric = filteredWaitingList.length + 1;
      const nomorWaiting = `B${String(nomorWaitingNumeric).padStart(2, '0')}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generateId = "LFWD-" + randomNum;
      
      // Ambil nomor waiting terakhir yang sudah dipanggil
      const lastNomorFils = filteredWaitingList.filter((e) => e.statusCalled === "called");
      const lastNomorWaiting = lastNomorFils.length > 0 ? lastNomorFils[0]?.nomorWaiting : null;

      // Firebase v9 - push untuk generate key baru
      const newWaitingListRef = push(waitingListRef);
      parsedData.tanggal_wl = moment().format('DD-MM-YYYY');

      // Ambil data user dari AsyncStorage
      const findself = await AsyncStorage.getItem('@dataSelf');
      if (!findself) {
        throw new Error('User data not found in storage');
      }
      
      const parsing = JSON.parse(findself);
      console.log('User data:', parsing);

      // Validasi parsing data
      if (!parsing || !Array.isArray(parsing) || parsing.length === 0 || !parsing[0].handphone) {
        throw new Error('Invalid user data structure');
      }

      // Firebase v9 - set data ke reference yang baru
      await set(newWaitingListRef, {
        userId: generateId,
        info: parsedData,
        tanggalScan: new Date().toISOString(),
        nomorWaiting: nomorWaiting,
        whatsapp: parsing[0].handphone,
        statusCalled: "false"
      });

      console.log(`User added to waiting list with number ${nomorWaiting}`);

      // Navigate ke WaitingList
      navigation.replace('WaitingList', {
        data: parsedData,
        tanggalWL: new Date().toISOString(),
        nomorWait: nomorWaiting,
        waitingData: waitingListData,
        lastNomor: lastNomorWaiting
      });

    } catch (error) {
      console.error('QR Handle Error:', error);
      setScanned(false); // Reset scanned state jika error
      
      let errorMessage = 'QR code tidak valid';
      if (error.message.includes('User data')) {
        errorMessage = 'Data pengguna tidak ditemukan. Silakan login ulang.';
      } else if (error.message.includes('Invalid QR')) {
        errorMessage = 'Format QR code tidak sesuai.';
      } else if (error.message.includes('Firebase') || error.code) {
        errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet.';
      }
      
      Alert.alert('Error', errorMessage, [
        { 
          text: 'Coba Lagi', 
          onPress: () => setScanned(false) 
        },
        { 
          text: 'Kembali', 
          onPress: () => navigation.goBack() 
        }
      ]);
    }
  };

  // Handle camera error (untuk iOS permission denied)
  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    Alert.alert(
      'Camera Error', 
      'Unable to access camera. Please check permissions in Settings.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={requestCameraPermission}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        cameraType={cameraType}
        flashMode="auto"
        style={styles.camera}
        scanBarcode={true}
        onReadCode={handleQR}
        onError={handleCameraError}
        showFrame={true}
        laserColor='red'
        frameColor='black'
      />
      
      {/* Overlay untuk mencegah multiple scan */}
      {scanned && (
        <View style={styles.scanningOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.scanningText}>Processing QR Code...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setCameraType(
          cameraType === CameraType.Back ? CameraType.Front : CameraType.Back
        )}
        disabled={scanned}
      >
        <Icon name="switch-camera" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        disabled={scanned}
      >
        <Icon name="arrow-back" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default Cameras;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    padding: 15,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    padding: 15,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});