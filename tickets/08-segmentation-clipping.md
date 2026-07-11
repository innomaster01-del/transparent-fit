# T3.2 · Segmentation Mask Clipping

**Phase:** 3 · **Estimate:** 2 days

## Goal

Make the outline conform to the body silhouette — i.e., clip the polygon to
the person mask so the outline disappears where it crosses background.

## Approach

In Skia, this is straightforward:
1. Load mask image: `Skia.Image.MakeImageFromEncoded(base64Mask)`
2. Draw the outline path
3. Apply a `BlendMode.DstIn` with the mask image as the source

The `GarmentOutline` component currently doesn't do this — it draws unclipped.
This ticket adds the mask layer.

## Steps

1. Extend `GarmentOutline` props to accept `bodyMaskBase64`, `bodyMaskWidth`,
   `bodyMaskHeight`
2. When mask is present, wrap the outline `<Path>` in a `<Group blendMode="srcOver">`
   with the mask Image applied via `<Mask>` element
3. Account for mask resolution being lower than canvas — upscale with bilinear filter
4. Cache decoded Skia images to avoid re-decoding the same mask
5. Test with a known photo + known mask — outline should "wrap" the silhouette

## Acceptance

- [ ] Outline visible only where person mask alpha > 0.3
- [ ] No visible jitter from frame to frame (smooth temporal coherence)
- [ ] FPS doesn't drop > 5% vs unclipped baseline
