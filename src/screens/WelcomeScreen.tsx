/**
 * Screen 1 — Welcome / onboarding.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, space, radius, fontSize, fontFamily, shadow } from '../theme';
import { useT } from '../i18n';
import type { NavProps } from '../navigation/types';

const Camera = () => (
  <Svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={1.7}>
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <Path d="M16 13a4 4 0 11-8 0 4 4 0 018 0z" />
  </Svg>
);
const BodyIcon = () => (
  <Svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={1.7}>
    <Path d="M12 7a3 3 0 100-6 3 3 0 000 6z" />
    <Path d="M16 22V13l3-1V8c0-1-1-2-2-2h-2l-3 2-3-2H7c-1 0-2 1-2 2v4l3 1v9" />
  </Svg>
);
const ShirtIcon = () => (
  <Svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={1.7}>
    <Path d="M16 4l-4 2-4-2-4 3v4l3 1v8h10v-8l3-1v-4z" />
  </Svg>
);
const GearIcon = () => (
  <Svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={1.7}>
    <Path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);

export function WelcomeScreen({ nav }: NavProps) {
  const t = useT();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>
                Transparent <Text style={styles.brandAccent}>Fit</Text>
              </Text>
              <Text style={styles.tagline}>{t('tagline')}</Text>
            </View>
            <Pressable
              onPress={() => nav.push('Settings')}
              style={({ pressed }) => [styles.gearBtn, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityLabel={t('settings_title')}>
              <GearIcon />
            </Pressable>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <FeaturePill icon={<Camera />} label={t('feat_scan')} />
          <FeaturePill icon={<BodyIcon />} label={t('feat_body')} />
          <FeaturePill icon={<ShirtIcon />} label={t('feat_clothes')} />
        </View>

        <View style={styles.spacer} />

        <View style={styles.ctas}>
          <Pressable
            onPress={() => nav.push('PhotoCapture')}
            style={({ pressed }) => [
              styles.primaryCta,
              shadow.glow,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <LinearGradient
              colors={[colors.purple, colors.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            />
            <Text style={styles.primaryCtaText}>{t('start_camera')}</Text>
          </Pressable>

          <Pressable
            onPress={() => nav.push('PhotoCapture', { uploadMode: true })}
            style={({ pressed }) => [
              styles.secondaryCta,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={styles.secondaryCtaText}>{t('upload_instead')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.pill}>
      <View style={styles.pillIconBox}>{icon}</View>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flexGrow: 1, padding: space.lg, justifyContent: 'space-between' },
  header: { marginTop: space.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  gearBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  brand: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: fontFamily.display,
    letterSpacing: -0.5,
  },
  brandAccent: { color: colors.purple },
  tagline: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginTop: space.sm,
    lineHeight: 22,
  },
  featuresSection: {
    marginTop: space.xl,
    gap: space.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillIconBox: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  pillLabel: { color: colors.textPrimary, fontSize: fontSize.body, flex: 1 },
  spacer: { flex: 1, minHeight: space.xl },
  ctas: { gap: space.md, marginTop: space.lg },
  primaryCta: {
    height: 54, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientFill: { ...StyleSheet.absoluteFillObject },
  primaryCtaText: {
    color: colors.textPrimary, fontSize: fontSize.title, fontWeight: '700',
  },
  secondaryCta: {
    height: 50, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.border,
  },
  secondaryCtaText: { color: colors.textSecondary, fontSize: fontSize.body },
});
