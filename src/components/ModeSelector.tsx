/**
 * Vertical pill column with the 4 garment modes (Shirt / Pants / Dress / Full).
 * Matches the layout from reference Image 2.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n';
import { colors, radius, fontSize, space } from '../theme';
import type { Mode } from '../logic/types';

const ICONS: Record<Mode, React.FC<{ size: number }>> = {
  shirt: ({ size }) => (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="white" strokeWidth={1.7}>
      <Path d="M16 4l-4 2-4-2-4 3v4l3 1v8h10v-8l3-1v-4z" />
    </Svg>
  ),
  pants: ({ size }) => (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="white" strokeWidth={1.7}>
      <Path d="M6 4h12l1 16h-4l-2-10h-2l-2 10H5z" />
    </Svg>
  ),
  dress: ({ size }) => (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="white" strokeWidth={1.7}>
      <Path d="M9 3h6l2 4-2 2 3 13H6l3-13-2-2z" />
    </Svg>
  ),
  full: ({ size }) => (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="white" strokeWidth={1.7}>
      <Path d="M16 4l-4 2-4-2-4 3v4l3 1v3h10v-3l3-1v-4z" />
      <Path d="M7 15h10l1 6h-3l-1-3h-4l-1 3H6z" />
    </Svg>
  ),
};

const MODES: Mode[] = ['shirt', 'pants', 'dress', 'full'];

export function ModeSelector() {
  const mode = useAppStore(s => s.mode);
  const setMode = useAppStore(s => s.setMode);
  const t = useT();

  return (
    <View style={styles.container}>
      {MODES.map(m => {
        const Icon = ICONS[m];
        const selected = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            accessibilityRole="button"
            accessibilityLabel={t(`mode_${m}` as 'mode_shirt' | 'mode_pants' | 'mode_dress' | 'mode_full')}
            style={({ pressed }) => [
              styles.btn,
              selected && styles.btnSelected,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <Icon size={24} />
            <Text style={styles.label}>
              {t(`mode_${m}` as 'mode_shirt' | 'mode_pants' | 'mode_dress' | 'mode_full')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: radius.lg,
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    width: 58,
    minHeight: 58,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  btnSelected: {
    backgroundColor: colors.purple,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
});
