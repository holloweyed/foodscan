// mobile/src/screens/SearchScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../constants/api';
import { COLORS, DARK_COLORS } from '../constants/colors';
import { useTheme } from '../theme/ThemeContext';

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 16 },
  offlineBanner: {
    backgroundColor: '#fdebd0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  offlineText: { color: '#e67e22', textAlign: 'center', fontSize: 13 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.textPrimary,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16, color: theme.textSecondary },
  list: { marginTop: 16 },
  card: {
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  code: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  name: { fontSize: 15, color: theme.textPrimary, marginBottom: 2 },
  category: { fontSize: 12, color: theme.textSecondary },
});

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const { isDark } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const searchOnline = async (q) => {
    const res = await fetch(
      `${API_URL}/api/v1/additives/search/?q=${encodeURIComponent(q)}&limit=20`
    );
    return await res.json();
  };

  const searchOffline = async (q) => {
    const db = JSON.parse(await AsyncStorage.getItem('additivesDatabase') || '[]');
    const qLower = q.toLowerCase();
    const byCode = db.filter(a => a.e_code.toLowerCase() === qLower);
    if (byCode.length > 0) return byCode;
    return db.filter(a => 
      a.name_ru && a.name_ru.toLowerCase().includes(qLower)
    ).slice(0, 20);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const netState = await NetInfo.fetch();
      let data;
      if (netState.isConnected) {
        data = await searchOnline(query);
        setIsOffline(false);
      } else {
        data = await searchOffline(query);
        setIsOffline(true);
      }
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      try {
        const data = await searchOffline(query);
        setResults(data);
        setIsOffline(true);
      } catch (e2) {
        setResults([]);
      }
    }
    setLoading(false);
  };

  const getDangerColor = (level) => {
    switch (level) {
      case 'Безопасен': return COLORS.success;
      case 'Умеренно опасен': return COLORS.warning;
      case 'Опасен': return COLORS.danger;
      case 'Запрещен': return COLORS.banned;
      default: return theme.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Поиск добавок</Text>
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Офлайн-режим — поиск по локальной базе</Text>
        </View>
      )}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="E-код или название добавки"
          placeholderTextColor="#bdc3c7"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Найти</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      )}

      {!loading && searched && results.length === 0 && (
        <Text style={styles.empty}>Ничего не найдено</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, index) => item.e_code + index}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Detail', { additive: item })}>
            <View style={styles.cardHeader}>
              <Text style={styles.code}>{item.e_code}</Text>
              <View style={[styles.badge, { backgroundColor: getDangerColor(item.danger_level) + '20' }]}>
                <Text style={[styles.badgeText, { color: getDangerColor(item.danger_level) }]}>
                  {item.danger_level || 'Неизвестно'}
                </Text>
              </View>
            </View>
            <Text style={styles.name}>{item.name_ru || 'Без названия'}</Text>
            <Text style={styles.category}>{item.category || ''}</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
      />
    </View>
  );
};

export default SearchScreen;