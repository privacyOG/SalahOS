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

- [x] Auto-acquire best available OS location when Qiblah opens.
- [x] Auto-start true-heading updates and retain saved/manual fallback.
- [x] Move required permission education/request into first-run onboarding at the earliest OS-valid point.

**Stage 2 verification (2026-08-24):** implementation head `abe9d3eb121010c57c8ae5e97e78ef5a1482336f` passed Quality Gate `32690874466` (#2084), Visual Regression `32690874460` (#934), Android Build `32690874465` (#1090), and iOS Build `32690874463` (#999). Android verification includes a successful debug build and emulator lifecycle acceptance. iOS verification includes a successful Simulator build plus install, launch and relaunch acceptance on fresh iPhone and iPad Simulators. The visual gate includes the dedicated Stage 44 automatic live-location/heading, saved-location fallback, and first-run permission-to-live-Qiblah flows. This completion commit changes tracker documentation only and remains subject to the same exact-head PR gates before merge.

## Stage 3 — Compass recalibration

- [x] Add manual Recalibrate Compass action.
- [x] Detect poor heading accuracy and offer guided recalibration.
- [x] Reassess heading accuracy and test denied/unsupported/calibration flows.

**Stage 3 verification (2026-08-24):** implementation head `20e63058c5367e03279cf41a0afc0859584d3f54` passed Quality Gate `32692797784` (#2093), Visual Regression `32692797757` (#943), Android Build `32692797790` (#1099), and iOS Build `32692797768` (#1008). Android verification includes the successful debug build and emulator lifecycle acceptance. iOS verification includes the successful Simulator build plus install, launch and relaunch acceptance on fresh iPhone and iPad Simulators. The visual gate includes dedicated Stage 45 poor-accuracy prompting, guided and manual recalibration success, denied-permission and unsupported-device fallback flows. This completion commit changes tracker documentation only and remains subject to the same exact-head PR gates before merge.

## Stage 4 — Google Maps Qiblah

- [x] Make Google Maps the primary interactive provider with Map/Satellite/Hybrid modes.
- [x] Keep user/Kaaba markers, manual pin fallback and provider-error handling.
- [x] Increase Qiblah-line visibility with accessible theme-aware styling.

**Stage 4 verification (2026-08-24):** implementation head `f8a5cafe2bac7b93665cd39c15e70a4f18280084` passed Quality Gate `32711968565` (#2113), Visual Regression `32711968399` (#963), Android Build `32711968478` (#1119), and iOS Build `32711968476` (#1028). The visual gate passed the complete regression matrix plus two dedicated interactive Google Qiblah flows covering Satellite-default Map/Satellite/Hybrid switching, current-location and Kaaba markers, geodesic route/contrast styling, full-route refit, click-to-pin selection, provider-error retry and the network-free manual-pin fallback. Android verification includes debug build and emulator lifecycle acceptance; iOS verification includes Simulator build plus successful install, launch and relaunch on fresh iPhone and iPad Simulators. This completion commit changes tracker documentation only and remains subject to the same exact-head PR gates before merge.

## Stage 5 — Preloaded Australian mosque directory

- [x] Build reproducible Australian Muslim place-of-worship import/generation pipeline.
- [x] Bundle a compact offline-first Australian mosque catalogue with provenance/licensing.
- [x] Add nearby/search/select UX with deduplication and distance ordering.

**Stage 5 verification (2026-08-24):** implementation head `5ff9bcb4d0ca899cfd3aece7d4762fe565833632` passed Quality Gate `32723450853` (#2147), Visual Regression `32723450833` (#997), Android Build `32723450773` (#1153), and iOS Build `32723450804` (#1062). Quality verification includes deterministic offline regeneration of the bundled 106-record catalogue from the committed OpenStreetMap snapshot plus formatting, lint, typecheck, tests and production build. The visual gate includes dedicated Stage 47 search, nearest-ordering, selection/persistence and mobile/RTL acceptance. Android verification includes a successful debug build and emulator lifecycle acceptance; iOS verification includes a successful Simulator build plus install, launch and relaunch acceptance on fresh iPhone and iPad Simulators. The catalogue preserves OpenStreetMap contributor/ODbL 1.0 provenance and normal application/CI validation does not require live Overpass access. This completion commit changes tracker documentation only and remains subject to the same exact-head PR gates before merge.

## Stage 6 — Shared/community mosque directory

- [x] Add shared mosque service/database model, search and geographical lookup.
- [x] Add mosque submission, duplicate detection, moderation/edit suggestions and verification/claim state.
- [x] Cache selected/nearby directory data locally for offline resilience.

**Stage 6 verification (2026-08-25):** implementation head `49dc72bc17ad5b33dfbb0e4f01a27463e29ff4e3` passed Quality Gate `32736822014` (#2172), Visual Regression `32736822011` (#1022), Android Build `32736822032` (#1178), and iOS Build `32736822062` (#1087). Quality verification includes the standalone shared-directory service lifecycle acceptance for seeding, text/geographical lookup, duplicate rejection, moderated submissions, edit suggestions and claim-state transitions, plus formatting, lint, typecheck, unit tests and production build. The visual gate includes dedicated shared-directory online/nearby selection, verification-state, contribution, offline-cache, RTL and mobile-overflow coverage. Android verification includes a successful debug build and emulator lifecycle acceptance; iOS verification includes a successful Simulator build plus install, launch and relaunch acceptance on fresh iPhone and iPad Simulators. This completion commit changes tracker documentation only and remains subject to the same exact-head PR gates before merge.

## Stage 7 — Adhan audio library

- [x] Add supplied Adhan recordings as selectable packaged audio, subject to distribution-rights confirmation.
- [x] Add preview/default/per-prayer selection, volume and notification-only options.
- [x] Normalize playback loudness/metadata and verify offline/native scheduling behaviour.

**Stage 7 verification (2026-08-25):** implementation head `314161893461da490f56341d34ad280390910fd8` passed Quality Gate `32746429998` (#2182), Visual Regression `32746429922` (#1032), Android Build `32746429941` (#1188), and iOS Build `32746429883` (#1097). The implementation packages two rights-verified recordings with pinned provenance/attribution and normalized audio metadata, exposes default and per-prayer selection, preview, volume and notification-only controls, and keeps private local uploads device-local. The visual gate includes the dedicated Stage 49 packaged-library journey with selection/persistence, volume, notification-only, RTL and mobile-overflow coverage. Android verification includes a successful debug build, native packaged-audio bundle integrity checking and emulator lifecycle acceptance; iOS verification includes native packaged-audio bundle integrity checking, Simulator build, and successful install, launch and relaunch on fresh iPhone and iPad Simulators. Background/terminated delivery remains the existing operating-system notification path rather than an unsupported claim of unrestricted full-recording playback. This completion commit changes tracker documentation only and remains subject to the same exact-head PR gates before merge.

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
