/**
 * Main polygon builder — routes by mode to the right shape function.
 */

import { bodyAxes } from './bodyAxes';
import { buildDress } from './buildDress';
import { buildJumpsuit } from './buildJumpsuit';
import { buildPants } from './buildPants';
import { buildShirt } from './buildShirt';
import {
  BodyMarks, DressSub, FullSub, Mode, PantsSub, Point, Polygon, ShirtSub, SubStyle,
} from './types';

export function buildPolygon(
  marks: BodyMarks,
  mode: Mode,
  subStyle: SubStyle,
): Polygon {
  const ax = bodyAxes(marks);
  switch (mode) {
    case 'shirt':
      return buildShirt(ax, subStyle as ShirtSub);
    case 'pants':
      return buildPants(ax, subStyle as PantsSub);
    case 'dress':
      return buildDress(ax, subStyle as DressSub);
    case 'full':
      return buildJumpsuit(ax, subStyle as FullSub);
  }
}

/** Iterate over a Polygon's ring(s) — handles single and multi shapes uniformly. */
export function forEachRing(poly: Polygon, fn: (pts: Point[]) => void): void {
  if (Array.isArray(poly)) {
    if (poly.length >= 3) fn(poly);
  } else if (poly && poly.multi && Array.isArray(poly.parts)) {
    poly.parts.forEach(p => { if (p.length >= 3) fn(p); });
  }
}
