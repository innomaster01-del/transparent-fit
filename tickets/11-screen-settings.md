# T4.2 · Settings Screen

**Phase:** 4 · **Estimate:** 1 day

## Goal

`src/screens/SettingsScreen.tsx` — already implemented. Needs persistence
and a few additions.

## Steps

1. Persist all settings to `AsyncStorage` (`@react-native-async-storage/async-storage`)
2. Add sections:
   - About / version (read from `package.json`)
   - Privacy policy (open in WebView or external browser)
   - Terms of service
   - Contact support (mailto: opens email)
3. Add a "Reset all data" button at the bottom (deletes calibration + cached snapshots)
4. Setting changes apply immediately (already the case via Zustand)

## Acceptance

- [ ] All settings survive app restart
- [ ] Reset clears photo, marks, cached snapshots
- [ ] Privacy / Terms links open correctly
