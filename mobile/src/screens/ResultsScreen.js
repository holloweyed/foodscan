// mobile/src/screens/ResultsScreen.js
import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdditiveCard from '../components/results/AdditiveCard';
import SafetyScore from '../components/results/SafetyScore';
import { selectCurrentAnalysis } from '../store/slices/analysisSlice';
import { COLORS, DANGER_COLORS, DARK_COLORS } from '../constants/colors';
import { useTheme } from '../theme/ThemeContext';

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginTop: 16,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  safetyOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.overlay,
    padding: 16,
  },
  safetyContainer: {
    backgroundColor: theme.overlay,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statItem: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.surface,
    marginTop: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanAgainButton: {
    backgroundColor: theme.primary,
  },
  historyButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
});

const ResultsScreen = ({ route, navigation }) => {
  const { result, imageUri } = route.params || {};
  const analysis = result || useSelector(selectCurrentAnalysis);
  const { isDark } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const sortedAdditives = useMemo(() => {
    if (!analysis?.additives) return [];
    const dangerOrder = {
      'blocked': 0,
      'dangerous': 1,
      'moderate': 2,
      'safe': 3,
    };
    return [...analysis.additives].sort((a, b) => {
      const levelA = dangerOrder[a.risk_icon] ?? 99;
      const levelB = dangerOrder[b.risk_icon] ?? 99;
      return levelA - levelB;
    });
  }, [analysis?.additives]);

  const safetyStats = useMemo(() => {
    if (!analysis?.safety_summary) return null;
    const summary = analysis.safety_summary;
    return {
      total: (summary.safe_count || 0) + (summary.moderate_count || 0) +
             (summary.dangerous_count || 0) + (summary.banned_count || 0),
      safe: summary.safe_count || 0,
      moderate: summary.moderate_count || 0,
      dangerous: summary.dangerous_count || 0,
      banned: summary.banned_count || 0,
      overall: summary.overall_safety || 'Unknown',
      hasWarnings: summary.has_warnings || false,
    };
  }, [analysis?.safety_summary]);

  const handleShare = useCallback(async () => {
    try {
      const additivesList = sortedAdditives
        .map((a, i) => `${i + 1}. ${a.e_code} - ${a.name_ru} (${a.danger_level})`)
        .join('\n');
      const message = `FoodScan Analysis Results\n\nFound ${analysis.total_additives_found} additives:\n${additivesList}\n\nOverall: ${safetyStats?.overall}`;
      await Share.share({ message, title: 'FoodScan Analysis' });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [sortedAdditives, analysis, safetyStats]);

  if (!analysis) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="search-off" size={64} color={theme.textSecondary} />
        <Text style={styles.emptyText}>Нет результатов анализа</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {safetyStats && (
            <View style={styles.safetyOverlay}>
              <SafetyScore stats={safetyStats} />
            </View>
          )}
        </View>
      )}

      {!imageUri && safetyStats && (
        <View style={styles.safetyContainer}>
          <SafetyScore stats={safetyStats} />
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: DANGER_COLORS.safe.background }]}>
          <Text style={[styles.statNumber, { color: DANGER_COLORS.safe.text }]}>
            {safetyStats?.safe || 0}
          </Text>
          <Text style={styles.statLabel}>Безопасных</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: DANGER_COLORS.moderate.background }]}>
          <Text style={[styles.statNumber, { color: DANGER_COLORS.moderate.text }]}>
            {safetyStats?.moderate || 0}
          </Text>
          <Text style={styles.statLabel}>Умеренных</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: DANGER_COLORS.dangerous.background }]}>
          <Text style={[styles.statNumber, { color: DANGER_COLORS.dangerous.text }]}>
            {safetyStats?.dangerous || 0}
          </Text>
          <Text style={styles.statLabel}>Опасных</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: DANGER_COLORS.banned.background }]}>
          <Text style={[styles.statNumber, { color: DANGER_COLORS.banned.text }]}>
            {safetyStats?.banned || 0}
          </Text>
          <Text style={styles.statLabel}>Запрещённых</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Найдено добавок: {analysis.total_additives_found}
          </Text>
          <TouchableOpacity onPress={handleShare}>
            <Icon name="share" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        {sortedAdditives.map((additive, index) => (
          <AdditiveCard
            key={`${additive.e_code}_${index}`}
            additive={additive}
            index={index}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.scanAgainButton]}
          onPress={() => navigation.navigate('Scan')}>
          <Icon name="camera-alt" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Новое сканирование</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.historyButton]}
          onPress={() => navigation.navigate('History')}>
          <Icon name="history" size={22} color={theme.primary} />
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>
            История
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

export default ResultsScreen;