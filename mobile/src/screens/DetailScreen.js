// mobile/src/screens/DetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';

const DetailScreen = ({ route }) => {
  const { additive } = route.params || {};

  if (!additive) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Нет данных о добавке</Text>
      </View>
    );
  }

  const getDangerColor = (level) => {
    switch (level) {
      case 'Безопасен': return COLORS.success;
      case 'Умеренно опасен': return COLORS.warning;
      case 'Опасен': return COLORS.danger;
      case 'Запрещен': return COLORS.banned;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.code}>{additive.e_code}</Text>
        <View style={[styles.badge, { backgroundColor: getDangerColor(additive.danger_level) + '20' }]}>
          <Text style={[styles.badgeText, { color: getDangerColor(additive.danger_level) }]}>
            {additive.danger_level || 'Неизвестно'}
          </Text>
        </View>
      </View>

      <Text style={styles.name}>{additive.name_ru || 'Без названия'}</Text>
      <Text style={styles.category}>{additive.category || 'Категория не указана'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Описание</Text>
        <Text style={styles.description}>
          {additive.description || 'Описание отсутствует'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Рекомендация</Text>
        <Text style={[styles.recommendation, { color: getDangerColor(additive.danger_level) }]}>
          {additive.recommendation || 'Нет рекомендации'}
        </Text>
      </View>

      {additive.allowed_in_rus === false && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Запрещена в Российской Федерации</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 16 },
  error: { fontSize: 18, color: '#e74c3c', textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  code: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginRight: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 14, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  category: { fontSize: 14, color: '#7f8c8d', marginBottom: 20 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  description: { fontSize: 15, color: '#34495e', lineHeight: 22 },
  recommendation: { fontSize: 18, fontWeight: '600' },
  warning: { backgroundColor: '#fadbd8', padding: 14, borderRadius: 10, marginTop: 8 },
  warningText: { color: '#e74c3c', fontWeight: '600', textAlign: 'center' },
});

export default DetailScreen;