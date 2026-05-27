// mobile/src/screens/ScanScreen.js
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCamera } from '../hooks/useCamera';
import { useAnalysis } from '../hooks/useAnalysis';
import LoadingOverlay from '../components/common/LoadingOverlay';
import ScanFrame from '../components/scanner/ScanFrame';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ScanScreen = ({ navigation }) => {
  const {
    cameraRef,
    hasPermission,
    isCameraReady,
    requestPermission,
    takePhoto,
    pickFromGallery,
    onCameraReady,
    onCameraError,
  } = useCamera();

  const {
    analyze,
    isLoading,
    isCompleted,
    isError,
    error,
  } = useAnalysis();

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (isCompleted) {
      const unsubscribe = navigation.addListener('focus', () => {
        StatusBar.setBarStyle('light-content');
      });
      return unsubscribe;
    }
  }, [isCompleted, navigation]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const imageUri = await takePhoto();
      
      if (imageUri) {
        const result = await analyze(imageUri);
        
        if (result) {
          navigation.navigate('Results', {
            result,
            imageUri,
          });
        }
      }
    } catch (error) {
      console.error('Failed to capture or analyze:', error);
    }
  }, [takePhoto, analyze, navigation]);

  const handlePickFromGallery = useCallback(async () => {
    try {
      const imageUri = await pickFromGallery();
      
      if (imageUri) {
        const result = await analyze(imageUri);
        
        if (result) {
          navigation.navigate('Results', {
            result,
            imageUri,
          });
        }
      }
    } catch (error) {
      console.error('Failed to pick or analyze:', error);
    }
  }, [pickFromGallery, analyze, navigation]);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Icon name="no-photography" size={64} color={COLORS.textSecondary} />
        <Text style={styles.statusText}>Camera permission denied</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        isActive={true}
        photo={true}
        onInitialized={onCameraReady}
        onError={onCameraError}
      />
      
      <ScanFrame />
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handlePickFromGallery}
          disabled={isLoading}
        >
          <Icon name="photo-library" size={28} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.captureButton,
            isLoading && styles.captureButtonDisabled,
          ]}
          onPress={handleTakePhoto}
          disabled={isLoading || !isCameraReady}
          activeOpacity={0.7}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        
        <View style={styles.controlButton} />
      </View>
      
      <LoadingOverlay
        visible={isLoading}
        message="Analyzing label..."
        progress={50}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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