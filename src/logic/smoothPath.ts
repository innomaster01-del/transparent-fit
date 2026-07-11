/**
 * Build a Skia path for a polygon using quadratic curves through the midpoints
 * of each edge (Catmull-like smoothing). This is the same algorithm used in the
 * browser prototype's smoothPath, ported to Skia commands.
 *
 * Pass in a SkPath that's already been created with Skia.Path.Make().
 */

import { SkPath } from '@shopify/react-native-skia';
import { Point } from './types';

export function smoothPathToSkia(path: SkPath, pts: Point[]): void {
  if (pts.length < 3) return;

  const mid = (a: Point, b: Point): Point => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  // Start at the midpoint of the first edge so the curve closes seamlessly.
  const start = mid(pts[pts.length - 1], pts[0]);
  path.moveTo(start.x, start.y);

  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const endPt = mid(curr, next);
    path.quadTo(curr.x, curr.y, endPt.x, endPt.y);
  }

  path.close();
}
