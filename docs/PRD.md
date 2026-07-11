# Transparent Fit — Product Requirements Document
**Version 1.0** · React Native (iOS + Android) · Mobile App

---

## 1. The product in one sentence

A camera app that shows a transparent **outline of a garment** (shirt, pants, dress, full outfit) overlaid on the user's body in real time, so they can see roughly what clothes from a store rack would look like on them — without trying anything on.

The garment shape is a **clean white outline** (matches the reference design). The body remains fully visible "through" the garment.

---

## 2. Why it works without AI generation

- We are **not generating** the appearance of a garment on the user
- We are showing a **stylized outline** that conforms to their body proportions
- The user sees real clothes (in a store mirror, on a hanger, etc.) **through** the outline — the brain does the matching
- This is achievable with **on-device person segmentation** (Apple Vision on iOS, ML Kit on Android) — no server, no GPU, no AI training

---

## 3. Target users

- Casual shoppers in physical stores who want to skip the dressing room
- Stylists doing virtual consultations
- Anyone who wants to "see" a different cut/fit on themselves before buying

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | React Native 0.74+ | One codebase, iOS + Android |
| **Language** | TypeScript (strict) | Type safety for the geometry math |
| **Camera** | react-native-vision-camera v4 | Frame processor lets us run segmentation each frame |
| **Drawing** | @shopify/react-native-skia | 60fps canvas-like drawing |
| **Animation** | react-native-reanimated v3 | Shared values for smooth gestures |
| **State** | Zustand | Minimal, no boilerplate |
| **Storage** | @react-native-async-storage | User preferences |
| **iOS segmentation** | `VNGeneratePersonSegmentationRequest` (Apple Vision) | Built-in, free, ~30fps, SAM2-quality |
| **Android segmentation** | ML Kit `SelfieSegmentation` | Free, fast, similar quality |
| **iOS pose** | `VNDetectHumanBodyPoseRequest` | Built-in keypoints |
| **Android pose** | ML Kit `PoseDetection` | Free, fast |

**Why not SAM2/SCHP directly:** Those are PyTorch+CUDA — they need a server. Apple Vision and ML Kit give equivalent quality for *person segmentation* specifically, on device, free, fast.

---

## 5. App flow (3 steps, matches reference Image 1)

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   STEP 1     │      │   STEP 2     │      │   STEP 3     │
│              │ ───► │              │ ───► │              │
│ Take photo   │      │ Choose mode  │      │ Live try-on  │
│ (calibration)│      │ + sub-style  │      │ (white       │
│              │      │              │      │  outline)    │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 6. Screen-by-screen specification

### Screen 1 — Welcome
**Purpose:** Introduce the concept, request camera permission, route to next screen.

**Elements:**
- App logo / wordmark "Transparent Fit"
- Tagline: "See any clothes on you using just the camera"
- 3 feature pills (with icons): "Scan any clothes in real life" · "Your body stays the same" · "Real clothes appear on you"
- Primary CTA: **"Start →"** (purple gradient)
- Secondary CTA: **"Upload photo instead"** (gray, for users without camera access)

**Behavior:**
- Request camera + photo library permission on Start
- If granted → Screen 2 (Photo Capture)
- If denied → fallback to Screen 2 with photo upload only

---

### Screen 2 — Photo Capture (Step 1)
**Purpose:** Capture or pick a full-body photo for body calibration.

**Elements:**
- Top bar: back arrow (←) + title "STEP 1 · Take a full body photo" + help (?)
- Live camera preview (or last captured photo if retaking)
- Bottom: capture button (large white circle), and "Choose from library" link
- Helper text overlay (semi-transparent): "Stand 2m back, full body in frame, arms slightly away from body"

**Behavior:**
- Tap capture → freeze frame → ask confirm/retake
- Tap "Choose from library" → photo picker → confirm
- On confirm → run **pose detection** on the photo to find shoulders/hips/ankles automatically → Screen 3

---

### Screen 3 — Mark Calibration (Step 2)
**Purpose:** Show auto-detected body keypoints, let user nudge them if wrong, then choose mode.

**Elements:**
- Top bar: back arrow + title "STEP 2 · Confirm body points"
- Photo with 6 draggable markers: L shoulder, R shoulder, L hip, R hip, L ankle, R ankle (auto-placed from pose detection)
- Mode strip (horizontal scroll): Shirt · Pants · Dress · Full Outfit
- Sub-style chips (depend on mode): T-shirt / Long sleeve / Tank / V-neck etc.
- Garment polygon preview drawn live on the photo as markers move
- Bottom CTA: **"Start Try-On →"**

**Behavior:**
- Each marker is draggable with haptic snap
- Garment polygon redraws as marks move
- Selecting a different mode re-renders the polygon preview
- Continue → Screen 4

---

### Screen 4 — Live Try-On (Step 3) — *the headline screen*
**Purpose:** Show the garment outline on the user via live camera or static photo.

**Layout (matches reference Image 2):**
```
┌─────────────────────────────────────┐
│  ◀         SHIRT MODE            ✕  │ ← top bar
│           Point at a shirt          │
├─────────────────────────────────────┤
│                                     │
│        ╔════════════╗               │
│        ║   WHITE    ║      ┌────┐   │
│        ║  OUTLINE   ║      │ 👕 │← │
│        ║  OF SHIRT  ║      │ 👖 │   │ ← mode pill
│        ║  ON BODY   ║      │ 👗 │   │
│        ╚════════════╝      │ 👔 │   │
│                            └────┘   │
│  ┌──┐                               │
│  │🔄│                               │
│  │⏸│                                │
│  └──┘                               │
│                                     │
│             ⊙ capture               │
└─────────────────────────────────────┘
```

**Elements:**
- Top bar: back (←, to Screen 3) · title (mode + Hebrew/English hint) · close (✕, to Welcome)
- **Right side (vertical pill column):** 4 mode buttons — Shirt · Pants · Dress · Full Outfit (selected one highlighted in purple gradient)
- **Left side (small icons, bottom):** Flip camera · Pause · Snapshot history
- **Bottom center:** Big capture button (74×74, white core with subtle purple gradient highlight, white ring)
- **Canvas (live):**
  - Camera feed OR static photo (if camera unavailable)
  - White outline of garment polygon, drawn each frame, conformed to body using segmentation mask
  - Optional subtle white glow around the outline

**Behavior:**
- Live mode (camera): every frame → segment body → compute polygon from latest pose keypoints → draw outline
- Static mode (no camera): use the calibrated marks from Screen 3 → outline doesn't update with pose
- Tap mode button → outline changes shape immediately (no reload)
- Tap capture → snapshot saved to photo library + brief flash
- Tap pause → freeze the outline drawing (camera still runs)

---

### Screen 5 — Snapshot Result
**Purpose:** Review the saved snapshot, share it, or take another.

**Elements:**
- Full-screen captured image
- Top: back arrow · "Save" · "Share"
- Bottom: "Take another"

---

## 7. The 4 modes — geometry rules

Each mode produces a polygon (or set of polygons) from 6 body keypoints. The polygon is then constrained to the body silhouette by the segmentation mask, and only the **outline** is drawn (no fill).

| Mode | Polygon | Sub-styles |
|---|---|---|
| **Shirt** | From shoulders to hips, includes sleeves | T-shirt / Long sleeve / Tank / V-neck |
| **Pants** | From hips to ankles, two legs with crotch V | Long / Shorts / Skirt |
| **Dress** | From shoulders down past hips to mid-thigh or knee | Knee / Long / Mini |
| **Full Outfit** | One continuous polygon collar-to-ankle (jumpsuit/catsuit shape — no waist seam) | Casual / Summer / Formal |

The polygon math is identical to the working browser prototype — see `/src/logic/`.

---

## 8. Buttons and controls — complete inventory

### Welcome
- [PRIMARY] Start →
- [SECONDARY] Upload photo instead ←

### Photo Capture
- [BACK] ←
- [HELP] ?
- [CAPTURE] ⊙
- [PICKER] Choose from library

### Mark Calibration
- [BACK] ←
- [DRAGGABLE] 6 body markers
- [STRIP] 4 mode chips
- [STRIP] sub-style chips (variable per mode)
- [PRIMARY] Start Try-On →

### Live Try-On
- [BACK] ← (to Calibration)
- [CLOSE] ✕ (to Welcome)
- [PILL] 4 mode buttons (right side, vertical)
- [ICON] Flip camera (bottom left)
- [ICON] Pause / Resume (bottom left)
- [ICON] Outline thickness toggle (optional, bottom left)
- [PRIMARY] Capture ⊙ (bottom center)

### Snapshot Result
- [BACK] ←
- [ACTION] Save to library
- [ACTION] Share via system sheet
- [PRIMARY] Take another

---

## 9. Settings (accessible from welcome screen ⚙)

- Outline thickness (Thin / Medium / Thick)
- Outline color (White / Black / Auto-contrast)
- Show outline glow (toggle)
- Language (Hebrew / English / Auto)
- Haptic feedback (toggle)
- Reset calibration (button)
- Privacy: delete all stored photos (button)
- About / version

---

## 10. Privacy & data

- **Photos never leave the device.** All processing is local.
- Camera permission requested only on first Start.
- Photo library permission requested only when picking or saving.
- No analytics SDK in MVP. If added later, must be opt-in and document the events.

---

## 11. Performance budgets

- App cold start: < 2s on iPhone 13 / Pixel 6
- Live try-on: 30fps minimum on iPhone 12+, 24fps on mid-tier Android
- Memory: under 250MB during live try-on
- App binary size: under 50MB

---

## 12. Out of scope for v1

- Actual AI generation of garments (no try-on of specific products)
- Catalog of branded clothes
- Multi-person scenes
- Hair / face tracking
- Color/texture changing
- Body measurement / size recommendations
- Social feed / community
- E-commerce checkout

These can come in v2+ if the concept validates with users.

---

## 13. Success metrics for MVP

1. **Time to first outline visible:** < 8 seconds from app open (including permissions)
2. **Outline accuracy:** subjective — user feels the outline "fits" them in ≥ 70% of test cases
3. **Crash-free rate:** ≥ 99%
4. **Day-1 retention:** ≥ 30% (anyone interested enough to come back tomorrow)

---

## 14. Localization

- Default: Hebrew (RTL)
- Also include: English
- All UI strings in `src/i18n/`, no hard-coded text in components

---

## 15. Build & release plan

| Phase | Duration | Deliverable |
|---|---|---|
| 1 | 2 weeks | Native modules + camera + segmentation working in isolation |
| 2 | 2 weeks | Screens 1–3 (welcome, photo, calibration) |
| 3 | 2 weeks | Screen 4 (live try-on) — the headline feature |
| 4 | 1 week | Screen 5 + settings + polish |
| 5 | 1 week | QA + beta (TestFlight + Play internal) |
| 6 | 1 week | Final fixes + submit to App Store / Play Store |

Total: **9 weeks** to launch.

---

End of PRD.
