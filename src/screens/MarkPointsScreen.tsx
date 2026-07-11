/**
 * Screen 3 — Confirm body marks (auto-detected, draggable to refine).
 * Shows the garment polygon preview that updates as marks move.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Image, Pressable, PanResponder, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Path } from 'react-native-svg';
import { colors, space, radius, fontSize } from '../theme';
import { useT } from '../i18n';
import { useAppStore } from '../store/appStore';
import { IconButton } from '../components/IconButton';
import { GarmentOutline } from '../components/GarmentOutline';
import { detectPose, segmentPerson } from '../native';
import { refineMarks, scaleMarks } from '../logic/refineMarks';
import { decodeMaskToGrid } from '../utils/maskGrid';
import { buildPolygon } from '../logic/buildPolygon';
import { computeLayout } from '../logic/layout';
import { transformPolygon } from '../logic/polygonTransform';
import { ModeStripHorizontal } from '../components/ModeStripHorizontal';
import { SubStyleStrip } from '../components/SubStyleStrip';
import type { BodyMarks, Point } from '../logic/types';
import type { NavProps } from '../navigation/types';

export function MarkPointsScreen({ nav }: NavProps) {
  const t = useT();
  const { width: winW, height: winH } = useWindowDimensions();
  const photoBase64 = useAppStore(s => s.photoBase64);
  const photoW = useAppStore(s => s.photoWidth);
  const photoH = useAppStore(s => s.photoHeight);
  const storedMarks = useAppStore(s => s.marks);
  const setMarks = useAppStore(s => s.setMarks);
  const setSegmentationMask = useAppStore(s => s.setSegmentationMask);
  const mode = useAppStore(s => s.mode);
  const subStyles = useAppStore(s => s.subStyles);

  const [marks, setMarksLocal] = useState<BodyMarks | null>(storedMarks);
  const [poseError, setPoseError] = useState(false);

  const canvasW = winW;
  const canvasH = winH - 280; // leaves room for top bar + mode/sub strip + CTA

  const layout = useMemo(() => computeLayout({
    imgW: photoW, imgH: photoH,
    canvasW, canvasH,
    marks,
  }), [photoW, photoH, canvasW, canvasH, marks]);

  // Smart auto-detect on first mount:
  //   1. Pose detection  → joint positions (inside the body)
  //   2. Person segmentation → body silhouette mask
  //   3. refineMarks     → snap joints to the TRUE body edges in the mask
  // Result: the garment polygon hugs the person exactly, not the skeleton.
  useEffect(() => {
    if (!photoBase64 || marks) return;
    (async () => {
      try {
        // Run pose + segmentation in parallel — both are on-device and fast.
        const [poseResult, segResult] = await Promise.allSettled([
          detectPose(photoBase64),
          segmentPerson(photoBase64, 'accurate'),
        ]);
        if (poseResult.status !== 'fulfilled') throw new Error('pose failed');
        const kp = poseResult.value.keypoints;
        const imgW = poseResult.value.imageWidth || photoW;
        const imgH = poseResult.value.imageHeight || photoH;

        if (kp.leftShoulder && kp.rightShoulder && kp.leftHip && kp.rightHip) {
          let refined = {
            leftShoulder: kp.leftShoulder,
            rightShoulder: kp.rightShoulder,
            leftHip: kp.leftHip,
            rightHip: kp.rightHip,
            leftAnkle: kp.leftAnkle,
            rightAnkle: kp.rightAnkle,
          };

          // Edge-snap against the segmentation mask when available.
          if (segResult.status === 'fulfilled') {
            const grid = decodeMaskToGrid(segResult.value.base64Mask);
            if (grid) {
              const toGrid = scaleMarks(refined, grid.width / imgW, grid.height / imgH);
              const snapped = refineMarks(grid, toGrid);
              refined = scaleMarks(snapped, imgW / grid.width, imgH / grid.height) as typeof refined;
              // Keep the mask for the try-on screen (body-clipped rendering)
              setSegmentationMask(segResult.value.base64Mask);
            }
          }

          const torsoH = Math.hypot(
            (refined.leftHip!.y + refined.rightHip!.y) / 2 -
              (refined.leftShoulder!.y + refined.rightShoulder!.y) / 2,
            (refined.leftHip!.x + refined.rightHip!.x) / 2 -
              (refined.leftShoulder!.x + refined.rightShoulder!.x) / 2,
          );
          const fallbackAnkle = (hip: Point): Point => ({ x: hip.x, y: hip.y + torsoH * 1.5 });
          const newMarks: BodyMarks = [
            refined.leftShoulder!, refined.rightShoulder!,
            refined.leftHip!, refined.rightHip!,
            refined.leftAnkle ?? fallbackAnkle(refined.leftHip!),
            refined.rightAnkle ?? fallbackAnkle(refined.rightHip!),
          ];
          setMarksLocal(newMarks);
          setMarks(newMarks);
        } else {
          setPoseError(true);
          placeDefaultMarks();
        }
      } catch {
        setPoseError(true);
        placeDefaultMarks();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoBase64]);

  const placeDefaultMarks = () => {
    // Center of photo, reasonable proportions
    const cx = photoW / 2;
    const cy = photoH / 2;
    const w = photoW * 0.20;
    const h = photoH * 0.35;
    const defaults: BodyMarks = [
      { x: cx - w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy - h / 2 },
      { x: cx - w / 2.5, y: cy },
      { x: cx + w / 2.5, y: cy },
      { x: cx - w / 3, y: cy + h * 1.2 },
      { x: cx + w / 3, y: cy + h * 1.2 },
    ];
    setMarksLocal(defaults);
    setMarks(defaults);
  };

  const polygon = useMemo(() => {
    if (!marks) return null;
    const imgPoly = buildPolygon(marks, mode, subStyles[mode]);
    return transformPolygon(imgPoly, layout);
  }, [marks, mode, subStyles, layout]);

  const onMarkDrag = (idx: number, dxCanvas: number, dyCanvas: number) => {
    if (!marks) return;
    const dxImg = dxCanvas / layout.scale;
    const dyImg = dyCanvas / layout.scale;
    const newMarks = marks.slice() as BodyMarks;
    newMarks[idx] = { x: marks[idx].x + dxImg, y: marks[idx].y + dyImg };
    setMarksLocal(newMarks);
  };

  const commit = () => {
    if (marks) setMarks(marks);
  };

  if (!photoBase64) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.title}>No photo</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <IconButton onPress={() => nav.pop()} accessibilityLabel={t('btn_back')}>
          <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="white" strokeWidth={2.5}>
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </IconButton>
        <Text style={styles.title}>{t('step2_title')}</Text>
        <View style={{ width: 42 }} />
      </View>

      {poseError && <Text style={styles.poseHint}>{t('pose_not_detected')}</Text>}
      {!poseError && marks && <Text style={styles.poseHint}>{t('pose_detected')}</Text>}

      <View style={[styles.canvasBox, { width: canvasW, height: canvasH }]}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
          style={{
            position: 'absolute',
            left: layout.baseX, top: layout.baseY,
            width: photoW * layout.scale, height: photoH * layout.scale,
          }}
          resizeMode="cover"
        />
        <GarmentOutline polygon={polygon} width={canvasW} height={canvasH} showFill={false} showGlow={false} />
        {marks && marks.map((m, i) => (
          <DraggableMarker
            key={i}
            x={layout.baseX + m.x * layout.scale}
            y={layout.baseY + m.y * layout.scale}
            label={String(i + 1)}
            onMove={(dx, dy) => onMarkDrag(i, dx, dy)}
            onRelease={commit}
          />
        ))}
      </View>

      <ModeStripHorizontal />
      <SubStyleStrip />

      <Pressable
        onPress={() => marks && nav.push('LiveTryOn')}
        style={({ pressed }) => [
          styles.confirmBtn, { opacity: !marks || pressed ? 0.7 : 1 },
        ]}
        disabled={!marks}>
        <Text style={styles.confirmBtnText}>{t('step2_confirm')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function DraggableMarker(props: {
  x: number; y: number; label: string;
  onMove: (dx: number, dy: number) => void;
  onRelease: () => void;
}) {
  const startRef = React.useRef({ x: 0, y: 0 });
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { startRef.current = { x: props.x, y: props.y }; },
    onPanResponderMove: (_, g) => { props.onMove(g.dx, g.dy); },
    onPanResponderRelease: () => { props.onRelease(); },
  }), [props]);

  return (
    <View
      {...responder.panHandlers}
      style={[
        styles.marker,
        { left: props.x - 18, top: props.y - 18 },
      ]}>
      <Text style={styles.markerLabel}>{props.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.md, paddingVertical: space.sm,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.body, fontWeight: '600' },
  poseHint: { color: colors.textSecondary, fontSize: fontSize.small, textAlign: 'center', padding: space.sm },
  canvasBox: { position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  marker: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.purple,
    borderWidth: 3, borderColor: colors.outlineWhite,
    alignItems: 'center', justifyContent: 'center',
  },
  markerLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  confirmBtn: {
    margin: space.md, height: 54, borderRadius: radius.md,
    backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { color: colors.textPrimary, fontSize: fontSize.title, fontWeight: '700' },
});
