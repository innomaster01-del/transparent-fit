# T2.1 · Welcome Screen

**Phase:** 2 · **Estimate:** 0.5 day

## Goal

Polish the Welcome screen (`src/screens/WelcomeScreen.tsx`) — already implemented,
needs visual review and brand alignment.

## Steps

1. Review against `docs/PRD.md` § 6 · Screen 1
2. Replace `Inter` font with the chosen brand display font (designer to provide)
3. Verify the gradient CTA renders correctly on both platforms
4. Add a small animated entry (Reanimated `withDelay` + `withTiming`) on the
   3 feature pills — staggered fade-up
5. Add a settings gear button in the top-right that pushes the Settings screen

## Acceptance

- [ ] Pixel-perfect against the designer mockup (handoff TBD)
- [ ] Hebrew + English both render with correct RTL/LTR
- [ ] Settings gear opens Settings screen
