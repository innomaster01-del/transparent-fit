/**
 * Settings screen — outline thickness, color, glow, language, haptics,
 * reset calibration, delete stored photos, about.
 */

import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n';
import { colors, fontSize, radius, space } from '../theme';
import type { NavProps } from '../navigation/types';

const APP_VERSION = '1.0.0';

export function SettingsScreen({ nav }: NavProps) {
  const t = useT();
  const {
    outlineThickness, setOutlineThickness,
    outlineColor, setOutlineColor,
    showGlow, setShowGlow,
    hapticsEnabled, setHaptics,
    language, setLanguage,
    clearPhoto,
  } = useAppStore();

  const onResetCalibration = () => {
    clearPhoto();
    Alert.alert(t('settings_reset_calibration'), t('reset_done'));
  };

  const onDeletePhotos = async () => {
    Alert.alert(
      t('settings_delete_photos'),
      t('settings_delete_photos'),
      [
        { text: t('btn_back'), style: 'cancel' },
        {
          text: t('settings_delete_photos'),
          style: 'destructive',
          onPress: async () => {
            try {
              clearPhoto();
              await AsyncStorage.clear();
              Alert.alert(t('settings_delete_photos'), t('photos_deleted'));
            } catch (e: any) {
              Alert.alert(t('settings_delete_photos'), e?.message ?? 'Failed');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.pop()} hitSlop={12} style={styles.backBtn} accessibilityLabel={t('btn_back')}>
          <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="white" strokeWidth={2.5}>
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{t('settings_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title={t('settings_outline_thickness')}>
          <Choice
            options={[
              { id: 'thin' as const, label: t('settings_thin') },
              { id: 'medium' as const, label: t('settings_medium') },
              { id: 'thick' as const, label: t('settings_thick') },
            ]}
            value={outlineThickness}
            onChange={setOutlineThickness}
          />
        </Section>

        <Section title={t('settings_outline_color')}>
          <View style={styles.swatches}>
            {[
              { id: 'rgba(255, 255, 255, 0.95)', color: '#fff' },
              { id: 'rgba(0, 0, 0, 0.9)', color: '#000' },
              { id: 'rgba(124, 58, 237, 0.95)', color: colors.purple },
            ].map(s => (
              <Pressable
                key={s.id}
                onPress={() => setOutlineColor(s.id)}
                style={[
                  styles.swatch,
                  { backgroundColor: s.color },
                  outlineColor === s.id && styles.swatchSelected,
                ]}
              />
            ))}
          </View>
        </Section>

        <Section title={t('settings_glow')}>
          <Switch value={showGlow} onValueChange={setShowGlow} />
        </Section>

        <Section title={t('settings_language')}>
          <Choice
            options={[
              { id: 'he' as const, label: 'עברית' },
              { id: 'en' as const, label: 'English' },
            ]}
            value={language}
            onChange={setLanguage}
          />
        </Section>

        <Section title={t('settings_haptics')}>
          <Switch value={hapticsEnabled} onValueChange={setHaptics} />
        </Section>

        <Pressable onPress={onResetCalibration} style={styles.actionBtn}>
          <Text style={styles.actionText}>{t('settings_reset_calibration')}</Text>
        </Pressable>

        <Pressable onPress={onDeletePhotos} style={styles.dangerBtn}>
          <Text style={styles.dangerText}>{t('settings_delete_photos')}</Text>
        </Pressable>

        <View style={styles.aboutBox}>
          <Text style={styles.aboutLabel}>{t('settings_about')}</Text>
          <Text style={styles.aboutValue}>Transparent Fit v{APP_VERSION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Choice<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map(o => (
        <Pressable
          key={o.id}
          onPress={() => onChange(o.id)}
          style={[styles.choice, value === o.id && styles.choiceSelected]}>
          <Text style={[styles.choiceText, value === o.id && styles.choiceTextSelected]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.md, paddingVertical: space.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.title, fontWeight: '700' },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  section: { gap: space.sm },
  sectionTitle: { color: colors.textSecondary, fontSize: fontSize.small, fontWeight: '600', textTransform: 'uppercase' },
  choiceRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  choice: {
    paddingHorizontal: space.md, paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.border,
  },
  choiceSelected: { backgroundColor: colors.purple, borderColor: 'transparent' },
  choiceText: { color: colors.textSecondary, fontSize: fontSize.body },
  choiceTextSelected: { color: colors.textPrimary, fontWeight: '700' },
  swatches: { flexDirection: 'row', gap: space.sm },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.border },
  swatchSelected: { borderColor: colors.purple, borderWidth: 3 },
  actionBtn: {
    height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.border,
    marginTop: space.md,
  },
  actionText: { color: colors.textPrimary, fontSize: fontSize.body, fontWeight: '600' },
  dangerBtn: {
    height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(220, 50, 50, 0.15)',
    borderWidth: 1, borderColor: 'rgba(220, 50, 50, 0.4)',
  },
  dangerText: { color: '#ff7070', fontSize: fontSize.body, fontWeight: '600' },
  aboutBox: {
    marginTop: space.lg,
    padding: space.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  aboutLabel: { color: colors.textSecondary, fontSize: fontSize.small, textTransform: 'uppercase' },
  aboutValue: { color: colors.textPrimary, fontSize: fontSize.body, marginTop: 4 },
});
