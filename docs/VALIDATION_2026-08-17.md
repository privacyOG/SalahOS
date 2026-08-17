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

## Local Adhan audio and local-first CI coverage

The current local-Adhan implementation was transplanted from the earlier divergent proof branch onto current mainline rather than merging stale history. The production settings surface stores one user-selected audio recording in the SalahOS IndexedDB media store, validates a non-empty `audio/*` MIME type with a 25 MB ceiling, supports local Preview/Remove, and keeps the bytes outside normal settings export and release assets. Foreground playback is keyed by civil date and prayer and is attempted only while the application is visible for an Adhan-enabled prayer. Platform autoplay policy can reject that attempt; the UI reports the failure instead of claiming playback succeeded.

The Android Adhan lifecycle policy was updated to match this implementation: a configured foreground session may use the dedicated local-audio path; background and terminated states remain notification alerts. This does not claim unrestricted full-length background audio, physical-device audio-focus behaviour, or native delivery timing acceptance.

During validation, aggregate `npm run check` exposed a pre-existing `https://` literal in `smartDisplayNavigation.ts` that violated the repository remote-network policy. The parser now uses a local `file:///` base for relative URL parsing. The permanent Quality Gate was also missing the already-defined native-permission and remote-network policy commands, so both are now explicit CI steps.

## Superseding hosted iOS Simulator release-candidate evidence

PR #101 code-bearing head `b0699274ef41980d03f0321346eabe5ae758758f` supersedes the earlier macOS-runner blocker for current Simulator acceptance. It passed Quality Gate `32032477140`, Android Build `32032477112`, Visual Regression `32032477113` and iOS Build `32032477111` together.

The permanent iOS workflow used hosted `macos-15`, completed the repository quality gate and Xcode Simulator build, then created fresh iPhone 17 Pro and iPad Pro 13-inch (M5) Simulators on iOS 26.2. It installed the freshly built application, resolved `com.privacyog.salahos` containers, launched each application process, captured valid screenshots, explicitly terminated each app, relaunched it and captured second screenshots. Artifact `9289927972` retains the evidence.

Manual inspection of an earlier probe artifact exposed a genuine iPhone status-bar/Dynamic-Island overlap that was not detectable from PNG existence/dimension checks alone. The branch corrected the WebView safe-area contract with `viewport-fit=cover`, four-edge `env(safe-area-inset-*)` padding and a direct source-contract regression test. The final passing launch/relaunch screenshots were then manually inspected and show the SalahOS content below the iPhone status area; the iPad surface is also clean.

This closes the hosted iPhone/iPad Simulator runtime and responsive-layout acceptance boundary. It does **not** close network-isolated iOS cold start, physical iPhone/iPad GPS/permission behavior, real local-notification delivery/timing including DST, real audio-session/focus behavior, haptics, physical touch/Dynamic Type, reboot lifecycle, signing/provisioning/TestFlight/App Store distribution, physical Raspberry Pi Touch Display 2, physical TV/kiosk or Android OEM notification timing. Those remain explicit target-environment evidence rather than inferred automated claims.
