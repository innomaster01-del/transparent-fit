# T3.3 · Snapshot Capture

**Phase:** 3 · **Estimate:** 1.5 days

## Goal

When user taps the capture button in Live Try-On, save a composite image
(camera frame + outline overlay) to the photo library.

## Steps

1. On capture tap:
   a. `camera.takePhoto({ qualityPrioritization: 'quality' })`
   b. Use Skia offscreen surface: draw photo → segment → draw outline
   c. Encode to PNG: `surface.makeImageSnapshot().encodeToBase64('png')`
   d. Write to `RNFS.CachesDirectoryPath` as `tryon-{timestamp}.png`
   e. `CameraRoll.save(filePath, { type: 'photo', album: 'Transparent Fit' })`
   f. Navigate to SnapshotScreen with `{ imageUri: filePath }`
2. Show a flash animation (white overlay 0→1→0 over 200ms)
3. Haptic feedback on capture
4. Disable the capture button while compositing to prevent double-fires

## Acceptance

- [ ] Captured image includes the outline correctly composited
- [ ] Image saved to "Transparent Fit" album in Photos / Gallery
- [ ] Capture happens within 500ms on iPhone 13, 800ms on Pixel 6
- [ ] No "broken image" outputs (verified by 20 captures in a row)
