/**
 * Screen 2 — Take or upload a full-body photo.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { colors, space, radius, fontSize } from '../theme';
import { useT } from '../i18n';
import { useAppStore } from '../store/appStore';
import { CaptureButton } from '../components/CaptureButton';
import { IconButton } from '../components/IconButton';
import Svg, { Path, Polyline } from 'react-native-svg';
import type { NavProps } from '../navigation/types';

export function PhotoCaptureScreen({ nav, params }: NavProps<{ uploadMode?: boolean }>) {
  const t = useT();
  const setPhoto = useAppStore(s => s.setPhoto);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = React.useRef<Camera>(null);
  const [preview, setPreview] = useState<{ uri: string; base64: string; w: number; h: number } | null>(null);

  React.useEffect(() => {
    if (params?.uploadMode) {
      openLibrary();
    } else if (!hasPermission) {
      requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openLibrary = async () => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      selectionLimit: 1,
    });
    const asset = res.assets?.[0];
    if (asset?.base64 && asset.uri && asset.width && asset.height) {
      setPreview({ uri: asset.uri, base64: asset.base64, w: asset.width, h: asset.height });
    }
  };

  const onCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const file = await cameraRef.current.takePhoto({ flash: 'off' });
      const path = file.path.startsWith('file://') ? file.path : `file://${file.path}`;
      const base64 = await RNFS.readFile(path.replace('file://', ''), 'base64');
      // Vision Camera doesn't return dimensions directly — quick decode
      Image.getSize(path, (w, h) => {
        setPreview({ uri: path, base64, w, h });
      });
    } catch (e: any) {
      Alert.alert('Camera error', e.message ?? 'Could not take photo');
    }
  };

  const onConfirm = () => {
    if (!preview) return;
    setPhoto(preview.base64, preview.w, preview.h);
    nav.push('MarkPoints');
  };

  // PREVIEW MODE — show captured/selected photo with confirm/retake
  if (preview) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.topBar}>
          <IconButton onPress={() => setPreview(null)} accessibilityLabel={t('btn_back')}>
            <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="white" strokeWidth={2.5}>
              <Polyline points="15 18 9 12 15 6" />
            </Svg>
          </IconButton>
          <Text style={styles.title}>{t('step1_title')}</Text>
          <View style={{ width: 42 }} />
        </View>
        <Image source={{ uri: preview.uri }} style={styles.previewImage} resizeMode="contain" />
        <View style={styles.confirmRow}>
          <Pressable onPress={() => setPreview(null)} style={[styles.btn, styles.btnSecondary]}>
            <Text style={styles.btnText}>{t('btn_take_another')}</Text>
          </Pressable>
          <Pressable onPress={onConfirm} style={[styles.btn, styles.btnPrimary]}>
            <Text style={styles.btnText}>{t('step2_confirm')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // CAMERA MODE
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <IconButton onPress={() => nav.pop()} accessibilityLabel={t('btn_back')}>
          <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="white" strokeWidth={2.5}>
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </IconButton>
        <Text style={styles.title}>{t('step1_title')}</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.cameraBox}>
        {hasPermission && device ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
          />
        ) : (
          <View style={styles.permissionMsg}>
            <Text style={styles.permissionText}>
              {hasPermission === false
                ? t('permission_camera_denied')
                : t('permission_camera')}
            </Text>
            <Pressable onPress={openLibrary} style={[styles.btn, styles.btnSecondary, { marginTop: space.lg }]}>
              <Text style={styles.btnText}>{t('upload_instead')}</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{t('step1_help')}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={openLibrary} style={styles.libraryBtn}>
          <Text style={styles.libraryBtnText}>📷 {t('upload_instead')}</Text>
        </Pressable>
        {hasPermission && <CaptureButton onPress={onCapture} />}
        <View style={{ width: 60 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.md, paddingVertical: space.sm,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.body, fontWeight: '600' },
  cameraBox: { flex: 1, position: 'relative', overflow: 'hidden' },
  permissionMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.lg },
  permissionText: { color: colors.textSecondary, textAlign: 'center', fontSize: fontSize.body },
  hintBox: {
    position: 'absolute', bottom: space.lg, left: space.lg, right: space.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.55)', borderRadius: radius.md, padding: space.md,
  },
  hintText: { color: colors.textPrimary, fontSize: fontSize.small, textAlign: 'center' },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: space.lg,
  },
  libraryBtn: { paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.md },
  libraryBtnText: { color: colors.textSecondary, fontSize: fontSize.small },
  previewImage: { flex: 1, width: '100%', backgroundColor: '#000' },
  confirmRow: { flexDirection: 'row', padding: space.md, gap: space.md },
  btn: {
    flex: 1, height: 50, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.purple },
  btnSecondary: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border },
  btnText: { color: colors.textPrimary, fontWeight: '600', fontSize: fontSize.body },
});
