// mobile/src/screens/HistoryScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, DARK_COLORS } from '../constants/colors';
import { useTheme } from '../theme/ThemeContext';

const getStyles = (theme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background, 
    padding: 16 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: theme.textPrimary 
  },
  clearAll: {
    fontSize: 14, 
    color: theme.danger, 
    fontWeight: '600' 
  },
  empty: { 
    fontSize: 16, 
    color: theme.textSecondary, 
    textAlign: 'center', 
    marginTop: 40 
  },
  item: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: theme.border,
  },
  noImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: { 
    fontSize: 10, 
    color: theme.textLight 
  },
  itemInfo: { 
    flex: 1 
  },
  itemText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: theme.textPrimary 
  },
  itemDate: { 
    fontSize: 12, 
    color: theme.textSecondary, 
    marginTop: 4 
  },
    deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.dangerBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteBtnText: { 
    fontSize: 14, 
    color: theme.danger, 
    fontWeight: 'bold' 
  },
});

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const { isDark } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = JSON.parse(await AsyncStorage.getItem('scanHistory') || '[]');
    setHistory(data);
  };

  const deleteItem = async (index) => {
    Alert.alert(
      'Удалить запись',
      'Вы уверены, что хотите удалить эту запись из истории?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const updated = history.filter((_, i) => i !== index);
            await AsyncStorage.setItem('scanHistory', JSON.stringify(updated));
            setHistory(updated);
          },
        },
      ]
    );
  };

  const clearAll = async () => {
    Alert.alert(
      'Очистить историю',
      'Удалить все записи? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить всё',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('scanHistory');
            setHistory([]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>История сканирований</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearAll}>Очистить всё</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <Text style={styles.empty}>Нет сохранённых сканов</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('Results', {
                  result: item,
                  imageUri: item.imageUri,
                })
              }
              onLongPress={() => deleteItem(index)}>
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
              ) : (
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>Нет фото</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemText}>
                  Найдено добавок: {item.total_additives_found || 0}
                </Text>
                <Text style={styles.itemDate}>
                  {new Date(item.date).toLocaleString('ru')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteItem(index)}>
                <Text style={styles.deleteBtnText}>X</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default HistoryScreen;