/**
 * GarmentOutline — renders the garment polygon with:
 *   1. Checkered "transparency" fill (like the reference UI)
 *   2. White outline stroke with optional glow
 *
 * The checker pattern is a custom SkSL shader that runs fully on the GPU —
 * no texture files, no bitmaps, zero overhead.
 */

import React, { useMemo } from 'react';
import {
  Canvas,
  Path,
  Group,
  BlurMask,
  Shader,
  Skia,
  Image as SkiaImage,
} from '@shopify/react-native-skia';
import { Point, Polygon } from '../logic/types';
import { forEachRing } from '../logic/buildPolygon';
import { smoothPathToSkia } from '../logic/smoothPath';
import { colors } from '../theme';

// ─── SkSL shader ─────────────────────────────────────────────────────────────
// Draws a checkered board pattern in the garment's fill area.
// Matches the reference UI: alternating light/dark grey squares, semi-transparent.
const CHECKER_SKSL = `
uniform float tileSize;   // size of each square in px
uniform float alphaLight; // alpha of the lighter square
uniform float alphaDark;  // alpha of the darker square

half4 main(float2 pos) {
  float2 grid = floor(pos / tileSize);
  float isLight = mod(grid.x + grid.y, 2.0);
  // Lighter square: near-white; darker square: mid-grey
  float brightness = isLight > 0.5 ? 0.93 : 0.60;
  float alpha      = isLight > 0.5 ? alphaLight : alphaDark;
  return half4(brightness, brightness, brightness, alpha);
}
`;

// Compile once — Skia caches this on the GPU
const checkerEffect = Skia.RuntimeEffect.Make(CHECKER_SKSL);

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  polygon: Polygon | null;
  width: number;
  height: number;
  outlineColor?: string;
  thickness?: 'thin' | 'medium' | 'thick';
  showGlow?: boolean;
  /** When false, draws only the outline (no fill). Default: true. */
  showFill?: boolean;
  /** Tile size in pixels — smaller = finer grid. Default: 18. */
  tileSize?: number;
  /** 0–1 transparency of the fill. Default: 0.78. */
  fillOpacity?: number;
  /**
   * Optional person-segmentation mask (base64 PNG, alpha = person).
   * When provided, the checkered fill is clipped to the BODY silhouette —
   * the garment "cuts exactly along the person" instead of spilling onto
   * the background. Pass with maskRect mapping mask → canvas coordinates.
   */
  bodyMaskBase64?: string | null;
  /** Where the mask lands on the canvas (same transform as the photo). */
  maskRect?: { x: number; y: number; width: number; height: number };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function GarmentOutline({
  polygon,
  width,
  height,
  outlineColor = colors.outlineWhite,
  thickness = 'medium',
  showGlow = true,
  showFill = true,
  tileSize = 18,
  fillOpacity = 0.78,
  bodyMaskBase64 = null,
  maskRect,
}: Props) {
  // Build the Skia path from the polygon rings
  const path = useMemo(() => {
    if (!polygon) return null;
    const p = Skia.Path.Make();
    forEachRing(polygon, (pts: Point[]) => smoothPathToSkia(p, pts));
    return p;
  }, [polygon]);

  // Decode the body mask once per calibration (not per frame)
  const maskImage = useMemo(() => {
    if (!bodyMaskBase64) return null;
    try {
      const data = Skia.Data.fromBase64(bodyMaskBase64);
      return Skia.Image.MakeImageFromEncoded(data);
    } catch {
      return null;
    }
  }, [bodyMaskBase64]);

  const strokeWidth =
    thickness === 'thin' ? 2.0 : thickness === 'thick' ? 4.0 : 2.8;

  // Uniforms for the checker shader
  const checkerUniforms = useMemo(
    () => ({
      tileSize,
      alphaLight: fillOpacity * 0.82, // lighter squares slightly more transparent
      alphaDark: fillOpacity,
    }),
    [tileSize, fillOpacity],
  );

  if (!path) return null;

  return (
    <Canvas
      style={{ width, height, position: 'absolute', left: 0, top: 0 }}
      pointerEvents="none">
      <Group>
        {/* ── 1. Checkered fill — clipped to the body silhouette when we have a mask ── */}
        {showFill && checkerEffect && (
          <Group layer>
            <Path path={path} style="fill">
              <Shader source={checkerEffect} uniforms={checkerUniforms} />
            </Path>
            {maskImage && maskRect && (
              <SkiaImage
                image={maskImage}
                x={maskRect.x}
                y={maskRect.y}
                width={maskRect.width}
                height={maskRect.height}
                fit="fill"
                blendMode="dstIn"
              />
            )}
          </Group>
        )}

        {/* ── 2. Soft outer glow (drawn before the stroke so stroke sits on top) ── */}
        {showGlow && (
          <Path
            path={path}
            style="stroke"
            strokeWidth={strokeWidth * 3}
            color="rgba(255,255,255,0.18)">
            <BlurMask blur={8} style="normal" />
          </Path>
        )}

        {/* ── 3. Main outline stroke ── */}
        <Path
          path={path}
          style="stroke"
          strokeWidth={strokeWidth}
          color={outlineColor}
          strokeJoin="round"
          strokeCap="round"
        />
      </Group>
    </Canvas>
  );
}
