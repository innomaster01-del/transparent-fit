# T1.3 · Camera Frame Pipeline

**Phase:** 1 · **Estimate:** 2 days

## Goal

Stream frames from `react-native-vision-camera` through the native segmenter at
≥ 24 fps without dropping the UI thread.

## Approach

Vision Camera v4 exposes Frame Processors that run on a dedicated worklet
thread. For MVP we don't need a full frame processor — we can:
1. Capture a still photo every N ms (`Camera.takeSnapshot()` is fast, ~30ms)
2. Pass it to `segmentPerson({ quality: 'fast' })`
3. Render the mask + outline via Skia
4. Loop

This avoids the complexity of writing a custom Frame Processor plugin in Swift /
Kotlin. Acceptable for v1; revisit if frame rate is the bottleneck (it usually
isn't — segmentation latency dominates).

## Steps

1. Wrap the snapshot → segment → render loop in a custom hook
   `useLiveSegmentation({ camera, fps: 24 })`
2. Use `requestAnimationFrame` or `setInterval(1000/fps)` to throttle
3. Skip frames if a segmentation is still in-flight (don't queue)
4. Expose `{ maskBase64, isProcessing, lastFrameMs }`

## Acceptance

- [ ] iPhone 12 holds 24 fps on `quality: 'fast'`
- [ ] Pixel 6 holds 18 fps on `quality: 'fast'`
- [ ] No memory growth over a 5-minute session
- [ ] Pausing the camera (T3.1 control) stops all segmentation work
