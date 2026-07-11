/**
 * Unit tests for the geometry layer. These exercise the polygon math without
 * any RN / native deps — they run with plain Jest.
 *
 *   npm test -- --testPathPattern=logic
 */

import { bodyAxes } from '../bodyAxes';
import { buildPolygon, forEachRing } from '../buildPolygon';
import { buildShirt } from '../buildShirt';
import { buildPants } from '../buildPants';
import { buildJumpsuit } from '../buildJumpsuit';
import { computeLayout } from '../layout';
import type { BodyMarks, Point } from '../types';

// A canonical standing pose for tests (image is 1000×1500, person centered)
const POSE: BodyMarks = [
  { x: 400, y: 350 }, // L shoulder
  { x: 600, y: 350 }, // R shoulder
  { x: 420, y: 700 }, // L hip
  { x: 580, y: 700 }, // R hip
  { x: 430, y: 1200 }, // L ankle
  { x: 570, y: 1200 }, // R ankle
];

describe('bodyAxes', () => {
  it('computes shoulder + hip midpoints', () => {
    const ax = bodyAxes(POSE);
    expect(ax.shMid).toEqual({ x: 500, y: 350 });
    expect(ax.hipMid).toEqual({ x: 500, y: 700 });
  });

  it('computes torso height as shoulder-to-hip distance', () => {
    const ax = bodyAxes(POSE);
    expect(ax.torsoH).toBeCloseTo(350, 0);
  });

  it('computes shoulder width', () => {
    const ax = bodyAxes(POSE);
    expect(ax.shW).toBe(200);
  });

  it('point() maps along/across into image coords correctly', () => {
    const ax = bodyAxes(POSE);
    // 0 along, 0 across from shoulder midpoint should return shoulder midpoint
    expect(ax.point(ax.shMid, 0, 0)).toEqual(ax.shMid);
    // Positive along means down the body axis
    const halfwayDown = ax.point(ax.shMid, ax.torsoH, 0);
    expect(halfwayDown.x).toBeCloseTo(ax.hipMid.x, 0);
    expect(halfwayDown.y).toBeCloseTo(ax.hipMid.y, 0);
  });

  it('handles slightly tilted poses by rotating the coordinate system', () => {
    const tilted: BodyMarks = [
      { x: 400, y: 340 }, // L shoulder (slightly up)
      { x: 600, y: 360 }, // R shoulder (slightly down)
      { x: 420, y: 700 },
      { x: 580, y: 700 },
      { x: 430, y: 1200 },
      { x: 570, y: 1200 },
    ];
    const ax = bodyAxes(tilted);
    // "Down" axis should still hit hip midpoint when moving torsoH along
    const down = ax.point(ax.shMid, ax.torsoH, 0);
    expect(down.x).toBeCloseTo(ax.hipMid.x, 0);
    expect(down.y).toBeCloseTo(ax.hipMid.y, 0);
  });
});

describe('buildShirt', () => {
  it('produces a polygon with ≥ 10 vertices for t-shirt', () => {
    const ax = bodyAxes(POSE);
    const pts = buildShirt(ax, 'tshirt');
    expect(pts.length).toBeGreaterThanOrEqual(10);
  });

  it('long_sleeve has cuffs further down than t-shirt', () => {
    const ax = bodyAxes(POSE);
    const tshirt = buildShirt(ax, 'tshirt');
    const longSl = buildShirt(ax, 'long_sleeve');
    const maxYTshirt = Math.max(...tshirt.map((p: Point) => p.y));
    const maxYLong = Math.max(...longSl.map((p: Point) => p.y));
    expect(maxYLong).toBeGreaterThan(maxYTshirt);
  });

  it('tank has no sleeve vertices (returns fewer points)', () => {
    const ax = bodyAxes(POSE);
    const tank = buildShirt(ax, 'tank');
    const tshirt = buildShirt(ax, 'tshirt');
    expect(tank.length).toBeLessThan(tshirt.length);
  });

  it('vneck includes a V-bottom vertex', () => {
    const ax = bodyAxes(POSE);
    const v = buildShirt(ax, 'vneck');
    // V neck adds a vBottom point between the two collar points
    // Verify by checking the shape has at least one point at the shoulder midpoint x
    // that's below the shoulder y
    const hasVPoint = v.some((p: Point) =>
      Math.abs(p.x - ax.shMid.x) < 5 && p.y > ax.shMid.y && p.y < ax.hipMid.y
    );
    expect(hasVPoint).toBe(true);
  });
});

describe('buildPants', () => {
  it('long pants extend past the ankle marker', () => {
    const ax = bodyAxes(POSE);
    const pts = buildPants(ax, 'long');
    const maxY = Math.max(...pts.map((p: Point) => p.y));
    expect(maxY).toBeGreaterThan(900);
  });

  it('shorts end well above the ankle', () => {
    const ax = bodyAxes(POSE);
    const pts = buildPants(ax, 'shorts');
    const maxY = Math.max(...pts.map((p: Point) => p.y));
    expect(maxY).toBeLessThan(900);
  });

  it('skirt has no crotch V (vertex count differs)', () => {
    const ax = bodyAxes(POSE);
    const long = buildPants(ax, 'long');
    const skirt = buildPants(ax, 'skirt');
    expect(skirt.length).toBeLessThan(long.length);
  });
});

describe('buildJumpsuit', () => {
  it('produces a single closed polygon (not multi)', () => {
    const ax = bodyAxes(POSE);
    const pts = buildJumpsuit(ax, 'casual');
    expect(Array.isArray(pts)).toBe(true);
    expect(pts.length).toBeGreaterThanOrEqual(15);
  });
});

describe('buildPolygon dispatcher', () => {
  it('dispatches to shirt builder for mode=shirt', () => {
    const poly = buildPolygon(POSE, 'shirt', 'tshirt');
    expect(Array.isArray(poly)).toBe(true);
  });

  it('dispatches to pants builder for mode=pants', () => {
    const poly = buildPolygon(POSE, 'pants', 'long');
    expect(Array.isArray(poly)).toBe(true);
  });

  it('dispatches to dress builder for mode=dress', () => {
    const poly = buildPolygon(POSE, 'dress', 'knee');
    expect(Array.isArray(poly)).toBe(true);
  });

  it('dispatches to jumpsuit builder for mode=full', () => {
    const poly = buildPolygon(POSE, 'full', 'casual');
    expect(Array.isArray(poly)).toBe(true);
  });
});

describe('forEachRing', () => {
  it('iterates a single-ring polygon once', () => {
    const poly = buildPolygon(POSE, 'shirt', 'tshirt');
    let count = 0;
    forEachRing(poly, () => count++);
    expect(count).toBe(1);
  });
});

describe('computeLayout', () => {
  it('returns a contain-fit scale when no marks provided', () => {
    const l = computeLayout({
      imgW: 1000, imgH: 1500,
      canvasW: 400, canvasH: 600,
      marks: null,
    });
    // 400/1000 = 0.4, 600/1500 = 0.4 → 0.4 × 1.2 overshoot = 0.48
    expect(l.scale).toBeCloseTo(0.48, 2);
  });

  it('anchors shoulders at the 28% line when marks provided', () => {
    const l = computeLayout({
      imgW: 1000, imgH: 1500,
      canvasW: 400, canvasH: 600,
      marks: POSE,
    });
    // shoulders at y=350 in image, scale ~0.48, target canvas y = 600*0.28 = 168
    // shoulderY * scale + baseY should equal 168
    const shoulderImgY = 350;
    const computedShoulderCanvasY = shoulderImgY * l.scale + l.baseY;
    expect(computedShoulderCanvasY).toBeCloseTo(168, 0);
  });
});
