# T2.3 · Mark Calibration Screen

**Phase:** 2 · **Estimate:** 2 days

## Goal

`src/screens/MarkPointsScreen.tsx` — already implemented with PanResponder-based
draggable markers and auto pose-detection. Needs refinement and edge-case
handling.

## Steps

1. Replace the per-marker `PanResponder` with `react-native-gesture-handler`
   `PanGestureHandler` for smoother drags
2. Add a "Reset to auto-detected" button so the user can revert manual changes
3. Snap markers to nearest 5px on release (subtle haptic on snap)
4. Constrain markers to within the photo bounds (clamp on every drag)
5. Validate before allowing "Start Try-On":
   - Shoulders must be above hips (in image coords)
   - Hip width > 30% of shoulder width
   - No marker overlapping another within 20px

## Acceptance

- [ ] Drag is smooth at 60 fps even on a 3-year-old phone
- [ ] Markers can't be dragged off-screen
- [ ] Invalid configurations show inline help and disable the CTA
- [ ] Polygon preview updates without flicker as marks move
