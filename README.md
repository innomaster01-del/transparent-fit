# Transparent Fit

A React Native (iOS + Android) app that overlays a transparent white outline of a
garment — shirt, pants, dress, or full outfit — on the user's body in real time
through the camera. The body remains fully visible "through" the outline, so the
user can see how clothes from a store rack would look on them without trying anything on.

**⚡ Want an installable Android APK without any dev tools?**
See **`docs/HOW-TO-GET-APK-HE.md`** (Hebrew) — upload this repo to GitHub, press
one button, and GitHub Actions builds the APK for you in ~15 minutes.

The **Android project is complete** (Gradle config, Manifest, MainActivity/Application,
launcher icons, CI workflow). The **iOS project** contains the native modules
(Swift + ObjC bridges) but needs an Xcode project shell — see tickets/01.

---

## What's in this repo

```
TransparentFit/
├── App.tsx                          ← root + hand-rolled navigator
├── index.js, app.json
├── package.json
├── tsconfig.json, babel.config.js, metro.config.js
├── docs/
│   └── PRD.md                       ← full product spec (read this first)
├── src/
│   ├── screens/                     ← 6 screens: Welcome, PhotoCapture, MarkPoints,
│   │                                  LiveTryOn, Snapshot, Settings
│   ├── components/                  ← reusable UI: ModeSelector, CaptureButton,
│   │                                  GarmentOutline, etc.
│   ├── logic/                       ← garment polygon math (ported from the
│   │                                  HTML prototype, no platform deps)
│   ├── native/                      ← typed JS wrappers around the native modules
│   ├── store/                       ← Zustand store (photo, marks, mode, settings)
│   ├── i18n/                        ← Hebrew + English strings
│   ├── theme/                       ← colors, spacing, typography tokens
│   └── navigation/                  ← screen-name types
├── ios/TransparentFit/
│   ├── PersonSegmenter.swift / .m   ← Apple Vision wrapper
│   ├── PoseDetector.swift / .m      ← Apple Vision pose detection
│   ├── Info.plist.snippet           ← permissions to merge into your Info.plist
│   └── Podfile.snippet (in ios/)    ← Podfile reference
├── android/app/src/main/java/com/transparentfit/
│   ├── PersonSegmenterModule.kt     ← ML Kit selfie segmentation
│   ├── PoseDetectorModule.kt        ← ML Kit pose detection
│   └── TransparentFitPackage.kt     ← package registration
├── android/app/build.gradle.snippet ← ML Kit deps + permissions reference
└── tickets/                         ← phased build tickets for your dev team
```

---

## What works out of the box

- Complete TypeScript source for all 6 screens (Welcome, PhotoCapture, MarkPoints, LiveTryOn, Snapshot, Settings)
- Complete native code for on-device person segmentation + pose detection (iOS Swift + Android Kotlin)
- Complete garment geometry logic (4 modes × 3–4 sub-styles each)
- Hebrew + English localization
- Zustand state store
- Reference build configs for Podfile, build.gradle, Info.plist, AndroidManifest

## What you still have to do

1. **Generate the native shells** (Xcode project, Android Studio project) with `npx react-native init` and copy this source into it
2. **Merge the snippet files** (Podfile.snippet, Info.plist.snippet, build.gradle.snippet) into your generated config
3. **Run** `pod install` (iOS) and `./gradlew sync` (Android)
4. **Build to a real device** — the camera + segmentation path can't be exercised in simulators
5. **Sign and submit** to App Store / Play Store

Approx 2–4 days of work for an experienced React Native dev who's done native modules before.

---

## Setup, step-by-step

### Prerequisites

- macOS (required for iOS)
- Node 18+ (`brew install node`)
- Watchman (`brew install watchman`)
- Xcode 15+ with command-line tools (App Store)
- CocoaPods (`sudo gem install cocoapods`)
- Android Studio + Android SDK API 34
- Java 17 (`brew install --cask zulu17`)
- A real iPhone (iOS 14+) **and** Android device (API 24+) for testing — simulators won't render the camera path

### One-time setup

```bash
# 1. Generate a fresh React Native shell
npx react-native init TransparentFit --version 0.74.5

# 2. Copy this repo's contents over the generated project
#    (keep the generated ios/ and android/ folders; just add our files)
rsync -av --exclude='ios' --exclude='android' ./TransparentFit-source/ ./TransparentFit/

# 3. Copy native modules into the generated project
cp TransparentFit-source/ios/TransparentFit/PersonSegmenter.* TransparentFit/ios/TransparentFit/
cp TransparentFit-source/ios/TransparentFit/PoseDetector.*    TransparentFit/ios/TransparentFit/
cp -r TransparentFit-source/android/app/src/main/java/com/transparentfit \
      TransparentFit/android/app/src/main/java/com/

# 4. Install JS deps
cd TransparentFit
npm install

# 5. iOS pods
cd ios && pod install && cd ..

# 6. Merge the snippet files manually:
#    - ios/Podfile.snippet               → ios/Podfile
#    - ios/TransparentFit/Info.plist.snippet → ios/TransparentFit/Info.plist
#    - android/app/build.gradle.snippet  → android/app/build.gradle and AndroidManifest.xml
```

### Run

```bash
# iOS — connect device, then:
npm run ios

# Android — connect device, then:
npm run android
```

### Common issues

| Symptom | Fix |
|---|---|
| `PersonSegmenter is null` at runtime | Native module not linked. Rebuild: `cd ios && pod install` then `npm run ios` |
| Hebrew text shows LTR | RTL needs `I18nManager.forceRTL(true)` + restart. Already handled in `App.tsx` |
| Camera black on iOS simulator | Expected — simulators have no camera. Use a real device. |
| Vision returns nil on iPad | `VNGeneratePersonSegmentationRequest` needs iOS 15+, iPadOS 15+. Bump min target. |
| `ML Kit model not downloaded` on first Android run | Phone needs internet on first launch to download the ~5MB model. Cached after that. |
| Reanimated babel error | Make sure `react-native-reanimated/plugin` is the **last** plugin in `babel.config.js` |
| Skia path looks jagged | Try `strokeJoin="round" strokeCap="round"` (already set in `GarmentOutline.tsx`) |

---

## Architecture notes

**Why not just use the HTML prototype as a webview?** A WKWebView can't access the
camera's frame buffer fast enough for per-frame segmentation, and it can't call
Apple Vision / ML Kit directly. The whole point of the native rewrite is to get
30fps live overlay — that requires a native camera + native ML pipeline.

**Why Apple Vision / ML Kit instead of SAM2?** Both ship on-device, free, and run
at 30fps on mid-range phones. SAM2 needs ~3GB GPU RAM and Python — not viable on
a phone. For person segmentation specifically (not arbitrary object segmentation)
the quality is comparable.

**Why not react-navigation?** The flow is 5 screens, linear. A `useState<Stack>`
in `App.tsx` is 30 lines and saves an 800KB dependency that wires a Provider
into every screen.

**Why Zustand instead of Redux / Context?** No boilerplate, no Provider, type-safe
selectors. The state is small (calibration photo + marks + mode + settings) —
anything heavier is overkill.

**Why Skia for the outline drawing?** It's the only RN-native drawing primitive
that hits 60fps reliably across iOS and Android. SVG is fine for icons but stutters
when redrawn 30 times a second.

---

## Testing on device

iOS:
1. Open `ios/TransparentFit.xcworkspace` in Xcode
2. Select your device in the device picker
3. Sign the target with your developer team
4. Cmd+R to run

Android:
1. Enable USB debugging on the device
2. `npm run android`
3. If you see "App not installed", `adb uninstall com.transparentfit` then rerun

---

## License

Proprietary. All rights reserved.

---

## Build phases (see `/tickets/`)

The work is broken into 6 phases. See individual ticket markdowns in `/tickets/`
for full breakdown of tasks, acceptance criteria, and estimates.

| Phase | What ships | Days |
|---|---|---|
| 1 | Native segmentation + pose modules wired to a smoke-test screen | 5 |
| 2 | Welcome + PhotoCapture + MarkPoints (Screens 1–3) | 6 |
| 3 | Live try-on (Screen 4) — the headline feature | 8 |
| 4 | Snapshot + Settings + polish | 4 |
| 5 | QA + TestFlight + Play Internal | 5 |
| 6 | App Store + Play Store submission | 5 |
| **Total** | **9 weeks (one developer, full-time)** | **33 days** |
