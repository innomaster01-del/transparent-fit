/**
 * Shirt polygon — clean T-shirt / long-sleeve / tank / V-neck silhouette.
 *
 * Design rules (lessons from the browser prototype iterations):
 *   - Shoulder line extends ~14% past the shoulder mark on each side (visible cap)
 *   - Hem is WIDER than the shoulders (relaxed t-shirt, not hourglass)
 *   - Hem has 4 collinear points so smoothPath draws a flat bottom edge
 *   - Sleeves are sized to survive anti-aliasing (sleeveOuter ≥ 0.26)
 */

import { BodyAxes, Point, ShirtSub } from './types';

export function buildShirt(ax: BodyAxes, sub: ShirtSub): Point[] {
  const { lSh, rSh, hipMid, shMid, shW, torsoH, point } = ax;

  let sleeveLen: number;
  let sleeveOuter: number;
  let vDepth: number;
  let neckline: 'crew' | 'v';

  switch (sub) {
    case 'long_sleeve':
      sleeveLen = 1.15; sleeveOuter = 0.12; neckline = 'crew'; vDepth = 0.16;
      break;
    case 'tank':
      sleeveLen = 0; sleeveOuter = 0; neckline = 'crew'; vDepth = 0.16;
      break;
    case 'vneck':
      sleeveLen = 0.32; sleeveOuter = 0.28; neckline = 'v'; vDepth = 0.30;
      break;
    case 'tshirt':
    default:
      sleeveLen = 0.32; sleeveOuter = 0.28; neckline = 'crew'; vDepth = 0.16;
      break;
  }

  const collarL = point(lSh, -torsoH * 0.04, +shW * 0.14);
  const collarR = point(rSh, -torsoH * 0.04, -shW * 0.14);
  const vBottom = point(shMid, torsoH * vDepth, 0);

  const shoulderExtL = point(lSh, torsoH * 0.02, -shW * 0.14);
  const shoulderExtR = point(rSh, torsoH * 0.02, +shW * 0.14);

  const hemHalfW = 0.52;
  const hemL    = point(hipMid, torsoH * 0.10, -shW * hemHalfW);
  const hemMidL = point(hipMid, torsoH * 0.10, -shW * hemHalfW * 0.45);
  const hemMidR = point(hipMid, torsoH * 0.10, +shW * hemHalfW * 0.45);
  const hemR    = point(hipMid, torsoH * 0.10, +shW * hemHalfW);

  // Tank — no sleeves
  if (sub === 'tank') {
    const strapL = point(lSh, 0, +shW * 0.06);
    const strapR = point(rSh, 0, -shW * 0.06);
    const armL = point(lSh, torsoH * 0.22, +shW * 0.10);
    const armR = point(rSh, torsoH * 0.22, -shW * 0.10);
    if (neckline === 'v') {
      return [collarL, vBottom, collarR, strapR, armR, hemR, hemMidR, hemMidL, hemL, armL, strapL];
    }
    return [collarL, collarR, strapR, armR, hemR, hemMidR, hemMidL, hemL, armL, strapL];
  }

  // Sleeves
  const cuffOuterL = point(lSh, torsoH * sleeveLen, -shW * sleeveOuter);
  const cuffOuterR = point(rSh, torsoH * sleeveLen, +shW * sleeveOuter);
  const cuffInnerL = point(lSh, torsoH * sleeveLen, +shW * 0.04);
  const cuffInnerR = point(rSh, torsoH * sleeveLen, -shW * 0.04);
  const underL = point(lSh, torsoH * 0.24, +shW * 0.04);
  const underR = point(rSh, torsoH * 0.24, -shW * 0.04);

  const neckPath = neckline === 'v'
    ? [collarL, vBottom, collarR]
    : [collarL, collarR];

  return [
    ...neckPath,
    shoulderExtR, cuffOuterR, cuffInnerR, underR,
    hemR, hemMidR, hemMidL, hemL,
    underL, cuffInnerL, cuffOuterL, shoulderExtL,
  ];
}
