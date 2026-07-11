/**
 * Screen 5 — Snapshot review (save / share / take another).
 */

import React, { useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { colors, fontSize, radius, space } from '../theme';
import { useT } from '../i18n';
import type { NavProps } from '../navigation/types';

interface Params { imageUri: string }

export function SnapshotScreen({ nav, params }: NavProps<Params>) {
  const t = useT();
  const uri = params?.imageUri;
  const [saved, setSaved] = useState(false);

  const onShare = async () => {
    if (uri) await Share.share({ url: uri });
  };

  const onSave = async () => {
    if (!uri) return;
    try {
      await CameraRoll.saveAsset(uri, { type: 'photo', album: 'Transparent Fit' });
      setSaved(true);
      Alert.alert(t('btn_save'), t('saved_to_library'));
    } catch (e: any) {
      Alert.alert(t('btn_save'), e?.message ?? 'Save failed');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.pop()} hitSlop={12}>
          <Text style={styles.action}>{t('btn_back')}</Text>
        </Pressable>
        <View style={styles.actionRow}>
          <Pressable onPress={onSave} hitSlop={12} disabled={saved}>
            <Text style={[styles.action, saved && styles.actionDisabled]}>
              {saved ? '✓ ' : ''}{t('btn_save')}
            </Text>
          </Pressable>
          <Pressable onPress={onShare} hitSlop={12}>
            <Text style={styles.action}>{t('btn_share')}</Text>
          </Pressable>
        </View>
      </View>
      {uri && <Image source={{ uri }} style={styles.image} resizeMode="contain" />}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={() => nav.replace('LiveTryOn')}
          style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.7 : 1 }]}>
          <Text style={styles.btnText}>{t('btn_take_another')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: space.md,
  },
  actionRow: { flexDirection: 'row', gap: space.lg },
  action: { color: colors.purple, fontSize: fontSize.body, fontWeight: '600' },
  actionDisabled: { color: colors.textSecondary },
  image: { flex: 1, width: '100%' },
  bottomBar: { padding: space.lg },
  btn: {
    height: 54, borderRadius: radius.md,
    backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: colors.textPrimary, fontWeight: '700', fontSize: fontSize.title },
});
