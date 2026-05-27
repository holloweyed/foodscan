// mobile/src/hooks/useCamera.js
import { useState, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import ImagePicker from 'react-native-image-crop-picker';

export const useCamera = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  
  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'FoodScan needs camera access to scan labels',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const permission = await Camera.requestCameraPermission();
        const granted = permission === 'authorized';
        setHasPermission(granted);
        return granted;
      }
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);
  
  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady) {
      throw new Error('Camera is not ready');
    }
    
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'auto',
        enableAutoStabilization: true,
      });
      
      return `file://${photo.path}`;
    } catch (error) {
      console.error('Failed to take photo:', error);
      throw new Error('Failed to take photo');
    }
  }, [isCameraReady]);
  
  const pickFromGallery = useCallback(async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 1200,
        height: 1600,
        cropping: true,
        compressImageQuality: 0.9,
        mediaType: 'photo',
        includeBase64: false,
      });
      
      return image.path;
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Failed to pick image:', error);
        throw new Error('Failed to pick image');
      }
      return null;
    }
  }, []);
  
  const onCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);
  
  const onCameraError = useCallback((error) => {
    console.error('Camera error:', error);
    setIsCameraReady(false);
    Alert.alert(
      'Camera Error',
      'Failed to initialize camera. Please restart the app.'
    );
  }, []);
  
  return {
    cameraRef,
    hasPermission,
    isCameraReady,
    requestPermission,
    takePhoto,
    pickFromGallery,
    onCameraReady,
    onCameraError,
  };
};