// mobile/src/hooks/useAnalysis.js
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../constants/api';

export const useAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const analyzeOnline = async (imageUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'label.jpg',
    });

    const res = await fetch(`${API_URL}/api/v1/analyze/label`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!res.ok) throw new Error('Server error');
    return await res.json();
  };

  const analyzeOffline = async (imageUri) => {
    // Простой поиск по названиям в локальной базе
    const db = JSON.parse(await AsyncStorage.getItem('additivesDatabase') || '[]');
    
    // Здесь должен быть локальный OCR, но пока возвращаем заглушку
    // В полной версии можно использовать VisionCamera text recognition
    
    return {
      request_id: 'offline',
      total_additives_found: 0,
      additives: [],
      safety_summary: {
        overall_safety: 'Офлайн-режим',
        safe_count: 0,
        moderate_count: 0,
        dangerous_count: 0,
        banned_count: 0,
        has_warnings: false,
      },
      message: 'Офлайн-анализ требует загрузки OCR моделей',
    };
  };

  const analyze = useCallback(async (imageUri) => {
    setIsLoading(true);
    setIsCompleted(false);
    setIsError(false);
    setError(null);

    try {
      const netState = await NetInfo.fetch();
      let result;

      if (netState.isConnected) {
        result = await analyzeOnline(imageUri);
      } else {
        result = await analyzeOffline(imageUri);
      }

      setIsCompleted(true);
      return result;
    } catch (e) {
      setIsError(true);
      setError(e.message);
      
      // Если сервер недоступен, пробуем офлайн
      try {
        const result = await analyzeOffline(imageUri);
        setIsCompleted(true);
        return result;
      } catch (e2) {
        throw new Error('Анализ не удался');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { analyze, isLoading, isCompleted, isError, error };
};