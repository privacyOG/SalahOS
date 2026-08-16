# SalahOS 0.1.0 release notes

Status: release-candidate notes. Do not tag or publish 0.1.0 until the applicable release-readiness gates in `TODO.md` are satisfied.

## What SalahOS 0.1.0 contains

SalahOS 0.1.0 is the first local-first prayer-time and smart-display release candidate. The shared prayer engine and settings model are used across Web/PWA, Android, iOS/iPadOS and browser-hosted kiosk/display targets so calculation behaviour does not diverge by platform.

### Prayer calculation

- five obligatory prayer times plus sunrise;
- Muslim World League, Umm al-Qura/Makkah, Egyptian, Karachi, ISNA, Diyanet/Turkey, MUIS/Singapore, Dubai, Kuwait and Qatar method entries;
- standard and Hanafi Asr conventions;
- selectable high-latitude rules;
- per-prayer manual minute adjustments;
- named-method provenance and verification state;
- authority-specific Diyanet institutional adjustments kept separate from user offsets;
- Umm al-Qura 90-minute Isha outside Ramadan and 120-minute Isha during Ramadan using the uncorrected Umm al-Qura calendar policy;
- explicit fail-safe handling when a required astronomical/calendar result is unavailable rather than inventing a prayer time.

Diyanet twilight-angle parity and Dubai authority-formula parity remain explicitly pending authoritative-source verification. Their documentation must not be read as institutional certification.

### Location, timezone and calendar

- explicit one-shot current-location acquisition;
- manual coordinates and offline location search;
- local timezone lookup and IANA timezone handling;
- DST/date-rollover recalculation;
- Gregorian and Umm al-Qura Hijri presentation;
- user Hijri correction of ±2 days for display without changing named calculation-method policy;
- saved locations and local persistence;
- strict persisted coordinate types so empty/null/boolean/string values cannot be coerced into locations;
- canonical saved-location identifiers derived from normalized coordinate values.

### Mosque timetable and Iqamah

- local mosque timetable selection;
- validated CSV/JSON timetable import;
- saved mosque library;
- manual mosque/day entry;
- fixed-time or offset-based Iqamah rules;
- calculation-only, calculation-plus-adjustments and local-mosque source modes.

### Notifications and Adhan

- per-prayer notification enable/disable;
- reminder-before-prayer scheduling;
- prayer-time notifications;
- default/silent notification sound selection;
- vibration preference where supported;
- per-prayer Adhan alert preference;
- Android and iOS native local-notification scheduling adapters;
- schedule reconciliation after relevant settings/runtime changes;
- Android reboot/exact-alarm handling documented and verified at repository/emulator level;
- user-selectable local Adhan recording stored only on the device;
- foreground full-recording playback while the application is visible;
- background/terminated delivery remains subject to native platform notification restrictions.

SalahOS does not bundle an unlicensed Adhan recording and does not upload a user-selected local recording.

### Web/PWA and smart displays

- production Vite build and deploy-artifact verification;
- installable PWA manifest and first-party icons;
- browser/PWA-only service-worker registration with contained registration failure;
- versioned service-worker shell caching and offline navigation fallback;
- install-time pre-cache of the verified SalahOS HTML shell, all manifest icons and current first-party Vite `/assets/` references before the new worker activates;
- runtime cache allowlist restricted to first-party `/assets/`, `/icons/` and the manifest, so arbitrary same-origin API/data GET responses are not persisted automatically;
- root-shell identity checks requiring the SalahOS mount point, manifest reference and first-party application bundle before candidate HTML may replace the offline root;
- atomic asset-first install and navigation shell upgrades, with the cached root replaced only after all candidate application assets cache successfully;
- navigation-time cache failure preserves the prior complete offline shell while still allowing the online response to render;
- versioned cache cleanup removes older broader, non-atomic or unverified-shell namespaces after a successful worker upgrade;
- Raspberry Pi/Chromium kiosk launcher and deployment documentation;
- smart-display mode for kiosk/TV browser use;
- responsive phone/tablet/kiosk styling;
- deterministic browser visual-regression matrix with English/light, Arabic/RTL/dark, phone portrait/landscape, tablet, 1080p kiosk and increased-text-size captures;
- browser accessibility regression for 200% text reflow, real keyboard-visible focus and reduced-motion smart-display behavior;
- static accessibility contracts protecting focus indicators, minimum control height and reduced-motion styling;
- CI screenshot artifact upload for visual/accessibility review.

Physical Raspberry Pi Touch Display 2, television/CEC/remote and final real-device visual acceptance remain separate release gates.

### Android

- committed Capacitor Android project;
- reproducible debug/release build commands;
- previously validated Android 35 emulator acceptance coverage;
- permanent Android 35 / Google APIs / x86_64 / Pixel 7 Pro emulator gate on the release candidate;
- offline force-stop/cold-launch and native orientation instrumentation;
- retained portrait/landscape/portrait-restored emulator screenshots with PNG-dimension orientation validation;
- release signing configuration through environment-provided credentials;
- reviewed source and merged-manifest permission contracts;
- cleartext network traffic disabled;
- application backup disabled with explicit cloud/device-transfer exclusion rules;
- bundled-only Capacitor content configuration, rechecked after native synchronization;
- local notification and reboot scheduling paths;
- unused Google Services build/plugin auto-activation removed, with `google-services.json` rejected by the sensitive-file gate.

The new permanent emulator/screenshot and native hardening gates are candidate infrastructure until they pass on the exact candidate head and retained images are inspected where applicable. A successful Android build/emulator run does not represent broad physical-device or store-distribution acceptance.

### iOS / iPadOS

- committed Capacitor/Xcode project;
- automated unsigned iOS Simulator build path;
- current-location and local-notification native adapters;
- candidate Preferences-backed native storage shared with Android instead of the earlier iOS WebView-only storage path;
- one-time migration of missing SalahOS settings, saved-location and mosque-library keys from legacy iOS Web Storage into Preferences, with existing native values authoritative and legacy removal occurring only after persistence flush;
- retryable native persistence: failed mutations remain pending, later writes continue, and flush attempts every unresolved key before reporting a remaining failure;
- privacy-safe fixed structured storage-failure logging without persisted values or raw exception details;
- bundled-only Capacitor content configuration, rechecked after native synchronization;
- safe-area viewport/CSS handling;
- permanent candidate workflow that selects one available iPhone and one available iPad Simulator, installs the exact built `App.app`, cold-launches both and retains 5-second/20-second screenshots;
- documented Xcode and physical-development-device workflow;
- foreground-only SalahOS location behaviour while retaining the usage-description keys required by the pinned geolocation dependency.

The new iOS Preferences migration, iPhone/iPad screenshot path and native hardening remain candidate infrastructure until they pass on the exact candidate head and the retained screenshots are inspected where applicable. Physical-device acceptance, distribution signing and native notification validation in supported environments remain release gates.

### Privacy and security

- local-first prayer calculation and timezone resolution;
- no mandatory account for core prayer-time use;
- no unnecessary analytics/telemetry;
- privacy-safe structured error logging;
- sensitive-file and dependency-vulnerability gates;
- dependency-license policy;
- reviewed native dependency-surface gate that pins the committed Capacitor/AndroidX/Cordova/Swift-package declarations and rejects unreviewed local Android `.jar/.aar` binaries;
- native Capacitor configuration gate that requires bundled application content and rejects unreviewed remote server/navigation/cleartext/hostname/scheme overrides, including generated post-sync configuration;
- cross-platform native storage gate that requires Capacitor Preferences on native shells and protects retry and one-time legacy Web Storage migration ordering;
- Web/PWA Content Security Policy baseline with same-origin networking and loopback-only development WebSocket exceptions;
- bounded Web/PWA service-worker cache policy with SalahOS shell-identity verification and atomic application-shell upgrades;
- strict persisted-input validation for coordinate types, canonical saved-location identity and bounded integer-minute prayer adjustments;
- optional remote API boundary using explicit HTTPS origins, no browser credentials, no redirect following, no referrer disclosure and no cache reuse;
- direct unreviewed production networking primitives rejected by repository policy;
- native permission/backup/transport review gates;
- synchronized `0.1.0` package, lockfile, Android and packaged iOS version metadata;
- documented privacy/threat model and secrets policy.

No optional remote provider is enabled by default.

### Localization and persistence

- English and Arabic interface strings;
- Arabic RTL direction and document-language handling;
- system/light/dark theme preference;
- 12/24-hour time formats;
- versioned settings persistence and migration;
- settings import/export/reset;
- imported prayer adjustments restricted to bounded integer minutes;
- offline startup from stored configuration.

## Validation boundary before tagging

The repository already contains extensive unit, integration, component, offline, calculation-parity and native-build evidence from earlier validated heads. The consolidated release candidate must still pass its own exact-head Quality, Android and iOS workflow gates before merge.

Candidate browser, Android-emulator and iPhone/iPad-Simulator screenshot infrastructure is not itself evidence of a passing layout. The workflows must execute successfully on the exact candidate head and the retained images must be inspected before applicable visual TODO items are promoted.

The following evidence remains separate and must not be inferred from automated repository checks:

- physical Raspberry Pi Touch Display 2 acceptance;
- physical TV/remote/CEC/viewing-distance acceptance;
- final physical Android/iPhone/iPad acceptance where required by `TODO.md`;
- native notification behaviour across platform-specific lifecycle/power-management conditions not covered by the available environment;
- screen-reader and physical-device accessibility acceptance beyond the explicit automated browser checks;
- final visual artifact inspection and accessibility review;
- any items explicitly marked blocked or partial in `TODO.md`.

The first release tag must be created only after the applicable gates are satisfied and the tracker reflects the final evidence state.

---

**Author:** privacyOG
