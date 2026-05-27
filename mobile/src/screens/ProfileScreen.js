// mobile/src/screens/ProfileScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { COLORS, DARK_COLORS } from '../constants/colors';

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.textPrimary },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  username: { fontSize: 22, fontWeight: 'bold', color: theme.textPrimary },
  email: { fontSize: 14, color: theme.textSecondary, marginTop: 4, marginBottom: 24 },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  info: { fontSize: 14, color: theme.textSecondary, marginBottom: 4 },
  logoutButton: {
    backgroundColor: theme.dangerBackground,
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutText: { color: theme.danger, fontSize: 16, fontWeight: '600' },
  deleteButton: {
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.danger,
  },
  deleteText: { color: theme.danger, fontSize: 16, fontWeight: '600' },
  downloadButton: {
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    marginBottom: 8,
  },
  downloadText: { color: COLORS.secondary, fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: theme.textPrimary },
  modalText: { fontSize: 14, color: theme.textSecondary, marginBottom: 16 },
  modalInput: {
    backgroundColor: theme.background,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.textPrimary,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: theme.border,
  },
  modalCancelText: { color: theme.textPrimary, fontWeight: '600' },
  modalDeleteBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: theme.danger,
  },
  modalDeleteText: { color: '#fff', fontWeight: '600' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
    marginTop: 8,
    backgroundColor: theme.surface,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: theme.textPrimary,
  },
});

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const handleDownloadOffline = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/additives/download/all`);
      const data = await res.json();
      await AsyncStorage.setItem('additivesDatabase', JSON.stringify(data));
      await AsyncStorage.setItem('offlineDataReady', 'true');
      Alert.alert('Готово', 'Офлайн-данные загружены');
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    }
    setDownloading(false);
  };

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const handleLogout = async () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        onPress: async () => {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('user');
          setUser(null);
          navigation.navigate('HomeTab');
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Ошибка', 'Введите пароль для подтверждения');
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/v1/auth/delete?username=${encodeURIComponent(user.username)}&password=${encodeURIComponent(deletePassword)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('scanHistory');
        setUser(null);
        setShowDeleteModal(false);
        Alert.alert('Аккаунт удалён', 'Все ваши данные удалены');
        navigation.navigate('HomeTab');
      } else {
        Alert.alert('Ошибка', data.detail || 'Неверный пароль');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Нет связи с сервером');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Профиль</Text>
        <Text style={styles.info}>Вы не вошли в аккаунт</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.buttonText}>Войти</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.username?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownloadOffline}
        disabled={downloading}>
        <Text style={styles.downloadText}>
          {downloading ? 'Загрузка...' : 'Скачать офлайн-данные'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => setShowDeleteModal(true)}>
        <Text style={styles.deleteText}>Удалить аккаунт</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
        <View style={styles.settingLeft}>
          <Icon name={isDark ? 'wb-sunny' : 'nights-stay'} size={22} color={theme.textPrimary} />
          <Text style={styles.settingText}>
            {isDark ? 'Светлая тема' : 'Тёмная тема'}
          </Text>
        </View>
        <Icon name="chevron-right" size={22} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Удаление аккаунта</Text>
            <Text style={styles.modalText}>
              Это действие нельзя отменить. Все ваши данные будут удалены.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Введите пароль для подтверждения"
              placeholderTextColor="#bdc3c7"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}>
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleDeleteAccount}>
                <Text style={styles.modalDeleteText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;