/**
 * Computes the body-axis coordinate system from the 6 calibration marks.
 *
 * The "point" helper lets every garment builder place a vertex by saying
 * "X% torso down from this anchor, Y% shoulder width to its right" — without
 * having to do trigonometry per call. This keeps the geometry tilt-invariant
 * (if the user stands at a slight angle, the garment tilts with them).
 */

import { BodyAxes, BodyMarks, MarkIdx, Point } from './types';

export function bodyAxes(marks: BodyMarks): BodyAxes {
  const lSh = marks[MarkIdx.LeftShoulder];
  const rSh = marks[MarkIdx.RightShoulder];
  const lHip = marks[MarkIdx.LeftHip];
  const rHip = marks[MarkIdx.RightHip];
  const lAnkle = marks[MarkIdx.LeftAnkle];
  const rAnkle = marks[MarkIdx.RightAnkle];

  const shMid: Point = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
  const hipMid: Point = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };

  const shW = Math.hypot(rSh.x - lSh.x, rSh.y - lSh.y);
  const hipW = Math.hypot(rHip.x - lHip.x, rHip.y - lHip.y);
  const torsoH = Math.hypot(hipMid.x - shMid.x, hipMid.y - shMid.y);

  // "Down" direction along the body axis (shoulders → hips, normalized).
  const dx = (hipMid.x - shMid.x) / Math.max(1e-6, torsoH);
  const dy = (hipMid.y - shMid.y) / Math.max(1e-6, torsoH);
  // "Right" direction is perpendicular to down (rotate 90° clockwise in screen space).
  const rx = -dy;
  const ry = dx;

  const point = (origin: Point, along: number, across: number): Point => ({
    x: origin.x + dx * along + rx * across,
    y: origin.y + dy * along + ry * across,
  });

  return {
    lSh, rSh, lHip, rHip, shMid, hipMid,
    torsoH, shW, hipW,
    point, lAnkle, rAnkle,
  };
}
