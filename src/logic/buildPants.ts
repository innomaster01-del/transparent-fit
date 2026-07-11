/**
 * Pants polygon — waistband at hip line, two legs tapered to ankles.
 *
 * Returned as a SINGLE closed polygon (not multi). Crotch V is built into
 * the polygon outline so the outer outline reads as "pants" cleanly.
 */

import { BodyAxes, PantsSub, Point } from './types';

export function buildPants(ax: BodyAxes, sub: PantsSub): Point[] {
  const { lHip, rHip, hipMid, shW, hipW, torsoH, point, lAnkle, rAnkle } = ax;

  let length: number; // 0..1, fraction of (hip → ankle)
  let kneeTaper: number; // narrower at knee
  let ankleTaper: number; // narrower at ankle

  switch (sub) {
    case 'shorts':
      length = 0.35; kneeTaper = 0.55; ankleTaper = 0.55;
      break;
    case 'skirt':
      // Skirt becomes a single trapezoid — no crotch V
      length = 0.55; kneeTaper = 0.85; ankleTaper = 1.0;
      break;
    case 'long':
    default:
      length = 1.0; kneeTaper = 0.62; ankleTaper = 0.48;
      break;
  }

  // Waistband — slightly above hip line, wider than hips
  const waistHalfW = 0.55;
  const waistL = point(hipMid, -torsoH * 0.04, -shW * waistHalfW);
  const waistR = point(hipMid, -torsoH * 0.04, +shW * waistHalfW);

  // Hip flare
  const hipFlareL = point(hipMid, 0, -shW * 0.62);
  const hipFlareR = point(hipMid, 0, +shW * 0.62);

  // Skirt — single trapezoid, no leg split
  if (sub === 'skirt') {
    const hemL = point(hipMid, torsoH * length, -shW * 0.85);
    const hemR = point(hipMid, torsoH * length, +shW * 0.85);
    return [waistL, hipFlareL, hemL, hemR, hipFlareR, waistR];
  }

  // Pants — single polygon with crotch V at midpoint
  // Ankle interpolation between hip and detected ankle
  const lerp = (a: Point, b: Point, t: number): Point => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });

  // Leg outer edges at knee and ankle
  const lKneeOuter = point(lHip, torsoH * length * 0.5, -shW * 0.32 * kneeTaper);
  const rKneeOuter = point(rHip, torsoH * length * 0.5, +shW * 0.32 * kneeTaper);
  const lAnkleOuter = point(lHip, torsoH * length * 0.95, -shW * 0.28 * ankleTaper);
  const rAnkleOuter = point(rHip, torsoH * length * 0.95, +shW * 0.28 * ankleTaper);

  // Leg inner edges — converge toward midline (crotch V)
  const crotch = point(hipMid, torsoH * 0.12, 0);
  const lKneeInner = point(hipMid, torsoH * length * 0.5, -shW * 0.10);
  const rKneeInner = point(hipMid, torsoH * length * 0.5, +shW * 0.10);
  const lAnkleInner = point(hipMid, torsoH * length * 0.95, -shW * 0.08);
  const rAnkleInner = point(hipMid, torsoH * length * 0.95, +shW * 0.08);

  // Bottom hem of each leg (4-point flat to avoid rounding)
  const lAnkleBottom = point(lHip, torsoH * length, -shW * 0.24 * ankleTaper);
  const rAnkleBottom = point(rHip, torsoH * length, +shW * 0.24 * ankleTaper);
  const lAnkleBottomInner = point(hipMid, torsoH * length, -shW * 0.06);
  const rAnkleBottomInner = point(hipMid, torsoH * length, +shW * 0.06);

  return [
    waistL, hipFlareL,
    lKneeOuter, lAnkleOuter, lAnkleBottom, lAnkleBottomInner, lAnkleInner, lKneeInner,
    crotch,
    rKneeInner, rAnkleInner, rAnkleBottomInner, rAnkleBottom, rAnkleOuter, rKneeOuter,
    hipFlareR, waistR,
  ];
}
