# T4.3 · Performance Pass

**Phase:** 4 · **Estimate:** 2 days

## Goal

Hit the performance budgets from PRD § 11.

## Targets

- Cold start < 2s on iPhone 13 / Pixel 6
- Live try-on ≥ 30 fps on iPhone 12+, ≥ 24 fps on mid-tier Android
- Memory < 250MB during live try-on
- App binary < 50MB

## Investigations to do

1. **Cold start:** profile with Xcode Instruments / Android Profiler. Defer
   any heavy imports (`recharts` etc. — there are none here, but verify)
2. **FPS:** use Reanimated's built-in FPS overlay; React DevTools Profiler for
   wasted renders. Memoize aggressively
3. **Memory:** look for retained Skia images, unreleased camera frames. Use
   `useEffect` cleanup to release references
4. **Binary size:** check Hermes is enabled; verify only needed Skia modules
   ship (Skia is the biggest dep — consider tree-shaking)

## Acceptance

- [ ] All four budgets met on the target devices
- [ ] No FPS drops below the target under 30s of continuous use
