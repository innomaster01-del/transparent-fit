# T3.1 · Live Try-On Screen

**Phase:** 3 · **Estimate:** 3 days

## Goal

`src/screens/LiveTryOnScreen.tsx` — already implemented as a skeleton. Now wire
in the live-segmentation pipeline from T1.3 and the mask-clipping logic from T3.2.

## Steps

1. Mount the camera with `useLiveSegmentation` hook
2. On each new mask, re-compute the displayed polygon position based on the
   *current* pose (running a fast pose detection on each frame OR estimating
   from segmentation centroid)
3. Render the mask as a Skia layer that clips the outline path (so the garment
   outline only appears over the person, not on the background)
4. Mode toggle changes outline shape immediately, no reload
5. Pause button truly stops camera + segmentation (drops CPU)
6. Flip camera button switches between front and back (state already in store)

## Acceptance

- [ ] Outline conforms to body silhouette, not just static-overlay
- [ ] All 4 modes × all sub-styles render correctly
- [ ] Mode switch under 100ms
- [ ] Pause → no frames processed (verify with profiler)
- [ ] Flip camera works mid-session without rebooting the segmentation pipeline
