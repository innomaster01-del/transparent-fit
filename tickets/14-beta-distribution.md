# T5.2 · Beta Distribution

**Phase:** 5 · **Estimate:** 3 days

## Goal

Get the app onto ~20 external beta testers via TestFlight (iOS) and Google Play
Internal Testing (Android).

## Steps

### TestFlight

1. Bump version in `Info.plist` to `1.0.0-beta1`
2. Archive in Xcode (Product → Archive)
3. Upload to App Store Connect
4. Add internal testers (Apple IDs of dev team)
5. Submit for Beta App Review (takes 24-48 hours first time)
6. Add external tester group; invite via email

### Play Internal Testing

1. Bump versionCode + versionName in `android/app/build.gradle`
2. Generate signed APK: `cd android && ./gradlew bundleRelease`
3. Upload to Play Console → Testing → Internal testing
4. Add testers via email list (max 100 for internal)
5. Share opt-in link

### Tester instructions

- Provide a short PDF / link explaining the test scenarios
- Include a feedback form (TypeForm / Google Form)
- Watch for crashes via App Store Connect / Play Console crash dashboards

## Acceptance

- [ ] 20+ external testers installed
- [ ] At least 10 completed end-to-end flow
- [ ] No P0 bugs reported in first 48 hours
