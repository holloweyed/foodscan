// mobile/src/components/results/AdditiveCard.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { COLORS, DARK_COLORS, DANGER_COLORS } from '../../constants/colors';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    fontSize: 15,
    color: theme.textPrimary,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationContainer: {
    backgroundColor: theme.surfaceSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DANGER_COLORS.banned.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
    marginLeft: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: isDark ? '#1a3a5c' : '#ebf5fb',
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginRight: 4,
  },
});

const AdditiveCard = ({ additive, index }) => {
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const dangerConfig = {
    'safe': DANGER_COLORS.safe,
    'moderate': DANGER_COLORS.moderate,
    'dangerous': DANGER_COLORS.dangerous,
    'banned': DANGER_COLORS.banned,
  };

  const getDangerKey = (level) => {
    switch (level) {
      case 'safe': return 'safe';
      case 'warning': return 'moderate';
      case 'danger': return 'dangerous';
      case 'blocked': return 'banned';
      default: return 'safe';
    }
  };

  const dangerKey = getDangerKey(additive.risk_icon);
  const config = dangerConfig[dangerKey] || DANGER_COLORS.safe;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const getRecommendationColor = (recommendation) => {
    if (!recommendation) return theme.textSecondary;
    if (recommendation.includes('без ограничений') || recommendation.includes('safely')) return COLORS.success;
    if (recommendation.includes('ограничить') || recommendation.includes('limit')) return COLORS.warning;
    if (recommendation.includes('избегать') || recommendation.includes('avoid')) return COLORS.danger;
    if (recommendation.includes('запрещено') || recommendation.includes('banned')) return COLORS.banned;
    return theme.textSecondary;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: config.border }]}
      onPress={toggleExpand}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.background }]}>
          <Icon name={config.icon} size={28} color={config.text} />
        </View>
        <View style={styles.info}>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{additive.e_code}</Text>
            <View style={[styles.badge, { backgroundColor: config.background }]}>
              <Text style={[styles.badgeText, { color: config.text }]}>
                {additive.danger_level}
              </Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>{additive.name_ru}</Text>
          <Text style={styles.category}>{additive.category}</Text>
        </View>
        <Icon
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color={theme.textSecondary}
        />
      </View>
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <Text style={styles.description}>
            {additive.description || 'Нет описания'}
          </Text>
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationLabel}>Рекомендация:</Text>
            <Text style={[styles.recommendationText, { color: getRecommendationColor(additive.recommendation) }]}>
              {additive.recommendation || 'Нет рекомендации'}
            </Text>
          </View>
          {additive.allowed_in_rus === false && (
            <View style={styles.warningBanner}>
              <Icon name="block" size={18} color={COLORS.danger} />
              <Text style={styles.warningText}>Запрещена в РФ</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate('Detail', { additive: additive })}>
            <Text style={styles.detailsButtonText}>
              Подробнее о {additive.e_code}
            </Text>
            <Icon name="open-in-new" size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default AdditiveCard;