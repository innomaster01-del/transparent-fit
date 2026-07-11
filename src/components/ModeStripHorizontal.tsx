import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n';
import { colors, fontSize, radius, space } from '../theme';
import type { Mode } from '../logic/types';

const ICONS: Record<Mode, JSX.Element> = {
  shirt: <Path d="M16 4l-4 2-4-2-4 3v4l3 1v8h10v-8l3-1v-4z" />,
  pants: <Path d="M6 4h12l1 16h-4l-2-10h-2l-2 10H5z" />,
  dress: <Path d="M9 3h6l2 4-2 2 3 13H6l3-13-2-2z" />,
  full:  <Path d="M16 4l-4 2-4-2-4 3v4l3 1v3h10v-3l3-1v-4zM7 15h10l1 6h-3l-1-3h-4l-1 3H6z" />,
};

const MODES: Mode[] = ['shirt', 'pants', 'dress', 'full'];

export function ModeStripHorizontal() {
  const mode = useAppStore(s => s.mode);
  const setMode = useAppStore(s => s.setMode);
  const t = useT();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {MODES.map(m => {
        const sel = m === mode;
        return (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[styles.chip, sel && styles.chipSelected]}
            accessibilityRole="button">
            <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="white" strokeWidth={1.7}>
              {ICONS[m]}
            </Svg>
            <Text style={styles.chipText}>
              {t(`mode_${m}` as 'mode_shirt' | 'mode_pants' | 'mode_dress' | 'mode_full')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md, paddingVertical: space.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.purple, borderColor: 'transparent' },
  chipText: { color: colors.textPrimary, fontSize: fontSize.small, fontWeight: '600' },
});
