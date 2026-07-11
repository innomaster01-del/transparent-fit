/**
 * Tests for the smart-detection upgrades:
 *  - refineMarks: snapping joints to a synthetic body silhouette
 *  - smoothing: jitter suppression vs. movement responsiveness
 */

import { refineMarks, scaleMarks, scanToEdge, AlphaGrid } from '../refineMarks';
import { PointSmoother, KeypointSetSmoother } from '../smoothing';

/**
 * Build a synthetic "person" mask: a torso rectangle with legs, on a
 * 100x200 grid. Body spans x=[30..70] at shoulder row, x=[35..65] at hips,
 * feet end at y=180.
 */
function syntheticBody(): AlphaGrid {
  const width = 100, height = 200;
  const data = new Uint8Array(width * height);
  const inBody = (x: number, y: number): boolean => {
    if (y >= 40 && y < 100) return x >= 30 && x <= 70;          // torso
    if (y >= 100 && y < 180) {
      return (x >= 35 && x <= 48) || (x >= 52 && x <= 65);      // two legs
    }
    return false;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = inBody(x, y) ? 255 : 0;
    }
  }
  return { data, width, height };
}

describe('scanToEdge', () => {
  const g = syntheticBody();

  it('finds the left torso edge from the centreline', () => {
    const edge = scanToEdge(g, 50, 60, -1, 40);
    expect(edge).toBe(30);
  });

  it('finds the right torso edge from the centreline', () => {
    const edge = scanToEdge(g, 50, 60, 1, 40);
    expect(edge).toBe(70);
  });

  it('returns null when the start point is off the body', () => {
    expect(scanToEdge(g, 5, 60, 1, 40)).toBeNull();
  });
});

describe('refineMarks', () => {
  const g = syntheticBody();

  it('moves shoulder joints outward to the silhouette edges', () => {
    // Joints sit INSIDE the body (like real pose detectors return)
    const input = {
      leftShoulder: { x: 38, y: 50 },
      rightShoulder: { x: 62, y: 50 },
      leftHip: { x: 42, y: 95 },
      rightHip: { x: 58, y: 95 },
      leftAnkle: { x: 42, y: 150 },
      rightAnkle: { x: 58, y: 150 },
    };
    const out = refineMarks(g, input);
    // Shoulders should snap close to x=30 / x=70 (blend 0.9)
    expect(out.leftShoulder!.x).toBeLessThan(33);
    expect(out.rightShoulder!.x).toBeGreaterThan(67);
    // y never changes for shoulders
    expect(out.leftShoulder!.y).toBe(50);
  });

  it('never narrows marks inward (edge inside joint is rejected)', () => {
    const input = {
      leftShoulder: { x: 25, y: 50 },  // already OUTSIDE the body edge (30)
      rightShoulder: { x: 75, y: 50 },
      leftHip: null, rightHip: null, leftAnkle: null, rightAnkle: null,
    };
    const out = refineMarks(g, input);
    // Scan starts at midX=50, finds edge 30 — that's INWARD of 25 → reject
    expect(out.leftShoulder!.x).toBe(25);
    expect(out.rightShoulder!.x).toBe(75);
  });

  it('snaps ankles to just above the feet bottom', () => {
    const input = {
      leftShoulder: null, rightShoulder: null,
      leftHip: null, rightHip: null,
      leftAnkle: { x: 42, y: 150 },
      rightAnkle: { x: 58, y: 150 },
    };
    const out = refineMarks(g, input);
    // Feet end at y=179; ankle = 179 - 200*0.025 = 174
    expect(out.leftAnkle!.y).toBeGreaterThan(170);
    expect(out.leftAnkle!.y).toBeLessThan(178);
  });

  it('passes marks through unchanged when mask has no coverage', () => {
    const empty: AlphaGrid = { data: new Uint8Array(100 * 200), width: 100, height: 200 };
    const input = {
      leftShoulder: { x: 38, y: 50 },
      rightShoulder: { x: 62, y: 50 },
      leftHip: { x: 42, y: 95 }, rightHip: { x: 58, y: 95 },
      leftAnkle: { x: 42, y: 150 }, rightAnkle: { x: 58, y: 150 },
    };
    const out = refineMarks(empty, input);
    expect(out.leftShoulder).toEqual(input.leftShoulder);
    expect(out.leftAnkle).toEqual(input.leftAnkle);
  });
});

describe('scaleMarks', () => {
  it('scales between coordinate spaces and preserves nulls', () => {
    const out = scaleMarks(
      { leftShoulder: { x: 10, y: 20 }, rightShoulder: null,
        leftHip: null, rightHip: null, leftAnkle: null, rightAnkle: null },
      2, 0.5,
    );
    expect(out.leftShoulder).toEqual({ x: 20, y: 10 });
    expect(out.rightShoulder).toBeNull();
  });
});

describe('PointSmoother', () => {
  it('suppresses jitter when nearly still', () => {
    const s = new PointSmoother();
    s.next({ x: 100, y: 100 });
    // 1px jitter — output should barely move
    const out = s.next({ x: 101, y: 100 });
    expect(Math.abs(out.x - 100)).toBeLessThan(0.2);
  });

  it('follows fast movement responsively', () => {
    const s = new PointSmoother();
    s.next({ x: 100, y: 100 });
    // 40px jump — output should cover most of the distance
    const out = s.next({ x: 140, y: 100 });
    expect(out.x).toBeGreaterThan(125);
  });

  it('converges to the target over repeated samples', () => {
    const s = new PointSmoother();
    s.next({ x: 0, y: 0 });
    let out = { x: 0, y: 0 };
    for (let i = 0; i < 60; i++) out = s.next({ x: 10, y: 10 });
    expect(out.x).toBeGreaterThan(9.5);
    expect(out.y).toBeGreaterThan(9.5);
  });
});

describe('KeypointSetSmoother', () => {
  it('tracks joints independently and tolerates nulls', () => {
    const s = new KeypointSetSmoother<'a' | 'b'>();
    expect(s.next('a', null)).toBeNull();
    const p1 = s.next('a', { x: 10, y: 10 });
    expect(p1).toEqual({ x: 10, y: 10 });
    const pb = s.next('b', { x: 99, y: 99 });
    expect(pb).toEqual({ x: 99, y: 99 });
  });
});
