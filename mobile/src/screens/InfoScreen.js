// mobile/src/screens/InfoScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS, DARK_COLORS } from '../constants/colors';
import { useTheme } from '../theme/ThemeContext';

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, backgroundColor: theme.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 12 },
  text: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 12, marginTop: 8 },
  categoryCard: {
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  categoryRange: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
  categoryName: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  categoryDesc: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dangerDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  dangerInfo: { flex: 1 },
  dangerLevel: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  dangerDesc: { fontSize: 13, color: theme.textSecondary },
  detailsButton: {
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  detailsButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  footerText: { fontSize: 12, color: theme.textLight, textAlign: 'center', marginBottom: 24 },
  modalContainer: { flex: 1, backgroundColor: theme.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary },
  modalClose: { fontSize: 16, color: COLORS.secondary, fontWeight: '600' },
  modalScroll: { flex: 1, padding: 16 },
  modalText: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 20 },
  sourceCard: {
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  sourceTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  sourceText: { fontSize: 13, color: theme.textSecondary, lineHeight: 19 },
});

const InfoScreen = () => {
  const [showDetails, setShowDetails] = useState(false);
  const { isDark } = useTheme();
  const theme = isDark ? DARK_COLORS : COLORS;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const categories = [
    { range: 'E100-E199', name: 'Красители', description: 'Придают или восстанавливают цвет продукта' },
    { range: 'E200-E299', name: 'Консерванты', description: 'Увеличивают срок хранения продуктов' },
    { range: 'E300-E399', name: 'Антиокислители', description: 'Защищают от окисления и прогоркания' },
    { range: 'E400-E499', name: 'Стабилизаторы, загустители', description: 'Сохраняют консистенцию продукта' },
    { range: 'E500-E599', name: 'Регуляторы кислотности', description: 'Регулируют pH и улучшают текстуру' },
    { range: 'E600-E699', name: 'Усилители вкуса', description: 'Усиливают вкус и аромат продукта' },
    { range: 'E900-E999', name: 'Подсластители, глазирователи', description: 'Улучшают внешний вид и вкус' },
    { range: 'E1000-E1599', name: 'Прочие добавки', description: 'Ферменты, газы для упаковки и др.' },
  ];

  const dangerLevels = [
    { level: 'Безопасен', color: COLORS.success, desc: 'Разрешены без ограничений' },
    { level: 'Умеренно опасен', color: COLORS.warning, desc: 'Рекомендуется ограничить потребление' },
    { level: 'Опасен', color: COLORS.danger, desc: 'Имеют доказанное негативное влияние' },
    { level: 'Запрещен', color: COLORS.banned, desc: 'Запрещены к использованию в РФ' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Что такое E-коды?</Text>
        <Text style={styles.text}>
          E-коды — это система обозначения пищевых добавок, принятая в Европейском союзе.
          Буква "E" означает "Europe", а число указывает на функциональную группу добавки.
        </Text>

        <Text style={styles.sectionTitle}>Категории добавок</Text>
        {categories.map((cat, i) => (
          <View key={i} style={styles.categoryCard}>
            <Text style={styles.categoryRange}>{cat.range}</Text>
            <Text style={styles.categoryName}>{cat.name}</Text>
            <Text style={styles.categoryDesc}>{cat.description}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Уровни опасности</Text>
        {dangerLevels.map((d, i) => (
          <View key={i} style={styles.dangerRow}>
            <View style={[styles.dangerDot, { backgroundColor: d.color }]} />
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerLevel}>{d.level}</Text>
              <Text style={styles.dangerDesc}>{d.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setShowDetails(true)}>
          <Text style={styles.detailsButtonText}>Подробнее о классификации по уровням опасности</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Данные основаны на официальных нормативах РФ и международных исследованиях.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showDetails} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Классификация по уровням опасности</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Text style={styles.modalClose}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalText}>
              Классификация пищевых добавок по степени опасности для здоровья в рамках данного проекта
              была разработана на основе анализа авторитетных международных и российских источников.
            </Text>

            <View style={styles.sourceCard}>
              <Text style={styles.sourceTitle}>Нормативно-правовая база РФ и Таможенного союза</Text>
              <Text style={styles.sourceText}>
                За основу взят действующий Технический регламент ТР ТС 029/2012, который устанавливает
                перечень добавок, разрешённых к применению. Добавки, не включённые в данный регламент
                или прямо запрещённые им, отнесены к категории «Запрещённые».
              </Text>
            </View>

            <View style={styles.sourceCard}>
              <Text style={styles.sourceTitle}>Заключения международных организаций</Text>
              <Text style={styles.sourceText}>
                Для оценки потенциального риска использованы выводы Объединённого экспертного комитета
                ФАО/ВОЗ по пищевым добавкам (JECFA) и Европейского агентства по безопасности продуктов
                питания (EFSA). Добавки с установленной допустимой суточной дозой и отсутствием
                доказанных негативных эффектов классифицированы как «Безопасные».
              </Text>
            </View>

            <View style={styles.sourceCard}>
              <Text style={styles.sourceTitle}>Критерии отнесения к «Опасным»</Text>
              <Text style={styles.sourceText}>
                К опасным отнесены добавки, для которых EFSA или JECFA существенно снизили ранее
                установленную Допустимую Суточную Дозу или рекомендовали исключить их из использования
                в связи с новыми данными о потенциальной опасности.
              </Text>
            </View>

            <View style={styles.sourceCard}>
              <Text style={styles.sourceTitle}>Критерии отнесения к «Умеренно опасным»</Text>
              <Text style={styles.sourceText}>
                К умеренно опасным отнесены добавки с низкой допустимой суточной дозой (менее
                5 мг/кг массы тела в день) или имеющие ограничения по применению в определённых
                группах продуктов, например, в детском питании.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default InfoScreen;