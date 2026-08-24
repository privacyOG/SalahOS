# SalahOS v1.4.0 — Temporary Completion Tracker

This tracker is intentionally compact. A stage is marked complete only after implementation, tests/visual acceptance, and relevant documentation are complete.

## Stage 1 — Mobile layout + accessibility hardening

- [x] Fix Today/mobile bottom-navigation overlap at 390×844 and 360×780.
- [x] Ensure the final prayer row and trailing content remain reachable above navigation/safe areas.
- [x] Correct confirmed low-contrast light/dark/RTL UI text without changing the established visual identity.
- [x] Add automated regression assertions for navigation overlap and key accessibility/contrast behaviour.
- [x] Run targeted tests, lint/typecheck/build and visual acceptance; record evidence.

**Stage 1 verification (2026-08-24):** implementation head `6770f770349f2cf64593a0987a747d41296f1862` passed Quality Gate `32687828393` (#2073), Visual Regression `32687828408` (#923), Android Build `32687828390` (#1079), and iOS Build `32687828384` (#988). The visual matrix includes the 360×780 and 390×844 phone regressions, Isha/trailing-content reachability above primary navigation, RTL/large-text coverage, and mobile-theme contrast assertions. This completion commit changes tracker documentation only and remains subject to the same exact-head PR gates before merge.

## Stage 2 — Automatic live Qiblah

- [ ] Auto-acquire best available OS location when Qiblah opens.
- [ ] Auto-start true-heading updates and retain saved/manual fallback.
- [ ] Move required permission education/request into first-run onboarding at the earliest OS-valid point.

## Stage 3 — Compass recalibration

- [ ] Add manual Recalibrate Compass action.
- [ ] Detect poor heading accuracy and offer guided recalibration.
- [ ] Reassess heading accuracy and test denied/unsupported/calibration flows.

## Stage 4 — Google Maps Qiblah

- [ ] Make Google Maps the primary interactive provider with Map/Satellite/Hybrid modes.
- [ ] Keep user/Kaaba markers, manual pin fallback and provider-error handling.
- [ ] Increase Qiblah-line visibility with accessible theme-aware styling.

## Stage 5 — Preloaded Australian mosque directory

- [ ] Build reproducible Australian Muslim place-of-worship import/generation pipeline.
- [ ] Bundle a compact offline-first Australian mosque catalogue with provenance/licensing.
- [ ] Add nearby/search/select UX with deduplication and distance ordering.

## Stage 6 — Shared/community mosque directory

- [ ] Add shared mosque service/database model, search and geographical lookup.
- [ ] Add mosque submission, duplicate detection, moderation/edit suggestions and verification/claim state.
- [ ] Cache selected/nearby directory data locally for offline resilience.

## Stage 7 — Adhan audio library

- [ ] Add supplied Adhan recordings as selectable packaged audio, subject to distribution-rights confirmation.
- [ ] Add preview/default/per-prayer selection, volume and notification-only options.
- [ ] Normalize playback loudness/metadata and verify offline/native scheduling behaviour.

## Stage 8 — Islamic Knowledge

- [ ] Add Knowledge navigation and Qur'an, Hadith and Q&A modules.
- [ ] Preserve source/grading/scholar attribution and offline-friendly reading where practical.

## Stage 9 — Performance architecture

- [ ] Fix timetable import static-edge/lazy-load issue.
- [ ] Route/surface-level code splitting, especially Admin/smart-display code.
- [ ] Add bundle-size CI budget.

## Stage 10 — Verification upgrades

- [ ] Golden screenshot baseline/diff regression.
- [ ] Automated WCAG/axe coverage and stronger RTL/container-overflow checks.
- [ ] Coverage thresholds plus Chromium/WebKit/Firefox smoke journeys.
- [ ] Final exact-head mobile/native/web/display validation and v1.4.0 completion reconciliation.
