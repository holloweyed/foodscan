// mobile/src/screens/OnboardingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../constants/api';
import { COLORS } from '../constants/colors';

const OnboardingScreen = ({ navigation }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const skipOffline = async () => {
    await AsyncStorage.setItem('offlineDataReady', 'false');
    navigation.replace('Main');
  };

  const downloadOfflineData = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setStatus('Нет интернета. Подключитесь к сети и попробуйте снова.');
      return;
    }

    setDownloading(true);
    setStatus('Скачивание базы данных...');
    setProgress(10);

    try {
      const res = await fetch(`${API_URL}/api/v1/additives/download/all`);
      const data = await res.json();

      if (res.ok) {
        setProgress(50);
        setStatus('Сохранение данных...');

        await AsyncStorage.setItem('additivesDatabase', JSON.stringify(data));
        await AsyncStorage.setItem('offlineDataReady', 'true');

        setProgress(100);
        setStatus('Готово! Офлайн-режим активирован.');

        setTimeout(() => {
          navigation.replace('Main');
        }, 1500);
      } else {
        setStatus('Ошибка загрузки. Попробуйте позже.');
      }
    } catch (e) {
      setStatus('Ошибка сети. Проверьте подключение.');
    }

    setDownloading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>FoodScan</Text>
      <Text style={styles.subtitle}>Анализатор пищевых добавок</Text>

      <View style={styles.featureList}>
        <Text style={styles.feature}>Сканируйте этикетки продуктов</Text>
        <Text style={styles.feature}>Узнавайте об опасности добавок</Text>
        <Text style={styles.feature}>Сохраняйте историю сканирований</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Офлайн-режим</Text>
        <Text style={styles.cardText}>
          Скачайте базу данных пищевых добавок, чтобы использовать приложение без интернета. Займёт около 2-5 МБ.
        </Text>
        <Text style={styles.cardHint}>
          Вы сможете скачать данные позже в настройках профиля.
        </Text>

        {downloading ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.progressText}>{progress}%</Text>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : (
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={downloadOfflineData}>
              <Text style={styles.downloadText}>Скачать (2-5 МБ)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={skipOffline}>
              <Text style={styles.skipText}>Пропустить</Text>
            </TouchableOpacity>
          </View>
        )}

        {status && !downloading && (
          <Text style={styles.statusText}>{status}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f6fa',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
  },
  featureList: {
    marginBottom: 32,
    textAlign: 'center'
  },
  feature: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
    paddingLeft: 16,
    
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 13,
    color: '#95a5a6',
    marginBottom: 20,
  },
  buttons: {
    gap: 12,
  },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  skipText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default OnboardingScreen;