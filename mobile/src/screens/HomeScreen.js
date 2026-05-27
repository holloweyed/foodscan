// mobile/src/screens/HomeScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, DARK_COLORS } from '../constants/colors';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.primary,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textLight,
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scanSection: {
    marginTop: -20,
    paddingHorizontal: 16,
  },
  scanCard: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scanCardContent: {
    flex: 1,
    marginRight: 16,
  },
  scanCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  scanCardDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanCardIcon: {
    opacity: 0.7,
  },
  featuresSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: theme.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 30,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const HomeScreen = ({ navigation }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const { isDark } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { toggleTheme } = useTheme();

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    const userData = await AsyncStorage.getItem('user');
    setIsAuthenticated(!!token);
    if (userData) setUser(JSON.parse(userData));
    const history = JSON.parse(await AsyncStorage.getItem('scanHistory') || '[]');
    setScanCount(history.length);
  };

  const features = [
    {
      icon: 'camera-alt',
      title: 'Сканировать',
      description: 'Сфотографируйте этикетку продукта для анализа',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('Scan'),
    },
    {
      icon: 'search',
      title: 'Поиск добавок',
      description: 'Узнайте о пищевых добавках',
      color: COLORS.success,
      onPress: () => navigation.navigate('Search'),
    },
    {
      icon: 'history',
      title: 'История',
      description: 'Просмотр предыдущих сканирований',
      color: COLORS.warning,
      onPress: () => navigation.navigate('History'),
    },
    {
      icon: 'info',
      title: 'О E-кодах',
      description: 'Классификация пищевых добавок',
      color: COLORS.accent,
      onPress: () => navigation.navigate('Info'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>FoodScan</Text>
            <Text style={styles.subtitle}>Знай, что ты ешь</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
              <Icon 
                name={isDark ? 'wb-sunny' : 'nights-stay'} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>

            {isAuthenticated ? (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => navigation.navigate('Profile')}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Auth')}>
                <Text style={styles.loginButtonText}>Войти</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.scanSection}>
        <View style={styles.scanCard}>
          <View style={styles.scanCardContent}>
            <Text style={styles.scanCardTitle}>Анализ состава продукта</Text>
            <Text style={styles.scanCardDescription}>
              Сделайте фото списка ингредиентов, чтобы определить пищевые добавки и их безопасность
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scan')}
              activeOpacity={0.8}>
              <Icon name="camera-alt" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Начать сканирование</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scanCardIcon}>
            <Icon name="qr-code-scanner" size={80} color={COLORS.secondaryLight} />
          </View>
        </View>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresSectionTitle}>Возможности</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={feature.onPress}
              activeOpacity={0.7}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Icon name={feature.icon} size={28} color={feature.color} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription} numberOfLines={2}>
                {feature.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          База данных пищевых добавок основана на официальных нормативах и научных исследованиях.
          Всегда консультируйтесь со специалистом по вопросам питания.
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

export default HomeScreen;