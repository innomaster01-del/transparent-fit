/**
 * refineMarks — makes auto-detection "cut exactly along the person".
 *
 * Problem: pose detectors (ML Kit / Apple Vision) return JOINT positions,
 * which sit INSIDE the body (the shoulder joint is ~4-6cm inward from the
 * visible shoulder edge). Building the garment polygon from joints makes
 * the outline hug too tight and miss the true silhouette.
 *
 * Fix: we have a person-segmentation mask. For each joint we scan the mask
 * to find the actual body EDGE and snap the mark there:
 *
 *   - Shoulders: scan the shoulder row outward from the torso centreline
 *     until the mask ends → that's the visible shoulder edge.
 *   - Hips: same at hip height.
 *   - Ankles: scan the bottom of the mask to find where the feet end.
 *
 * All functions are pure (no RN imports) so they run in unit tests.
 */

import { Point } from './types';

export interface AlphaGrid {
  /** One byte per pixel: 0 = background, 255 = person. */
  data: Uint8Array;
  width: number;
  height: number;
}

export interface RefineInput {
  leftShoulder: Point | null;
  rightShoulder: Point | null;
  leftHip: Point | null;
  rightHip: Point | null;
  leftAnkle: Point | null;
  rightAnkle: Point | null;
}

const ALPHA_THRESHOLD = 96;   // mask value considered "person"
const NOISE_RUN = 3;          // background pixels in a row = real edge (skips noise)

/** Sample the grid with clamping. */
function at(g: AlphaGrid, x: number, y: number): number {
  const xi = Math.min(g.width - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(g.height - 1, Math.max(0, Math.round(y)));
  return g.data[yi * g.width + xi];
}

/**
 * From (startX, y), walk in `dir` (+1 right / -1 left) until we exit the
 * person mask (NOISE_RUN consecutive background pixels). Returns the last
 * person-pixel x, or null if startX isn't on the person at all.
 */
export function scanToEdge(
  g: AlphaGrid,
  startX: number,
  y: number,
  dir: 1 | -1,
  maxDist: number,
): number | null {
  if (at(g, startX, y) < ALPHA_THRESHOLD) return null;
  let lastPerson = startX;
  let bgRun = 0;
  for (let d = 1; d <= maxDist; d++) {
    const x = startX + dir * d;
    if (x < 0 || x >= g.width) break;
    if (at(g, x, y) >= ALPHA_THRESHOLD) {
      lastPerson = x;
      bgRun = 0;
    } else {
      bgRun++;
      if (bgRun >= NOISE_RUN) break;
    }
  }
  return lastPerson;
}

/**
 * Snap a shoulder/hip pair to the mask edges at their row.
 * Scans outward from the pair's midpoint. Averages over a few rows for
 * robustness against mask noise. Returns new [left, right] or the originals
 * when the mask doesn't cover the row (e.g. segmentation failed).
 */
function snapPairToEdges(
  g: AlphaGrid,
  left: Point,
  right: Point,
  /** How far past the joint the edge may be, as fraction of image width. */
  maxReachFrac = 0.22,
  /** Blend: 1 = fully at edge, 0 = stay at joint. Shoulders want ~0.9. */
  blend = 0.9,
): [Point, Point] {
  const midX = (left.x + right.x) / 2;
  const maxDist = g.width * maxReachFrac + Math.abs(right.x - left.x) / 2;
  const rows = [-2, 0, 2]; // sample 3 nearby rows, average

  function snapOne(p: Point, dir: 1 | -1): Point {
    const edges: number[] = [];
    for (const dy of rows) {
      const e = scanToEdge(g, midX, p.y + dy, dir, maxDist);
      if (e !== null) edges.push(e);
    }
    if (!edges.length) return p;
    const edgeX = edges.reduce((a, b) => a + b, 0) / edges.length;
    // Only accept an edge that is OUTWARD of the joint (we widen, never
    // narrow — a narrower edge means the scan row missed, e.g. raised arm gap).
    const isOutward = dir === -1 ? edgeX <= p.x : edgeX >= p.x;
    if (!isOutward) return p;
    return { x: p.x + (edgeX - p.x) * blend, y: p.y };
  }

  // left mark = smaller x → scan left (-1); right mark → scan right (+1)
  const [lp, rp] = left.x <= right.x ? [left, right] : [right, left];
  const newL = snapOne(lp, -1);
  const newR = snapOne(rp, 1);
  return left.x <= right.x ? [newL, newR] : [newR, newL];
}

/**
 * Find the lowest row of the mask beneath a starting point (feet bottom),
 * scanning a narrow column around x.
 */
function snapAnkleToBottom(g: AlphaGrid, p: Point): Point {
  const colHalf = Math.max(2, Math.round(g.width * 0.02));
  let lowest = -1;
  for (let y = g.height - 1; y > p.y; y--) {
    let hit = false;
    for (let x = p.x - colHalf; x <= p.x + colHalf; x++) {
      if (at(g, x, y) >= ALPHA_THRESHOLD) { hit = true; break; }
    }
    if (hit) { lowest = y; break; }
  }
  if (lowest < 0) return p;
  // Ankle sits slightly above the foot bottom (~2.5% of image height)
  return { x: p.x, y: lowest - g.height * 0.025 };
}

/**
 * Refine all detected marks against the segmentation mask.
 * Marks are in MASK-grid coordinates (caller scales in/out).
 * Any null / unrefinable mark passes through unchanged.
 */
export function refineMarks(g: AlphaGrid, input: RefineInput): RefineInput {
  const out: RefineInput = { ...input };

  if (input.leftShoulder && input.rightShoulder) {
    const [l, r] = snapPairToEdges(g, input.leftShoulder, input.rightShoulder, 0.22, 0.9);
    out.leftShoulder = l;
    out.rightShoulder = r;
  }
  if (input.leftHip && input.rightHip) {
    // Hips: smaller reach, gentler blend (hip joints are closer to the edge)
    const [l, r] = snapPairToEdges(g, input.leftHip, input.rightHip, 0.16, 0.75);
    out.leftHip = l;
    out.rightHip = r;
  }
  if (input.leftAnkle) out.leftAnkle = snapAnkleToBottom(g, input.leftAnkle);
  if (input.rightAnkle) out.rightAnkle = snapAnkleToBottom(g, input.rightAnkle);

  return out;
}

/** Scale a RefineInput between coordinate spaces (image px ↔ mask grid). */
export function scaleMarks(input: RefineInput, sx: number, sy: number): RefineInput {
  const s = (p: Point | null): Point | null => (p ? { x: p.x * sx, y: p.y * sy } : null);
  return {
    leftShoulder: s(input.leftShoulder),
    rightShoulder: s(input.rightShoulder),
    leftHip: s(input.leftHip),
    rightHip: s(input.rightHip),
    leftAnkle: s(input.leftAnkle),
    rightAnkle: s(input.rightAnkle),
  };
}
