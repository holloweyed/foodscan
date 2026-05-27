// mobile/src/screens/ScanScreen.js
import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Camera } from 'react-native-vision-camera';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCamera } from '../hooks/useCamera';
import { useAnalysis } from '../hooks/useAnalysis';
import LoadingOverlay from '../components/common/LoadingOverlay';
import ScanFrame from '../components/scanner/ScanFrame';
import { COLORS } from '../constants/colors';

const ScanScreen = ({ navigation }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(true);

  const {
    device,
    cameraRef,
    hasPermission,
    isCameraReady,
    requestPermission,
    takePhoto,
    pickFromGallery,
    onCameraReady,
    onCameraError,
  } = useCamera();

  const { analyze, isLoading } = useAnalysis();

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    const netState = await NetInfo.fetch();
    setIsOffline(!netState.isConnected);
    setChecking(false);
  };

  useEffect(() => {
    if (!isOffline) {
      requestPermission();
    }
  }, [isOffline]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const imageUri = await takePhoto();
      if (imageUri) {
        const cropped = await ImagePicker.openCropper({
          path: imageUri,
          cropping: true,
          freeStyleCropEnabled: true,
          mediaType: 'photo',
        });
        const finalUri = cropped?.path || imageUri;
        const result = await analyze(finalUri);
        if (result) {
          const history = JSON.parse(await AsyncStorage.getItem('scanHistory') || '[]');
          history.unshift({
            ...result,
            imageUri: finalUri,
            thumbnail: finalUri,
            date: new Date().toISOString(),
          });
          await AsyncStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50)));
          navigation.navigate('Results', { result, imageUri: finalUri });
        }
      }
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Failed to capture:', error);
      }
    }
  }, [takePhoto, analyze, navigation]);

  const handlePickFromGallery = useCallback(async () => {
    try {
      const imageUri = await pickFromGallery();
      if (imageUri) {
        const cropped = await ImagePicker.openCropper({
          path: imageUri,
          freeStyleCropEnabled: true,
          mediaType: 'photo',
        });
        const finalUri = cropped?.path || imageUri;
        const result = await analyze(finalUri);
        if (result) {
          const history = JSON.parse(await AsyncStorage.getItem('scanHistory') || '[]');
          history.unshift({
            ...result,
            imageUri: finalUri,
            thumbnail: finalUri,
            date: new Date().toISOString(),
          });
          await AsyncStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50)));
          navigation.navigate('Results', { result, imageUri: finalUri });
        }
      }
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Failed to pick from gallery:', error);
      }
    }
  }, [pickFromGallery, analyze, navigation]);

  if (checking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>Проверка подключения...</Text>
      </View>
    );
  }

  if (isOffline) {
    return (
      <View style={styles.offlineContainer}>
        <Icon name="cloud-off" size={80} color="#bdc3c7" />
        <Text style={styles.offlineTitle}>Офлайн-режим</Text>
        <Text style={styles.offlineText}>
          Сканирование фото недоступно без интернета.
        </Text>
        <Text style={styles.offlineSubtext}>
          Вы можете воспользоваться справочником добавок.
        </Text>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => navigation.navigate('Search')}>
          <Icon name="search" size={22} color="#fff" />
          <Text style={styles.searchBtnText}>Открыть справочник</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>Запрос разрешения камеры...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Icon name="no-photography" size={64} color={COLORS.textSecondary} />
        <Text style={styles.statusText}>Нет доступа к камере</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Дать разрешение</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {device != null && (
        <Camera
          ref={cameraRef}
          device={device}
          style={StyleSheet.absoluteFill}
          isActive={true}
          photo={true}
          onInitialized={onCameraReady}
          onError={onCameraError}
        />
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      <ScanFrame />

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handlePickFromGallery}
          disabled={isLoading}>
          <Icon name="photo-library" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton,
            isLoading && styles.captureButtonDisabled,
          ]}
          onPress={handleTakePhoto}
          disabled={isLoading || !isCameraReady}
          activeOpacity={0.7}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <View style={styles.controlButton} />
      </View>

      <LoadingOverlay
        visible={isLoading}
        message="Анализ этикетки..."
        progress={50}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineContainer: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  offlineText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 4,
  },
  offlineSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 30,
  },
  searchBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    padding: 12,
  },
  backBtnText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});

export default ScanScreen;