/**
 * Screen 3 — Confirm body marks (auto-detected, draggable to refine).
 * Shows the garment polygon preview that updates as marks move.
 *
 * Dragging uses a SINGLE PanResponder on the canvas and the touch's
 * locationX/locationY (relative to the canvas view). This is absolute
 * positioning — the nearest mark jumps to the finger — which is immune to
 * the direction/mirror bug that the old per-marker cumulative-delta version
 * hit under RTL.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, Pressable, PanResponder, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Line } from 'react-native-svg';
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

const MARK_LABELS: Record<'he' | 'en', string[]> = {
  he: ['כתף', 'כתף', 'מותן', 'מותן', 'קרסול', 'קרסול'],
  en: ['Sh', 'Sh', 'Hip', 'Hip', 'Ank', 'Ank'],
};

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
  const lang = useAppStore(s => s.language);

  const [marks, setMarksLocal] = useState<BodyMarks | null>(storedMarks);
  const [poseError, setPoseError] = useState(false);

  const canvasW = winW;
  const canvasH = winH - 300;

  // Keep the freshest layout + marks accessible inside the PanResponder
  // (created once) without stale closures.
  const marksRef = useRef<BodyMarks | null>(storedMarks);
  marksRef.current = marks;

  const layout = useMemo(() => computeLayout({
    imgW: photoW, imgH: photoH,
    canvasW, canvasH,
    marks,
  }), [photoW, photoH, canvasW, canvasH, marks]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const activeIdx = useRef<number>(-1);

  useEffect(() => {
    if (!photoBase64 || marks) return;
    (async () => {
      try {
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

          if (segResult.status === 'fulfilled') {
            const grid = decodeMaskToGrid(segResult.value.base64Mask);
            if (grid) {
              const toGrid = scaleMarks(refined, grid.width / imgW, grid.height / imgH);
              const snapped = refineMarks(grid, toGrid);
              refined = scaleMarks(snapped, imgW / grid.width, imgH / grid.height) as typeof refined;
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

  // Map a canvas-relative touch to image coords and set the given mark.
  const setMarkFromCanvas = (idx: number, canvasX: number, canvasY: number) => {
    const L = layoutRef.current;
    const imgX = (canvasX - L.baseX) / L.scale;
    const imgY = (canvasY - L.baseY) / L.scale;
    const prev = marksRef.current;
    if (!prev) return;
    const next = prev.slice() as BodyMarks;
    next[idx] = { x: imgX, y: imgY };
    setMarksLocal(next);
  };

  const findNearestMark = (canvasX: number, canvasY: number): number => {
    const prev = marksRef.current;
    const L = layoutRef.current;
    if (!prev) return -1;
    let best = -1, bestD = Infinity;
    prev.forEach((m, i) => {
      const cx = L.baseX + m.x * L.scale;
      const cy = L.baseY + m.y * L.scale;
      const d = Math.hypot(cx - canvasX, cy - canvasY);
      if (d < bestD) { bestD = d; best = i; }
    });
    // Only grab a mark if the touch is reasonably close (60px).
    return bestD <= 60 ? best : -1;
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      activeIdx.current = findNearestMark(locationX, locationY);
      if (activeIdx.current >= 0) setMarkFromCanvas(activeIdx.current, locationX, locationY);
    },
    onPanResponderMove: (evt) => {
      if (activeIdx.current < 0) return;
      const { locationX, locationY } = evt.nativeEvent;
      setMarkFromCanvas(activeIdx.current, locationX, locationY);
    },
    onPanResponderRelease: () => {
      if (marksRef.current) setMarks(marksRef.current);
      activeIdx.current = -1;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  if (!photoBase64) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.title}>No photo</Text>
      </SafeAreaView>
    );
  }

  const toCanvas = (p: Point) => ({ x: layout.baseX + p.x * layout.scale, y: layout.baseY + p.y * layout.scale });

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

      <View style={[styles.canvasBox, { width: canvasW, height: canvasH }]} {...panResponder.panHandlers}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
          style={{
            position: 'absolute',
            left: layout.baseX, top: layout.baseY,
            width: photoW * layout.scale, height: photoH * layout.scale,
          }}
          resizeMode="cover"
        />

        {/* skeleton frame */}
        {marks && (() => {
          const [ls, rs, lh, rh, la, ra] = marks.map(toCanvas);
          const L = (a: Point, b: Point, k: string) => (
            <Line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(124,58,237,0.55)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4,5" />
          );
          return (
            <Svg width={canvasW} height={canvasH} style={StyleSheet.absoluteFill} pointerEvents="none">
              {L(ls, rs, 'sh')}{L(lh, rh, 'hip')}{L(ls, lh, 'll')}{L(rs, rh, 'rr')}{L(lh, la, 'lg')}{L(rh, ra, 'rg')}
            </Svg>
          );
        })()}

        <GarmentOutline polygon={polygon} width={canvasW} height={canvasH} showFill={false} showGlow={false} />

        {/* marker visuals (non-interactive — the canvas PanResponder handles drags) */}
        {marks && marks.map((m, i) => {
          const c = toCanvas(m);
          return (
            <View key={i} pointerEvents="none" style={[styles.marker, { left: c.x - 22, top: c.y - 22 }]}>
              <Text style={styles.markerLabel}>{MARK_LABELS[lang][i]}</Text>
            </View>
          );
        })}
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
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.9)',
    borderWidth: 3, borderColor: colors.outlineWhite,
    alignItems: 'center', justifyContent: 'center',
  },
  markerLabel: { color: colors.textPrimary, fontSize: 9, fontWeight: '700' },
  confirmBtn: {
    margin: space.md, height: 54, borderRadius: radius.md,
    backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { color: colors.textPrimary, fontSize: fontSize.title, fontWeight: '700' },
});
