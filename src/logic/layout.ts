/**
 * Layout math — figures out where to draw the photo (or how to position the
 * camera frame) so the body lands inside the canvas with the head visible.
 *
 * Uses the "shoulders at 28% from top" anchor that worked best after many
 * iterations in the browser prototype.
 */

import { BodyMarks, MarkIdx } from './types';

export interface LayoutResult {
  /** Scale to apply to the source image. */
  scale: number;
  /** X offset (in canvas pixels) where the image's left edge goes. */
  baseX: number;
  /** Y offset (in canvas pixels) where the image's top edge goes. */
  baseY: number;
}

export function computeLayout(opts: {
  /** Source image width (pixels). */
  imgW: number;
  /** Source image height (pixels). */
  imgH: number;
  /** Canvas width (pixels). */
  canvasW: number;
  /** Canvas height (pixels). */
  canvasH: number;
  /** Calibration marks (in source-image coordinates). */
  marks: BodyMarks | null;
  /** Where (0..1) to anchor the shoulders vertically. 0.28 is the well-tested default. */
  shoulderAnchorY?: number;
  /** Slight overshoot of the contain-fit scale (1.20 = 20% bigger so the body fills more). */
  fitOvershoot?: number;
}): LayoutResult {
  const shoulderAnchorY = opts.shoulderAnchorY ?? 0.28;
  const fitOvershoot = opts.fitOvershoot ?? 1.20;

  const scale = Math.min(opts.canvasW / opts.imgW, opts.canvasH / opts.imgH) * fitOvershoot;

  if (!opts.marks) {
    return {
      scale,
      baseX: (opts.canvasW - opts.imgW * scale) / 2,
      baseY: (opts.canvasH - opts.imgH * scale) / 2,
    };
  }

  const lSh = opts.marks[MarkIdx.LeftShoulder];
  const rSh = opts.marks[MarkIdx.RightShoulder];
  const shoulderXmid = (lSh.x + rSh.x) / 2;
  const shoulderY = (lSh.y + rSh.y) / 2;
  const targetShoulderCanvasY = opts.canvasH * shoulderAnchorY;

  return {
    scale,
    baseX: opts.canvasW / 2 - shoulderXmid * scale,
    baseY: targetShoulderCanvasY - shoulderY * scale,
  };
}
