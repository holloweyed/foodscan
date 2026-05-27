// mobile/src/hooks/useCamera.js
import { useState, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import ImagePicker from 'react-native-image-crop-picker';

export const useCamera = () => {
  const devices = useCameraDevices();
  const device = Object.values(devices)[0];
  const [hasPermission, setHasPermission] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(true);
  const cameraRef = useRef(null);
  
  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'FoodScan needs camera access',
          buttonPositive: 'OK',
        }
      );
      const allowed = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(allowed);
      return allowed;
    }
    return false;
  }, []);
  
  const takePhoto = useCallback(async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'quality',
        });
        return `file://${photo.path}`;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, []);
  
  const pickFromGallery = useCallback(async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
      });
      return image.path;
    } catch (error) {
      return null;
    }
  }, []);
  
  const onCameraReady = useCallback(() => setIsCameraReady(true), []);
  const onCameraError = useCallback(() => setIsCameraReady(false), []);
  
  return {
    device,
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