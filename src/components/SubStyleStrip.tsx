/**
 * Horizontal strip of sub-style chips. The chips change based on the current mode.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n';
import { colors, fontSize, radius, space } from '../theme';
import type { DressSub, FullSub, Mode, PantsSub, ShirtSub, SubStyle } from '../logic/types';

const SUBS: Record<Mode, { id: SubStyle; key: string }[]> = {
  shirt: [
    { id: 'tshirt' as ShirtSub, key: 'sub_tshirt' },
    { id: 'long_sleeve' as ShirtSub, key: 'sub_long_sleeve' },
    { id: 'tank' as ShirtSub, key: 'sub_tank' },
    { id: 'vneck' as ShirtSub, key: 'sub_vneck' },
  ],
  pants: [
    { id: 'long' as PantsSub, key: 'sub_pants_long' },
    { id: 'shorts' as PantsSub, key: 'sub_pants_shorts' },
    { id: 'skirt' as PantsSub, key: 'sub_pants_skirt' },
  ],
  dress: [
    { id: 'knee' as DressSub, key: 'sub_dress_knee' },
    { id: 'long' as DressSub, key: 'sub_dress_long' },
    { id: 'mini' as DressSub, key: 'sub_dress_mini' },
  ],
  full: [
    { id: 'casual' as FullSub, key: 'sub_full_casual' },
    { id: 'summer' as FullSub, key: 'sub_full_summer' },
    { id: 'formal' as FullSub, key: 'sub_full_formal' },
  ],
};

export function SubStyleStrip() {
  const mode = useAppStore(s => s.mode);
  const sub = useAppStore(s => s.subStyles[mode]);
  const setSubStyle = useAppStore(s => s.setSubStyle);
  const t = useT();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {SUBS[mode].map(s => {
        const sel = s.id === sub;
        return (
          <Pressable
            key={s.id}
            onPress={() => setSubStyle(mode, s.id)}
            style={[styles.chip, sel && styles.chipSelected]}>
            <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
              {t(s.key as any)}
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
    paddingHorizontal: space.md, paddingVertical: space.xs,
  },
  chip: {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderColor: colors.purple,
  },
  chipText: { color: colors.textSecondary, fontSize: fontSize.small, fontWeight: '500' },
  chipTextSelected: { color: colors.textPrimary, fontWeight: '700' },
});
