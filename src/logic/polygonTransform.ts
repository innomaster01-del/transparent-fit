/**
 * Polygon coordinate helpers.
 */

import type { Polygon, Point } from './types';
import type { LayoutResult } from './layout';

/** Map a single point through a layout transform (image px → canvas px). */
export function pointToCanvas(p: Point, layout: LayoutResult): Point {
  return {
    x: p.x * layout.scale + layout.baseX,
    y: p.y * layout.scale + layout.baseY,
  };
}

/** Transform every vertex of a polygon through a layout transform. */
export function transformPolygon(poly: Polygon, layout: LayoutResult): Polygon {
  const map = (p: Point) => pointToCanvas(p, layout);
  if (Array.isArray(poly)) {
    return poly.map(map);
  }
  return { multi: true, parts: poly.parts.map(part => part.map(map)) };
}
