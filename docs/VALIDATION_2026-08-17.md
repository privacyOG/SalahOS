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

This closes the v1 tracker item for direct canonical implementation comparison and upgrades MWL, Egyptian and ISNA verification. It does not claim official Diyanet institutional timetable certification. Subsequent PRs #95 and #96 extend this direct-output evidence to Dubai and Karachi.

## Dubai and Karachi method-evidence completion

PR #95 modelled the pinned Adhan JS 4.4.4 Dubai per-event adjustments (Sunrise -3, Dhuhr +3, Asr +3 and Maghrib +3 minutes) and added the frozen Dubai/Gulf fixture for 2016-01-01. The pinned fixture cites UAE Awqaf published timetable output. Exact PR head `d1468ea5448659cad1d68075db94b8eb5283741c` passed Quality Gate `31993099243` and Android Build `31993099235` on EVO-X2. The fixture passed at the unchanged two-minute tolerance. This is direct/output parity evidence and is not represented as proof that UAE Awqaf internally uses the same simplified parameters.

PR #96 closed the Karachi direct-fixture gap without deriving expected values from SalahOS. A temporary runner workflow installed exact `adhan@4.4.4` in an isolated directory and generated the six prayer events for Karachi coordinates `24.8607, 67.0011` on 2020-01-01 using Standard/Shafi Asr: Fajr 05:55, Sunrise 07:17, Dhuhr 12:36, Asr 15:34, Maghrib 17:54 and Isha 19:15 in Asia/Karachi. The temporary capture workflow was removed before review, and the values were frozen in the permanent parity suite. Exact PR head `cc1d6e785f4607e718c5eb73ceee61e1f917b0a7` passed Quality Gate `31993328375` and Android Build `31993328633`.

These additions close the Karachi method verification item and remove the previously unmodelled Dubai-offset gap. The broader regional-method/source item remains partial because official Diyanet institutional parity is still unresolved and Dubai institutional parameter equivalence is intentionally not inferred from output parity.

## Automated browser visual regression

PR #98 merged the first persistent production-build visual regression workflow after the EVO-X2 proved an isolated current browser harness could execute headlessly. The permanent workflow installs exact `playwright@1.62.0` only in `/tmp`, audits that isolated harness before use, builds SalahOS from the committed lockfile, serves the production artifact on loopback and renders a deterministic 14-scenario viewport/locale/theme matrix.

The initial matrix distinguished harmless intrinsic element width from actual page overflow and exposed one genuine defect: the Arabic/RTL phone settings view at 125% root text expanded the page to 411px inside a 390px viewport. Production responsive containment was corrected by allowing grid/form children to shrink below intrinsic width, constraining fieldsets/form controls and using a true `minmax(0, 1fr)` narrow settings column.

Exact final PR head `501e5ab64af9c2c1cd7e0137aa398bb8e20307dd` then passed Visual Regression `32004488336`, Android Build `32004488397` and Quality Gate `32004488438`. The visual run passed all 14 scenarios and uploaded artifact `9279673293`, containing full-page screenshots and `results.json`. Automated browser layout, overflow and large-text evidence is therefore current. This does not replace physical Touch Display 2, TV/panel, Android OEM or interactive iPhone/iPad acceptance.

## Remaining release blockers

The following remain applicable before SalahOS v1 can be tagged:

- remaining calculation-method institutional/source-boundary work, principally official Diyanet parity and the intentionally conservative Dubai parameter-equivalence boundary;
- user-selectable/local Adhan audio and corresponding supported-platform behavior;
- target notification delivery acceptance, including real platform DST behavior;
- human screenshot/aesthetic review where desired and physical target responsive-layout acceptance; automated browser visual regression now passes the defined matrix;
- physical Raspberry Pi Touch Display 2 and television/display acceptance where required;
- interactive iPhone/iPad acceptance;
- a fresh final code review/regression pass;
- a current exact-release iOS/macOS build when an eligible macOS runner is available; Linux Quality Gate and Android Build already have exact-main self-hosted evidence.

Phase 2 roadmap items remain future scope and are not prerequisites merely by being listed after the v1 tracker.
