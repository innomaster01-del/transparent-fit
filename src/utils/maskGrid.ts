/**
 * maskGrid — decode the native segmentation mask (base64 PNG with alpha)
 * into a compact AlphaGrid that refineMarks can scan.
 *
 * We downsample to ~256px wide: edge-snapping doesn't need full resolution,
 * and a small grid keeps decode + scan under a few ms.
 */

import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';
import type { AlphaGrid } from '../logic/refineMarks';

const TARGET_WIDTH = 256;

/**
 * Returns the alpha channel of the mask as a grid, or null when decoding
 * fails (caller falls back to unrefined marks — never blocks the flow).
 */
export function decodeMaskToGrid(base64Png: string): AlphaGrid | null {
  try {
    const data = Skia.Data.fromBase64(base64Png);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) return null;

    const srcW = image.width();
    const srcH = image.height();
    const scale = Math.min(1, TARGET_WIDTH / srcW);
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    // Draw scaled into an offscreen surface, then read pixels once.
    const surface = Skia.Surface.MakeOffscreen(w, h);
    if (!surface) return null;
    const canvas = surface.getCanvas();
    const paint = Skia.Paint();
    canvas.drawImageRect(
      image,
      { x: 0, y: 0, width: srcW, height: srcH },
      { x: 0, y: 0, width: w, height: h },
      paint,
    );
    const snapshot = surface.makeImageSnapshot();
    const pixels = snapshot.readPixels(0, 0, {
      width: w,
      height: h,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    });
    if (!pixels) return null;

    const rgba = pixels as Uint8Array;
    const alpha = new Uint8Array(w * h);
    for (let i = 0, j = 3; i < alpha.length; i++, j += 4) {
      alpha[i] = rgba[j];
    }
    return { data: alpha, width: w, height: h };
  } catch {
    return null;
  }
}
