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

## Self-hosted Linux validation and remaining macOS blocker

PR #91 moved the Linux Quality Gate and Android Build to the self-hosted Linux/x64 runner named `evo-x2`. The Android workflow also gained reproducible Android SDK API 36/build-tools setup after the first self-hosted run correctly exposed a missing SDK environment.

Exact PR head `0eb779d995913da37a8381611152c119358bbf2e` passed Quality Gate `31986806263` and Android Build `31986806252`. After squash merge, exact main commit `3980a67ed13243d15438d5303ac2fdfd76db6d5f` passed Quality Gate `31986937094` and Android Build `31986937065` on the EVO-X2.

The exact-main Quality Gate passed the clean lockfile install, sensitive-file/native/network policies, dependency vulnerability and licence checks, documentation links, PWA icon reproducibility, formatting, lint, strict typecheck, complete tests, production build and deploy-artifact verification. The exact-main Android run passed Node/Java setup, Android SDK bootstrap, lockfile installation, Capacitor synchronization and debug APK assembly.

The iOS workflow remains correctly macOS/Xcode-only. Exact-main iOS run `31986937067` was rejected before checkout or any build/test step because the account billing/spending state still blocks the hosted macOS runner. That is an isolated macOS infrastructure blocker, not an application test failure and not a limitation of the EVO-X2 Linux runner.

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

## Direct canonical prayer-calculation parity

PR #93 merged after adding frozen direct-output parity against Adhan JS 4.4.4 commit `a6f1a5c4a00105103f310ef18200b95f7184d2e7`. The suite covers ISNA/North America, Muslim World League, Egyptian, Turkey interoperability and MUIS/Singapore across all six displayed daily events.

The initial Turkey fixture exposed a real seven-minute Sunrise discrepancy because SalahOS modelled only the 18°/17° twilight angles. The engine now supports method-owned adjustments independently from user/manual offsets, and the Turkey interoperability profile records the pinned canonical adjustments of Sunrise -7, Dhuhr +5, Asr +4 and Maghrib +7 minutes. Prayer provenance records method and manual adjustment minutes separately.

Exact PR head `c41a845dc38d6c604045abdf2588be16081b95b5` passed Quality Gate `31992557611` and Android Build `31992557906` on EVO-X2. The canonical comparison retained the existing two-minute tolerance; it was not widened to make the Turkey fixture pass.

This closes the v1 tracker item for direct canonical implementation comparison and upgrades MWL, Egyptian and ISNA verification. It does not claim official Diyanet institutional timetable certification, and it does not close the remaining Dubai or Karachi evidence gaps.

## Remaining release blockers

The following remain applicable before SalahOS v1 can be tagged:

- remaining calculation-method authoritative/reference work where institutional or frozen direct-fixture evidence is still incomplete (notably Diyanet institutional parity, Dubai and Karachi);
- user-selectable/local Adhan audio and corresponding supported-platform behavior;
- target notification delivery acceptance, including real platform DST behavior;
- English/Arabic visual regression and responsive-layout acceptance;
- physical Raspberry Pi Touch Display 2 and television/display acceptance where required;
- interactive iPhone/iPad acceptance;
- a fresh final code review/regression pass;
- a current exact-release iOS/macOS build when an eligible macOS runner is available; Linux Quality Gate and Android Build already have exact-main self-hosted evidence.

Phase 2 roadmap items remain future scope and are not prerequisites merely by being listed after the v1 tracker.
