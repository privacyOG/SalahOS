# Validation update — 2026-08-17

**Author:** privacyOG

This document records validation and tracker reconciliation performed after the 2026-08-16 evidence already retained in `TESTING.md`. It supplements, rather than rewrites, the historical validation log.

## Cross-platform notification integration already completed

PR #81 merged at commit `2f99d7e7c04b26b23ab9c45df8db5e14b257e653` after the following exact-head hosted runs passed:

- Quality Gate `31943984379`;
- Android Build `31943984406`;
- iOS Build `31943984481`.

That integration connected the production prayer/location/timezone/settings/source pipeline to both native notification adapters and verified deterministic reconciliation behavior including reminder/prayer-time/Adhan preference propagation, owned-job cancellation, idempotent reapplication, civil-date rollover replacement and removal of a previously installed job when recalculation resolves into a nonexistent DST wall-clock time.

This evidence supports the corrected tracker state for per-prayer notification settings and iOS native build integration. It does not prove target-device notification delivery across a real DST transition and does not implement user-selected local Adhan recordings.

## Native permission and local-first security hardening

PR #88 merged at commit `7c30b23cb2b630c0a26e257de37a1304709c9617`.

Changes include:

- removed the unused iOS always-location privacy declaration while retaining foreground `NSLocationWhenInUseUsageDescription`;
- documented Android and iOS/iPadOS native permission boundaries in `NATIVE_PERMISSIONS.md`;
- added `scripts/check-native-permissions.mjs` and included it in `npm run check`;
- added `scripts/check-remote-network-policy.mjs` and included it in `npm run check`;
- expanded `IOS_BUILD_SIGNING.md` into the current native build/install/signing procedure.

The native-permission policy was independently executed against representative committed-manifest/property-list shapes and passed. The remote-network policy passed a local-only source case and correctly rejected a representative remote-fetch/URL negative case.

These checks validate the policy scripts themselves. They do not substitute for the repository's full quality gate.

## Hosted workflow infrastructure blocker

Hosted Quality Gate, Android Build and iOS Build checks created for PR #88 terminated before normal job execution. GitHub's check annotation states that the jobs were not started because the account's recent payments/spending limit requires attention.

No checkout, dependency install, build or test step executed in those affected runs. The condition is therefore recorded as a hosted-runner infrastructure blocker, not as an application test failure and not as passing evidence.

A fresh exact-head hosted quality/build result remains required before a v1 release tag can be created.

## Tracker and documentation reconciliation

The 2026-08-17 reconciliation corrected stale tracker states that predated later verified work. In particular:

- native Android/iOS current-location adaptation is implemented through the shared Capacitor native path;
- iOS Simulator compilation has recorded Xcode build evidence;
- per-prayer notification settings are implemented and persisted;
- offline prayer calculation, local mosque/Jumu'ah operation, calendar behavior and DST/date rollover have existing recorded automated evidence;
- native permission review and the current local-first remote-network security boundary are complete repository controls;
- iOS build/install documentation is current;
- physical/interactive target acceptance is marked blocked where the required device/display environment is unavailable rather than being represented as incomplete application logic.

`README.md`, `DESIGN.md`, `RESEARCH.md`, `docs/PLATFORM_STATUS.md`, `TODO.md` and draft `RELEASE_NOTES.md` are synchronized to these current capability boundaries on the reconciliation branch.

Historical notes in `TESTING.md` and `TODO.md` are intentionally retained when they accurately describe what was still open at the time of an earlier run. Later reconciliation notes supersede those historical status statements without altering the original evidence.

## Remaining release blockers

The following remain applicable before SalahOS v1 can be tagged:

- remaining calculation-method authoritative/reference work and direct canonical comparison;
- user-selectable/local Adhan audio and corresponding supported-platform behavior;
- target notification delivery acceptance, including real platform DST behavior;
- English/Arabic visual regression and responsive-layout acceptance;
- physical Raspberry Pi Touch Display 2 and television/display acceptance where required;
- interactive iPhone/iPad acceptance;
- a fresh final code review/regression pass;
- a fresh exact-head complete quality/build gate after hosted runner access is restored.

Phase 2 roadmap items remain future scope and are not prerequisites merely by being listed after the v1 tracker.
