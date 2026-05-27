//mobile/src/components/scanner/ScanFrame.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_WIDTH = SCREEN_WIDTH * 0.8;
const FRAME_HEIGHT = FRAME_WIDTH * 0.6;

const ScanFrame = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.overlayTop}>
        <Text style={styles.title}>FoodScan</Text>
      </View>
      
      <View style={styles.middleRow}>
        <View style={styles.overlaySide} />
        
        <View style={styles.frame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
          
          <Text style={styles.hint}>
            Поместите этикетку в рамку
          </Text>
        </View>
        
        <View style={styles.overlaySide} />
      </View>
      
      <View style={styles.overlayBottom} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: COLORS.overlayLight,
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_HEIGHT,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: COLORS.overlayLight,
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.secondary,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.secondary,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.secondary,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.secondary,
    borderBottomRightRadius: 8,
  },
});

export default ScanFrame;