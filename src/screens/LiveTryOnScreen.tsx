/**
 * Screen 4 — LIVE TRY-ON. The headline screen.
 *
 * Layout matches reference Image 2:
 *   - Top bar:    title (mode + hint) · close ✕
 *   - Right side: vertical 4-mode pill (ModeSelector)
 *   - Bottom-left: light (torch) · flip · pause  (icon column)
 *   - Bottom-center: big capture button
 *   - Canvas: live camera OR static photo + garment outline (checkered fill + white stroke)
 *
 * Live tracking: while the camera runs, useLivePoseTracking samples the pose a
 * few times a second and updates `liveMarks`, so the outline follows the person.
 * In static-photo mode the calibrated `marks` are used and transformed through
 * the photo layout so the outline lines up with the scaled image.
 */

import React, { useMemo, useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Svg, { Line, Polyline, Polygon as SvgPolygon, Path, Circle } from 'react-native-svg';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import { colors, space, fontSize } from '../theme';
import { useT } from '../i18n';
import { useAppStore } from '../store/appStore';
import { IconButton } from '../components/IconButton';
import { ModeSelector } from '../components/ModeSelector';
import { CaptureButton } from '../components/CaptureButton';
import { GarmentOutline } from '../components/GarmentOutline';
import { buildPolygon } from '../logic/buildPolygon';
import { computeLayout } from '../logic/layout';
import { transformPolygon } from '../logic/polygonTransform';
import { useLivePoseTracking } from '../hooks/useLivePoseTracking';
import type { NavProps } from '../navigation/types';

export function LiveTryOnScreen({ nav }: NavProps) {
  const t = useT();
  const { width: winW, height: winH } = useWindowDimensions();
  const cameraRef = useRef<Camera>(null);

  // State
  const mode = useAppStore(s => s.mode);
  const subStyles = useAppStore(s => s.subStyles);
  const marks = useAppStore(s => s.marks);
  const liveMarks = useAppStore(s => s.liveMarks);
  const photoBase64 = useAppStore(s => s.photoBase64);
  const photoW = useAppStore(s => s.photoWidth);
  const photoH = useAppStore(s => s.photoHeight);
  const outlineThickness = useAppStore(s => s.outlineThickness);
  const outlineColor = useAppStore(s => s.outlineColor);
  const showGlow = useAppStore(s => s.showGlow);
  const showFill = useAppStore(s => s.showFill);
  const cameraFacing = useAppStore(s => s.cameraFacing);
  const toggleCameraFacing = useAppStore(s => s.toggleCameraFacing);
  const isPaused = useAppStore(s => s.isPaused);
  const togglePaused = useAppStore(s => s.togglePaused);
  const torchEnabled = useAppStore(s => s.torchEnabled);
  const toggleTorch = useAppStore(s => s.toggleTorch);

  const { hasPermission } = useCameraPermission();
  const device = useCameraDevice(cameraFacing);
  const [useLiveCamera] = useState(hasPermission);
  const segmentationMask = useAppStore(s => s.segmentationMask);
  const [capturing, setCapturing] = useState(false);

  // Canvas dimensions
  const canvasW = winW;
  const canvasH = winH - 56; // leave room for top bar

  const liveActive = !!(useLiveCamera && device && !isPaused);

  // Drive live pose tracking when the camera is running
  useLivePoseTracking({
    cameraRef,
    canvasW,
    canvasH,
    enabled: liveActive,
  });

  // Layout for static photo backdrop (used only when no live camera)
  const layout = useMemo(() => computeLayout({
    imgW: photoW || 1, imgH: photoH || 1,
    canvasW, canvasH,
    marks,
  }), [photoW, photoH, canvasW, canvasH, marks]);

  // Polygon — in canvas space, ready for GarmentOutline.
  //   Live mode:   liveMarks are already canvas-space → use directly.
  //   Static mode: marks are image-space → build then transform through layout.
  const polygon = useMemo(() => {
    if (liveActive && liveMarks) {
      return buildPolygon(liveMarks, mode, subStyles[mode]);
    }
    if (marks) {
      const imgPoly = buildPolygon(marks, mode, subStyles[mode]);
      return transformPolygon(imgPoly, layout);
    }
    return null;
  }, [liveActive, liveMarks, marks, mode, subStyles, layout]);

  const titleKey = `step3_${mode}` as 'step3_shirt' | 'step3_pants' | 'step3_dress' | 'step3_full';
  const hintKey = `hint_${mode}` as 'hint_shirt' | 'hint_pants' | 'hint_dress' | 'hint_full';

  const onCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      let basePath: string | undefined;

      if (useLiveCamera && cameraRef.current) {
        const file = await cameraRef.current.takePhoto({ flash: torchEnabled ? 'on' : 'off' });
        basePath = file.path.startsWith('file://') ? file.path : `file://${file.path}`;
      } else if (photoBase64) {
        // Static mode: write the backdrop photo to a temp file so we can save it
        const tmp = `${RNFS.CachesDirectoryPath}/tf_base_${Date.now()}.jpg`;
        await RNFS.writeFile(tmp, photoBase64, 'base64');
        basePath = `file://${tmp}`;
      }

      if (!basePath) {
        Alert.alert(t('btn_capture'), t('permission_camera_denied'));
        return;
      }

      // NOTE: The garment outline is composited on top of the saved frame by the
      // SnapshotScreen preview (overlay render). For a single flattened JPEG with
      // the outline burned in, ticket 09 wires Skia makeImageSnapshot of the live
      // canvas; that needs the offscreen surface enabled in the native build.
      await CameraRoll.saveAsset(basePath, { type: 'photo', album: 'Transparent Fit' });
      nav.push('Snapshot', { imageUri: basePath });
    } catch (e: any) {
      Alert.alert(t('btn_capture'), e?.message ?? 'Capture failed');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton onPress={() => nav.pop()} accessibilityLabel={t('btn_back')}>
          <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="white" strokeWidth={2.5}>
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </IconButton>
        <View style={styles.titleBox}>
          <Text style={styles.titleLabel}>{t(titleKey)}</Text>
          <Text style={styles.titleHint}>{t(hintKey)}</Text>
        </View>
        <IconButton onPress={() => nav.push('Welcome')} accessibilityLabel={t('btn_close')}>
          <Svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="white" strokeWidth={2.5}>
            <Line x1={18} y1={6} x2={6} y2={18} />
            <Line x1={6} y1={6} x2={18} y2={18} />
          </Svg>
        </IconButton>
      </View>

      {/* Canvas — camera or photo backdrop */}
      <View style={[styles.canvas, { width: canvasW, height: canvasH }]}>
        {useLiveCamera && device ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!isPaused}
            photo={true}
            torch={torchEnabled && cameraFacing === 'back' ? 'on' : 'off'}
          />
        ) : photoBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
            style={{
              position: 'absolute',
              left: layout.baseX, top: layout.baseY,
              width: photoW * layout.scale, height: photoH * layout.scale,
            }}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noSource}>
            <Text style={styles.noSourceText}>{t('permission_camera_denied')}</Text>
          </View>
        )}

        {/* Garment outline + checkered fill.
            In photo mode we also pass the segmentation mask so the fill is
            clipped to the person's real silhouette — the "cut exactly along
            the body" effect. (Live camera mode skips it: the calibration mask
            belongs to the calibration photo, not the live frame.) */}
        <GarmentOutline
          polygon={polygon}
          width={canvasW}
          height={canvasH}
          outlineColor={outlineColor}
          thickness={outlineThickness}
          showGlow={showGlow}
          showFill={showFill}
          bodyMaskBase64={!useLiveCamera ? segmentationMask : null}
          maskRect={
            !useLiveCamera
              ? {
                  x: layout.baseX,
                  y: layout.baseY,
                  width: photoW * layout.scale,
                  height: photoH * layout.scale,
                }
              : undefined
          }
        />
      </View>

      {/* Right side: mode column */}
      <View style={styles.rightStack}>
        <ModeSelector />
      </View>

      {/* Bottom left: tool buttons (light · flip · pause) */}
      <View style={styles.toolStack}>
        <IconButton onPress={toggleTorch} accessibilityLabel="Light" active={torchEnabled}>
          <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="white" strokeWidth={2}>
            <Line x1={12} y1={1} x2={12} y2={3} />
            <Line x1={12} y1={21} x2={12} y2={23} />
            <Line x1={4.2} y1={4.2} x2={5.6} y2={5.6} />
            <Line x1={18.4} y1={18.4} x2={19.8} y2={19.8} />
            <Line x1={1} y1={12} x2={3} y2={12} />
            <Line x1={21} y1={12} x2={23} y2={12} />
            <Line x1={4.2} y1={19.8} x2={5.6} y2={18.4} />
            <Line x1={18.4} y1={5.6} x2={19.8} y2={4.2} />
            <Circle cx={12} cy={12} r={4} />
          </Svg>
        </IconButton>
        <IconButton onPress={toggleCameraFacing} accessibilityLabel={t('btn_flip')}>
          <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="white" strokeWidth={2}>
            <Path d="M1 4v6h6" />
            <Path d="M23 20v-6h-6" />
            <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </Svg>
        </IconButton>
        <IconButton onPress={togglePaused} accessibilityLabel={isPaused ? t('btn_resume') : t('btn_pause')} active={isPaused}>
          <Svg viewBox="0 0 24 24" width={18} height={18} fill="white">
            {isPaused ? (
              <SvgPolygon points="8,5 19,12 8,19" fill="white" />
            ) : (
              <>
                <Line x1={6} y1={4} x2={6} y2={20} stroke="white" strokeWidth={4} />
                <Line x1={14} y1={4} x2={14} y2={20} stroke="white" strokeWidth={4} />
              </>
            )}
          </Svg>
        </IconButton>
      </View>

      {/* Bottom center: capture button */}
      <View style={styles.captureBar}>
        <CaptureButton onPress={onCapture} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.md, paddingVertical: space.sm,
    zIndex: 10,
  },
  titleBox: { flex: 1, alignItems: 'center' },
  titleLabel: { color: colors.purple, fontSize: fontSize.small, fontWeight: '700', letterSpacing: 1.2 },
  titleHint: { color: colors.textPrimary, fontSize: fontSize.body, fontWeight: '600', marginTop: 2 },
  canvas: { position: 'absolute', top: 56, left: 0, right: 0, overflow: 'hidden', backgroundColor: '#000' },
  rightStack: {
    position: 'absolute',
    top: 85,
    right: 10,
    zIndex: 10,
  },
  toolStack: {
    position: 'absolute',
    bottom: 32,
    left: 14,
    zIndex: 10,
    gap: 10,
  },
  captureBar: {
    position: 'absolute',
    bottom: 22,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  noSource: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noSourceText: { color: colors.textSecondary, fontSize: fontSize.body, padding: space.lg, textAlign: 'center' },
});
