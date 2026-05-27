// mobile/src/screens/HomeScreen.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  selectIsAuthenticated,
  selectUser,
} from '../store/slices/userSlice';
import { fetchHistory, selectScanStats } from '../store/slices/historySlice';
import { fetchScanStats } from '../store/slices/historySlice';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const scanStats = useSelector(selectScanStats);
  
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchScanStats());
    }
  }, [isAuthenticated, dispatch]);
  
  const features = [
    {
      icon: 'camera-alt',
      title: 'Scan Label',
      description: 'Take a photo or upload an image of the product label',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('Scan'),
    },
    {
      icon: 'search',
      title: 'Browse Additives',
      description: 'Search and learn about food additives',
      color: COLORS.success,
      onPress: () => {},
    },
    {
      icon: 'history',
      title: 'Scan History',
      description: 'View your previous scans and results',
      color: COLORS.warning,
      onPress: () => navigation.navigate('History'),
    },
    {
      icon: 'info',
      title: 'About E-Codes',
      description: 'Learn about food additive classification',
      color: COLORS.accent,
      onPress: () => {},
    },
  ];
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>FoodScan</Text>
            <Text style={styles.subtitle}>
              Know what you eat
            </Text>
          </View>
          
          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.scanSection}>
        <View style={styles.scanCard}>
          <View style={styles.scanCardContent}>
            <Text style={styles.scanCardTitle}>
              Analyze product composition
            </Text>
            <Text style={styles.scanCardDescription}>
              Take a photo of the ingredient list to identify food additives and their safety levels
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scan')}
              activeOpacity={0.8}
            >
              <Icon name="camera-alt" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanCardIcon}>
            <Icon name="qr-code-scanner" size={80} color={COLORS.secondaryLight} />
          </View>
        </View>
      </View>
      
      {isAuthenticated && scanStats && (
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Your Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{scanStats.total_scans || 0}</Text>
              <Text style={styles.statsLabel}>Total Scans</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>
                {Math.round(scanStats.average_scan_time_ms / 1000) || 0}s
              </Text>
              <Text style={styles.statsLabel}>Avg. Time</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>
                {scanStats.popular_additives?.length || 0}
              </Text>
              <Text style={styles.statsLabel}>Top Additives</Text>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.featuresSection}>
        <Text style={styles.featuresSectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={feature.onPress}
              activeOpacity={0.7}
            >
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
          Food additives database is based on official regulations and scientific research.
          Always consult with a healthcare professional for dietary decisions.
        </Text>
      </View>
      
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.textLight,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  scanCardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
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
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 20,
    elevation: 2,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  featuresSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 30,
  },
});

export default HomeScreen;