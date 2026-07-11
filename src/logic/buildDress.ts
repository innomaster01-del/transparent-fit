/**
 * Dress polygon — torso to mid-thigh / knee / ankle, A-line silhouette.
 */

import { BodyAxes, DressSub, Point } from './types';

export function buildDress(ax: BodyAxes, sub: DressSub): Point[] {
  const { lSh, rSh, hipMid, shMid, shW, torsoH, point } = ax;

  let hemDrop: number; // how far below hip the hem sits, in torso units
  let hemWidth: number; // multiplier for hem half-width

  switch (sub) {
    case 'mini':
      hemDrop = 0.40; hemWidth = 0.70;
      break;
    case 'long':
      hemDrop = 1.80; hemWidth = 1.10;
      break;
    case 'knee':
    default:
      hemDrop = 1.00; hemWidth = 0.90;
      break;
  }

  // Neckline (slightly lower than shirt — dresses sit on collarbone)
  const collarL = point(lSh, -torsoH * 0.02, +shW * 0.16);
  const collarR = point(rSh, -torsoH * 0.02, -shW * 0.16);

  // Cap-sleeve shoulders
  const shoulderExtL = point(lSh, torsoH * 0.02, -shW * 0.08);
  const shoulderExtR = point(rSh, torsoH * 0.02, +shW * 0.08);

  // Underarm (slightly tighter than shirt)
  const underL = point(lSh, torsoH * 0.22, +shW * 0.04);
  const underR = point(rSh, torsoH * 0.22, -shW * 0.04);

  // A-line skirt portion — gradual widening from waist to hem
  const waistL = point(hipMid, -torsoH * 0.05, -shW * 0.42);
  const waistR = point(hipMid, -torsoH * 0.05, +shW * 0.42);
  const hipL = point(hipMid, 0, -shW * 0.50);
  const hipR = point(hipMid, 0, +shW * 0.50);

  const hemL    = point(hipMid, torsoH * hemDrop, -shW * hemWidth);
  const hemMidL = point(hipMid, torsoH * hemDrop, -shW * hemWidth * 0.5);
  const hemMidR = point(hipMid, torsoH * hemDrop, +shW * hemWidth * 0.5);
  const hemR    = point(hipMid, torsoH * hemDrop, +shW * hemWidth);

  return [
    collarL, collarR,
    shoulderExtR, underR,
    waistR, hipR,
    hemR, hemMidR, hemMidL, hemL,
    hipL, waistL,
    underL, shoulderExtL,
  ];
}
