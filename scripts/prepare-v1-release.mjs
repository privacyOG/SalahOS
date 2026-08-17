import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content.endsWith('\n') ? content : `${content}\n`);

function replaceOnce(text, from, to, label) {
  const first = text.indexOf(from);
  if (first < 0) throw new Error(`Missing ${label}`);
  if (text.indexOf(from, first + from.length) >= 0) throw new Error(`Duplicate ${label}`);
  return text.slice(0, first) + to + text.slice(first + from.length);
}

const pkg = JSON.parse(read('package.json'));
pkg.version = '1.0.0';
write('package.json', JSON.stringify(pkg, null, 2));

const lock = JSON.parse(read('package-lock.json'));
lock.version = '1.0.0';
lock.packages[''].version = '1.0.0';
write('package-lock.json', JSON.stringify(lock, null, 2));

let android = read('android/app/build.gradle');
android = replaceOnce(android, 'versionName "1.0"', 'versionName "1.0.0"', 'Android versionName');
write('android/app/build.gradle', android);

let xcode = read('ios/App/App.xcodeproj/project.pbxproj');
const marketingMatches = xcode.match(/MARKETING_VERSION = 1\.0;/g) ?? [];
if (marketingMatches.length !== 2) throw new Error(`Expected 2 iOS marketing versions, found ${marketingMatches.length}`);
xcode = xcode.replaceAll('MARKETING_VERSION = 1.0;', 'MARKETING_VERSION = 1.0.0;');
write('ios/App/App.xcodeproj/project.pbxproj', xcode);

write('CHANGELOG.md', `# Changelog

All notable SalahOS changes are recorded here.

## Unreleased

No changes recorded after v1.0.0 yet.

## 1.0.0 — 2026-08-18

### Added

- Local-first five-prayer calculation engine with Sunrise, supplementary night/day times, selectable calculation methods, Standard/Shafi'i-family and Hanafi Asr conventions, high-latitude handling and explicit manual adjustments.
- Gregorian and Hijri/Umm al-Qura date presentation with local civil-date, DST and rollover handling.
- Browser and native foreground location, manual coordinates, offline city search, saved locations and offline IANA timezone resolution.
- Calculated, adjusted and local-mosque timetable modes with validated CSV/JSON import/export, Iqamah rules and multiple Jumu'ah sessions.
- English and Arabic localisation, RTL/bidirectional handling, light/dark/system themes, scalable text, keyboard navigation and touch-oriented layouts.
- Android and iOS/iPadOS native shells with local persistence, prayer-notification scheduling and documented lifecycle/platform limits.
- Private user-selected local Adhan audio with foreground playback attempts and notification-based background/terminated delivery.
- PWA offline shell, Raspberry Pi Touch Display 2 deployment/fixtures and browser-based smart-display mode for TV/kiosk use.
- Permanent security, dependency, documentation, Android, iOS and 14-scenario visual-regression quality gates.

### Fixed

- iPhone safe-area handling for status-bar/Dynamic-Island insets, with a source-contract regression test.
- Responsive overflow cases found by the automated Arabic/RTL and scalable-text visual matrix.

### Release validation boundary

- v1.0.0 is a production repository/source release. It does not claim App Store/Play Store publication or signed store binaries.
- Physical iPhone/iPad, Android OEM, Raspberry Pi Touch Display 2 and TV/panel acceptance remains explicitly unperformed where recorded in TODO.md and platform documentation.
- Emulator, Simulator and browser evidence is not represented as physical-hardware evidence.

---

**Author:** privacyOG
`);

write('RELEASE_NOTES.md', `# SalahOS v1.0.0 release notes

**Release date:** 2026-08-18

SalahOS v1.0.0 is the first production repository/source release of the local-first Islamic prayer-time application and smart-display ecosystem. One shared prayer/time model is used across Web/PWA, Android, iOS/iPadOS, Raspberry Pi and browser-based TV/kiosk presentation paths.

## Prayer and calendar functionality

- Five obligatory prayer calculations plus Sunrise.
- Standard/Shafi'i-family and Hanafi Asr conventions.
- Multiple recognised calculation-method profiles plus explicit manual prayer adjustments.
- Middle-of-the-Night, One-Seventh and Angle-Based high-latitude strategies, with unavailable polar astronomical events left unavailable rather than silently fabricated.
- Gregorian and Hijri/Umm al-Qura presentation with optional manual Hijri correction.
- Current/next prayer state, live countdown and tomorrow-Fajr rollover.
- Optional Imsak/Ishraq, Islamic midnight and last-third calculations in the shared domain model.

## Location and timezone

- User-initiated one-shot current-location acquisition on browser and native shells.
- Manual latitude/longitude entry and offline local city/location search.
- Saved favourite locations.
- Offline coordinate-to-IANA timezone resolution and persisted timezone reuse.
- IANA daylight-saving and local-date handling rather than longitude-derived fixed offsets.

## Local mosque support

- Calculated, calculated-with-adjustments and local-mosque source modes.
- Manual timetable entry and validated CSV/JSON import/export.
- Multiple locally saved mosque timetables.
- Fixed or prayer-start-plus-offset Iqamah rules.
- One or multiple mosque-specific Jumu'ah sessions independent of astronomical Dhuhr.
- Fully local/offline timetable operation after configuration.

## Notifications and Adhan

- Per-prayer enable/disable, optional reminder, prayer-time alert and Adhan-alert controls.
- Default or silent alert selection and vibration preference where the platform can represent it.
- Deterministic notification ownership, cancellation, replacement, date-rollover reconciliation and DST wall-clock resolution.
- Android exact-alarm fallback policy and reboot-restoration contract.
- Native Android/iOS scheduling adapters with explicit lifecycle/platform limitations.
- Private user-selected local Adhan recording stored locally, with foreground playback attempts only; background/terminated delivery remains notification-based.
- No bundled copyrighted Adhan recording.

## Display, localisation and accessibility

- English and Arabic localisation with RTL document direction and bidirectional isolation.
- Light, dark and follow-system themes.
- High-contrast, scalable, keyboard-accessible and touch-oriented shared UI.
- Dedicated smart-display mode with large clock/countdown, prayer timetable, Iqamah, Jumu'ah and current/next highlighting.
- Raspberry Pi Touch Display 2 fixtures and Chromium kiosk launcher/autostart tooling.
- Burn-in-conscious smart-display position shifting and practical keyboard/remote exit handling.
- Permanent 14-scenario browser visual regression across phone, tablet, Raspberry Pi fixtures, 1080p/4K display, English/Arabic and scalable-text cases.

## Offline, privacy and security

- Local prayer calculation with no mandatory remote service or account.
- Versioned local settings persistence and native Preferences-backed storage on mobile shells.
- PWA application-shell cache and offline reload support.
- Persisted mosque timetables and saved locations.
- Runtime recovery for date rollover, clock correction, suspend/resume and network loss.
- Local-first privacy/threat model, least-privilege native permissions and no background/always-location capability.
- Repository gates for sensitive files, native permissions, unreviewed remote application networking, dependency vulnerabilities and dependency licences.
- Web Content Security Policy baseline and strict validation of imported settings/timetable data.
- No signing credentials or distribution secrets committed to the repository.

## Automated release evidence

The production release revision must pass all four permanent gates before tagging:

- Quality Gate — security/policy checks, dependency audit/licences, docs, formatting, lint, strict typecheck, complete tests, production build and deploy-artifact verification.
- Android Build — clean dependency install, Android SDK setup, Capacitor sync and Gradle debug assembly.
- Visual Regression — the permanent 14-scenario production-browser matrix with retained evidence.
- iOS Build — macOS repository quality gate, production build/Capacitor sync, Xcode Simulator compilation, then fresh iPhone and iPad Simulator install/launch/terminate/relaunch with retained screenshots/evidence.

## Explicitly unperformed physical/target acceptance

The following are not claimed as tested by v1.0.0 and remain documented follow-up validation:

- physical iPhone/iPad GPS, notification timing while locked/terminated, haptics, audio-session/focus/interruption, reboot lifecycle, signed archive, TestFlight and App Store acceptance;
- network-isolated iOS Simulator/device cold-start acceptance;
- physical Android OEM notification timing/Doze behaviour, real-device GPS lifecycle, vibration/channel behaviour, audio focus/interruption and production distribution signing;
- physical Raspberry Pi Touch Display 2 boot/autostart, touch, rotation, power-loss and long-duration operation;
- physical TV/panel viewing-distance readability, real remote/HDMI-CEC behaviour and long-duration panel testing;
- human aesthetic sign-off beyond the automated English/Arabic/RTL geometry and visual-regression checks;
- institutional certification of calculation profiles where the documentation explicitly distinguishes interoperability/reference parity from an authority's own unpublished internal model.

These open items are limitations of validation evidence, not assertions that the corresponding hardware behaviour has passed. See TODO.md, TESTING.md and docs/PLATFORM_STATUS.md for the exact boundary.

## Author

privacyOG
`);

let readme = read('README.md');
const releaseStart = readme.indexOf('## Release status\n');
const authorStart = readme.indexOf('## Author\n', releaseStart);
if (releaseStart < 0 || authorStart < 0) throw new Error('README release section not found');
const releaseSection = `## Release status

SalahOS v1.0.0 is prepared as the first production repository/source release. The exact release revision must pass Quality Gate, Android Build, Visual Regression and iOS Build/Simulator acceptance together before the tag is created. This release boundary intentionally does not convert unperformed physical iPhone/iPad, Android OEM, Raspberry Pi Touch Display 2 or TV/panel checks into completed evidence, and it does not imply App Store/Play Store publication or signed store binaries.

The tested platform matrix and remaining physical/target-environment validation are documented in [docs/PLATFORM_STATUS.md](docs/PLATFORM_STATUS.md), [TESTING.md](TESTING.md) and [TODO.md](TODO.md).

`;
readme = readme.slice(0, releaseStart) + releaseSection + readme.slice(authorStart);
write('README.md', readme);

let todo = read('TODO.md');
todo = replaceOnce(
  todo,
  '**Release-blocker reconciliation note (2026-08-17):** all current `[!]` items identify physical or target-environment evidence that is still genuinely unavailable. PR #101 code-bearing head `b0699274ef41980d03f0321346eabe5ae758758f` passed the complete automated release-candidate gate set: Quality Gate `32032477140`, Android Build `32032477112`, Visual Regression `32032477113` and iOS Build `32032477111`. The latest iOS artifact was manually reviewed after fixing the discovered iPhone safe-area defect. Physical iPhone/iPad behavior, real mobile notification/audio timing, network-isolated iOS cold start, physical Raspberry Pi Touch Display 2 and physical TV/kiosk acceptance remain explicit post-release validation items and are not represented as completed by emulator/Simulator/browser evidence. The exact final documentation head must still retain all four automated gates before merge and tagging.',
  '**Release-boundary reconciliation note (2026-08-18):** PR #101 merged the permanent iOS runtime gate, the reviewed iPhone safe-area correction and the final code/documentation review. The first production repository/source release is permitted to ship once the exact versioned release revision passes Quality Gate, Android Build, Visual Regression and iOS Build together. Current `[!]` items remain genuine unperformed physical/target-environment acceptance and are deliberately non-blocking for the source release only because they are explicitly disclosed; they must not be relabelled as tested. This release does not imply App Store/Play Store publication or signed store binaries.',
  'release blocker note',
);
todo = replaceOnce(
  todo,
  'SalahOS v1 must not be declared complete until the following are true:',
  'For the v1.0.0 repository/source release, completion means the implemented software and permanent automated acceptance gates are release-ready. Physical hardware and store-distribution acceptance may remain open only when the corresponding `[!]`/partial items stay explicitly documented and are not represented as tested:',
  'v1 completion rule',
);
todo = todo.replace('- [ ] Mobile, Raspberry Pi and TV/kiosk layouts are validated', '- [~] Mobile, Raspberry Pi and TV/kiosk layouts have automated/emulator/Simulator/browser validation; physical target acceptance remains open');
todo = todo.replace('- [ ] Notifications/Adhan work on supported platforms within platform restrictions', '- [~] Notifications/Adhan are implemented within documented platform restrictions; physical delivery/audio-policy timing acceptance remains open');
todo = todo.replace('- [x] Automated release-candidate gates pass — code-bearing PR #101 head `b0699274ef41980d03f0321346eabe5ae758758f` passed Quality Gate `32032477140`, Android Build `32032477112`, Visual Regression `32032477113` and iOS Build `32032477111`; the exact final documentation head must retain the same gate set before merge/tagging', '- [x] Permanent release-candidate gate set exists and has passed together on reviewed PR #101 revisions; the exact v1.0.0 release revision must pass the same four gates before tagging');
const finalReviewLine = '- [x] Final code review and regression pass are complete';
if (!todo.includes(finalReviewLine)) throw new Error('Final review marker missing');
todo = todo.replace(finalReviewLine, `${finalReviewLine}\n- [x] v1.0.0 release policy explicitly preserves unperformed physical-hardware/store-distribution acceptance as documented follow-up rather than claiming it passed`);
write('TODO.md', todo);

let platform = read('docs/PLATFORM_STATUS.md');
const releaseRuleStart = platform.indexOf('## Release rule\n');
if (releaseRuleStart < 0) throw new Error('Platform release rule not found');
platform = platform.slice(0, releaseRuleStart) + `## Release rule

The v1.0.0 production repository/source release requires one exact revision with fresh passing Quality Gate, Android Build, Visual Regression and iOS Build/Simulator acceptance results. Physical target-notification, target-audio, target-display, signing and store-distribution acceptance remains open where identified above and is not inferred from automated, emulator, Simulator or browser execution.

Shipping v1.0.0 does not change any **Physical acceptance open** entry to verified. Those items remain follow-up validation and must be recorded separately when target hardware becomes available.
`;
write('docs/PLATFORM_STATUS.md', platform);

console.log('Prepared SalahOS v1.0.0 release metadata and documentation.');
