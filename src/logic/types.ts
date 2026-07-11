/**
 * Core types shared across logic, native bridge, and UI.
 */

/** A 2D point in image-pixel coordinates. */
export interface Point {
  x: number;
  y: number;
}

/** Indexes into the 6-mark array. Order must be preserved across the app. */
export enum MarkIdx {
  LeftShoulder = 0,
  RightShoulder = 1,
  LeftHip = 2,
  RightHip = 3,
  LeftAnkle = 4,
  RightAnkle = 5,
}

/** Body marks — calibration points placed on the user's body. */
export type BodyMarks = [Point, Point, Point, Point, Point, Point];

/** A polygon. May be a single ring or multiple disjoint rings (e.g., pants legs). */
export type Polygon = Point[] | { multi: true; parts: Point[][] };

/** Top-level garment categories. */
export type Mode = 'shirt' | 'pants' | 'dress' | 'full';

/** Per-mode sub-style options. */
export type ShirtSub = 'tshirt' | 'long_sleeve' | 'tank' | 'vneck';
export type PantsSub = 'long' | 'shorts' | 'skirt';
export type DressSub = 'knee' | 'long' | 'mini';
export type FullSub = 'casual' | 'summer' | 'formal';
export type SubStyle = ShirtSub | PantsSub | DressSub | FullSub;

/** Body axes derived from the marks — used by every polygon builder. */
export interface BodyAxes {
  lSh: Point;
  rSh: Point;
  lHip: Point;
  rHip: Point;
  shMid: Point;
  hipMid: Point;
  /** Vertical torso length (shoulder midpoint to hip midpoint, accounts for tilt). */
  torsoH: number;
  /** Shoulder width (Euclidean). */
  shW: number;
  /** Hip width (Euclidean). */
  hipW: number;
  /** Helper that maps body-axis coords (along=down, across=right of midline) → image coords. */
  point: (origin: Point, along: number, across: number) => Point;
  lAnkle: Point;
  rAnkle: Point;
}

/** Result of segmentation: a binary or grayscale mask the same size as the source frame. */
export interface SegmentationMask {
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
  /** Raw alpha buffer — 0 (background) to 255 (person). Length = width × height. */
  data: Uint8Array;
}

/** Pose-detected body keypoints (raw output from native pose detectors). */
export interface PoseKeypoints {
  leftShoulder: Point | null;
  rightShoulder: Point | null;
  leftHip: Point | null;
  rightHip: Point | null;
  leftAnkle: Point | null;
  rightAnkle: Point | null;
  /** 0–1 confidence; below 0.4 should be treated as missing. */
  confidence: number;
}
