/**
 * useLivePoseTracking — drives the live outline on the Try-On screen.
 *
 * Strategy (works on every iOS/Android device, no Reanimated worklet plumbing):
 *   1. On an interval, grab a fast low-res snapshot from the Vision Camera.
 *   2. Run native pose detection on it.
 *   3. Map the detected keypoints (image px) → canvas px using the same
 *      "shoulders at 28%" layout used everywhere else.
 *   4. Push the result into the store as `liveMarks`, smoothed against the
 *      previous frame so the outline doesn't jitter.
 *
 * Why snapshot-loop instead of a frame processor:
 *   A true frame processor (vision-camera + a Skia/MLKit plugin) is faster but
 *   needs a native plugin compiled in. The snapshot loop needs ZERO extra native
 *   code beyond the PoseDetector module we already ship, so the app runs the day
 *   it's built. Ticket 03 documents the upgrade path to a frame processor for v1.1.
 */

import { useEffect, useRef } from 'react';
import type { Camera } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { detectPose } from '../native';
import { computeLayout } from '../logic/layout';
import { KeypointSetSmoother } from '../logic/smoothing';
import { useAppStore } from '../store/appStore';
import type { BodyMarks, Point } from '../logic/types';

interface Options {
  cameraRef: React.RefObject<Camera>;
  /** Canvas size the outline is drawn into. */
  canvasW: number;
  canvasH: number;
  /** Whether tracking should run (live camera available, not paused). */
  enabled: boolean;
  /** Milliseconds between pose samples. 300ms ≈ 3 fps tracking — smooth enough
   *  for someone standing in a mirror, light on battery. Lower for snappier. */
  intervalMs?: number;
}

const MARK_KEYS = ['ls', 'rs', 'lh', 'rh', 'la', 'ra'] as const;

export function useLivePoseTracking({
  cameraRef,
  canvasW,
  canvasH,
  enabled,
  intervalMs = 300,
}: Options) {
  const setLiveMarks = useAppStore(s => s.setLiveMarks);
  const calibrationMarks = useAppStore(s => s.marks);
  const busy = useRef(false);
  // Adaptive per-joint smoothing: rock-steady when standing, responsive when moving.
  const smoother = useRef(new KeypointSetSmoother<(typeof MARK_KEYS)[number]>());

  useEffect(() => {
    if (!enabled) {
      setLiveMarks(null);
      smoother.current.reset();
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled || busy.current || !cameraRef.current) return;
      busy.current = true;
      try {
        // 1. Fast snapshot (snapshot is much cheaper than takePhoto)
        const snap = await cameraRef.current.takeSnapshot({ quality: 50 });
        const path = snap.path.replace('file://', '');
        const base64 = await RNFS.readFile(path, 'base64');

        // 2. Pose detection
        const { keypoints, imageWidth, imageHeight } = await detectPose(base64);

        // Clean up the temp snapshot file
        RNFS.unlink(path).catch(() => {});

        if (cancelled) return;

        // Need at least both shoulders + both hips to build a stable outline
        const { leftShoulder, rightShoulder, leftHip, rightHip } = keypoints;
        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
          // Lost the body — keep last good pose rather than snapping to null
          return;
        }

        // Ankles can be missing (legs out of frame) — estimate from hip + torso
        const torso = Math.hypot(
          (leftHip.x + rightHip.x) / 2 - (leftShoulder.x + rightShoulder.x) / 2,
          (leftHip.y + rightHip.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2,
        );
        const leftAnkle = keypoints.leftAnkle ?? { x: leftHip.x, y: leftHip.y + torso * 1.15 };
        const rightAnkle = keypoints.rightAnkle ?? { x: rightHip.x, y: rightHip.y + torso * 1.15 };

        // 3. Map image-space keypoints → canvas space
        const imageMarks: BodyMarks = [
          leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle,
        ];
        const layout = computeLayout({
          imgW: imageWidth, imgH: imageHeight,
          canvasW, canvasH,
          marks: imageMarks,
        });
        const toCanvas = (p: Point): Point => ({
          x: p.x * layout.scale + layout.baseX,
          y: p.y * layout.scale + layout.baseY,
        });
        const canvasMarks = imageMarks.map(toCanvas) as BodyMarks;

        // 4. Adaptive smoothing per joint + publish
        const sm = smoother.current;
        const smoothed = canvasMarks.map(
          (p, i) => sm.next(MARK_KEYS[i], p) ?? p,
        ) as BodyMarks;
        if (!cancelled) setLiveMarks(smoothed);
      } catch {
        // Snapshot/detection can fail transiently (camera busy) — ignore, retry next tick
      } finally {
        busy.current = false;
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, canvasW, canvasH, intervalMs, cameraRef, setLiveMarks, calibrationMarks]);
}
