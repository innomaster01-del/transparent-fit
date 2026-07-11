# T2.2 · Photo Capture Screen

**Phase:** 2 · **Estimate:** 1.5 days

## Goal

`src/screens/PhotoCaptureScreen.tsx` — already implemented. Needs hardening
around camera permission and library picker edge cases.

## Steps

1. On first launch, request camera permission *after* the user taps "Start" on
   Welcome (not on mount of this screen) — currently it triggers on mount which
   surprises users
2. If permission denied, auto-switch into "upload only" mode and show the picker
3. Validate selected photo: must be at least 600×800 px; show a friendly error
   and re-prompt if smaller
4. Show a 3-2-1 countdown when in self-camera mode to give the user time to pose
5. Save the captured photo to a tmp file rather than passing base64 around
   (base64 in state for a 4MB photo is ~5MB of string memory)

## Acceptance

- [ ] Permission denial leads to a usable upload-only flow
- [ ] Picker accepts JPEG, PNG, HEIC
- [ ] Photos < 600×800 rejected with a clear message
- [ ] Memory usage stays under 100MB during this screen
