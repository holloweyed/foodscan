// mobile/src/components/results/SafetyScore.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const SafetyScore = ({ stats }) => {
  if (!stats) return null;

  const getColor = () => {
    if (stats.banned > 0 || stats.dangerous > 0) return COLORS.danger;
    if (stats.moderate > 0) return COLORS.warning;
    return COLORS.success;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.overall, { color: getColor() }]}>
        {stats.overall || 'Unknown'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  overall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SafetyScore;