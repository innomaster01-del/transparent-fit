# T5.1 · QA Checklist

**Phase:** 5 · **Estimate:** 2 days

## Device matrix

Must pass on: iPhone 12, iPhone 14, iPhone 15 Pro, Pixel 6, Pixel 8,
Samsung Galaxy S22, Samsung Galaxy A52.

## Flows

For each device:
- [ ] Fresh install → permission prompts → complete onboarding
- [ ] Permission denial path (deny camera, deny photos)
- [ ] Switch language mid-app → all strings update
- [ ] Take photo → confirm pose → switch modes → capture → save → return
- [ ] Upload photo from library → same flow
- [ ] Background the app during live try-on → resume → still works
- [ ] Low memory: take 20 captures back-to-back → no crashes
- [ ] Airplane mode → app still works (everything is on-device)
- [ ] Settings persist after app force-quit
- [ ] Hebrew RTL renders correctly across all screens

## Subjective

- [ ] Outline visually "fits" the body in ≥ 70% of test cases
- [ ] Capture button feels responsive (no perceived lag)
- [ ] Mode switching feels instant
