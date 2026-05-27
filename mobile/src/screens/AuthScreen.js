// mobile/src/screens/AuthScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { COLORS, DARK_COLORS } from '../constants/colors';
import { API_URL } from '../constants/api';

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchText: {
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

const AuthScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const { isDark } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme), [theme]);
  

  const validate = () => {
    if (!username || !password || (!isLogin && !email)) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return false;
    }
    if (!isLogin) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Ошибка', 'Введите корректный email');
        return false;
      }
      if (username.length < 3) {
        Alert.alert('Ошибка', 'Логин должен быть не менее 3 символов');
        return false;
      }
    }
    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const params = isLogin
        ? `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        : `email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

      const res = await fetch(`${API_URL}${endpoint}?${params}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem('accessToken', data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Успех', isLogin ? 'Вы вошли в аккаунт' : 'Регистрация успешна', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Ошибка', data.detail || 'Что-то пошло не так');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Нет связи с сервером');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isLogin ? 'Вход в аккаунт' : 'Регистрация'}</Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? 'Войдите, чтобы сохранять историю сканирований'
            : 'Создайте аккаунт для сохранения истории'}
        </Text>

        {!isLogin && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              placeholderTextColor={theme.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Логин</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите логин"
            placeholderTextColor={theme.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите пароль (минимум 6 символов)"
            placeholderTextColor={theme.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => {
            console.log('Button pressed');
            handleSubmit();
          }}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;