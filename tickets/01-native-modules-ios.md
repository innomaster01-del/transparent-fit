# T1.1 · iOS Native Modules

**Phase:** 1 (Foundation) · **Estimate:** 1.5 days · **Owner:** iOS / RN dev

## Goal

Bring up `PersonSegmenter` and `PoseDetector` as React Native native modules on
iOS, callable from JS via `import { segmentPerson, detectPose } from 'src/native'`.

## Files

The Swift + ObjC source already exists in `ios/TransparentFit/`. This ticket
covers wiring them into the Xcode project and verifying they're reachable from JS.

## Steps

1. Generate the RN shell: `npx react-native init TransparentFit --version 0.74.5`
2. Drag `PersonSegmenter.swift`, `PersonSegmenter.m`, `PoseDetector.swift`,
   `PoseDetector.m` into the Xcode project (Target Membership: TransparentFit)
3. Xcode will offer to create a bridging header → say **Yes**, accept the default
   `TransparentFit-Bridging-Header.h`
4. Merge `ios/TransparentFit/Info.plist.snippet` into `Info.plist`
5. Set the iOS Deployment Target to **14.0** (Build Settings → iOS Deployment Target)
   — note: VNGeneratePersonSegmentationRequest requires iOS 15+, so the modules
   will return errors on iOS 14. Guard with `@available(iOS 15, *)` if needed.
6. `cd ios && pod install`
7. Build & run on a real device (Vision is restricted in the simulator)
8. Add a temporary smoke-test button on `WelcomeScreen` that calls
   `segmentPerson` with a known-good base64 image and logs the result dimensions
9. Remove the smoke-test button before merging

## Acceptance

- [ ] App builds on iOS 14+ targets without warnings
- [ ] `NativeModules.PersonSegmenter` is non-null at runtime
- [ ] Smoke test prints `{ width: N, height: M, base64Mask: '...' }` on iOS 15+
- [ ] Smoke test fails cleanly with a clear error on iOS 14
- [ ] No crash on first launch (permissions prompt appears)

## Notes

- The mask is returned as a PNG with brightness mapped to alpha. JS can render
  it directly into Skia via `Skia.Image.MakeImageFromEncoded(base64)`
- Use `quality: 'fast'` for live frames, `'accurate'` for one-shot calibration
- The Vision request runs on the Neural Engine when available — negligible
  battery cost per frame
