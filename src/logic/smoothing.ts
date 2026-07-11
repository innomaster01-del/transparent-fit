/**
 * smoothing — adaptive temporal smoothing for live keypoints.
 *
 * Raw per-frame pose detections jitter by a few pixels even when the person
 * stands still, which makes the garment outline vibrate. Plain heavy
 * smoothing fixes that but adds lag when the person actually moves.
 *
 * This is a simplified One-Euro filter: smoothing strength adapts to speed.
 *   - Small movements (jitter)  → strong smoothing → rock-steady outline
 *   - Large movements (walking) → light smoothing  → responsive tracking
 *
 * Pure TypeScript, no RN imports — unit-testable.
 */

import { Point } from './types';

export interface SmootherOptions {
  /** Below this per-frame movement (px) we treat it as jitter. */
  jitterRadius: number;
  /** Movement (px) at which the filter becomes fully responsive. */
  fastRadius: number;
  /** Smoothing factor applied inside the jitter zone (0..1, higher = stiffer). */
  maxSmoothing: number;
  /** Smoothing factor at/above fastRadius (0..1, lower = snappier). */
  minSmoothing: number;
}

export const DEFAULT_SMOOTHER_OPTIONS: SmootherOptions = {
  jitterRadius: 2.5,
  fastRadius: 24,
  maxSmoothing: 0.92,
  minSmoothing: 0.25,
};

export class PointSmoother {
  private prev: Point | null = null;
  constructor(private readonly opts: SmootherOptions = DEFAULT_SMOOTHER_OPTIONS) {}

  reset(): void {
    this.prev = null;
  }

  /** Feed a new raw sample, get the smoothed point. */
  next(raw: Point): Point {
    if (!this.prev) {
      this.prev = { ...raw };
      return this.prev;
    }
    const dx = raw.x - this.prev.x;
    const dy = raw.y - this.prev.y;
    const dist = Math.hypot(dx, dy);

    const { jitterRadius, fastRadius, maxSmoothing, minSmoothing } = this.opts;
    let s: number;
    if (dist <= jitterRadius) {
      s = maxSmoothing;
    } else if (dist >= fastRadius) {
      s = minSmoothing;
    } else {
      // Linear ramp between the two zones
      const t = (dist - jitterRadius) / (fastRadius - jitterRadius);
      s = maxSmoothing + (minSmoothing - maxSmoothing) * t;
    }

    this.prev = {
      x: this.prev.x * s + raw.x * (1 - s),
      y: this.prev.y * s + raw.y * (1 - s),
    };
    return this.prev;
  }
}

/** Named-keypoint smoother — one PointSmoother per joint, null-tolerant. */
export class KeypointSetSmoother<K extends string> {
  private smoothers = new Map<K, PointSmoother>();
  constructor(private readonly opts: SmootherOptions = DEFAULT_SMOOTHER_OPTIONS) {}

  reset(): void {
    this.smoothers.forEach(s => s.reset());
  }

  next(key: K, raw: Point | null): Point | null {
    if (!raw) {
      // Joint lost this frame — keep the smoother but don't fabricate output.
      return null;
    }
    let s = this.smoothers.get(key);
    if (!s) {
      s = new PointSmoother(this.opts);
      this.smoothers.set(key, s);
    }
    return s.next(raw);
  }
}
