# T1.2 · Android Native Modules

**Phase:** 1 · **Estimate:** 1.5 days

## Goal

Wire `PersonSegmenterModule` and `PoseDetectorModule` into the generated
Android project so they're callable from JS.

## Steps

1. Copy `android/app/src/main/java/com/transparentfit/*.kt` into the equivalent
   path of the generated project
2. Merge `android/app/build.gradle.snippet` into `android/app/build.gradle`:
   - Add the two `com.google.mlkit:*` deps
   - Bump `minSdkVersion = 24`
3. Add the camera + photo permissions to `AndroidManifest.xml` (snippet has them)
4. In `MainApplication.kt`, register the package:
   ```kotlin
   override fun getPackages(): List<ReactPackage> =
       PackageList(this).packages.apply {
           add(TransparentFitPackage())
       }
   ```
5. Sync Gradle (`./gradlew sync` or click "Sync Now" in Android Studio)
6. `npm run android` on a real device
7. Smoke-test as in T1.1

## Acceptance

- [ ] App builds with no Gradle errors
- [ ] `NativeModules.PersonSegmenter` is non-null at runtime on Android 7+
- [ ] First-run permission prompt appears for camera
- [ ] ML Kit model auto-downloads on first call (needs internet once)
- [ ] No memory leaks across 50 repeated calls (check `adb shell dumpsys meminfo`)

## Notes

- Add a runtime permission flow in JS before any native call — Android 6+ needs
  this even with the manifest declaration
- ML Kit's `SelfieSegmentation` allocates a Bitmap per call. Keep a single
  segmenter instance and reuse for live frames (T3.2 covers this optimization)
