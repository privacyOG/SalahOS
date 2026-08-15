# SalahOS — TODO / Implementation Tracker

> Cross-platform Islamic prayer time app and smart display ecosystem for Android, iOS, Raspberry Pi, TV and kiosk displays.

## Status convention

- [ ] Not started
- [~] In progress
- [x] Completed and verified
- [!] Blocked — reason must be documented

**Rule:** Do not mark an item complete merely because code was written. A task is complete only when implemented, tested, and documented where applicable.

---

## 0. Project foundation and research

- [x] Confirm project scope, supported platforms and MVP acceptance criteria
- [x] Create `DESIGN.md` for architecture and technical decisions
- [x] Create `RESEARCH.md` for prayer-calculation, platform and jurisprudential research
- [x] Create `TESTING.md` for test strategy, evidence and discrepancies
- [x] Create `CHANGELOG.md`
- [x] Choose and document the cross-platform framework and deployment strategy
- [x] Define repository structure and coding conventions
- [~] Configure formatter, linter, strict type checking and test runner
- [~] Add CI workflow for lint, typecheck, tests and production build
- [~] Pin dependencies and commit lockfile for reproducible builds
- [x] Define privacy principles: local-first operation, minimal telemetry, no unnecessary location transmission

**Stage 0 verification note (2026-08-16):** documentation, scope, architecture, conventions and privacy principles are committed. Tooling and CI remain in progress until the branch quality gate executes successfully. Exact direct dependency versions are pinned; the lockfile remains outstanding and therefore reproducible-install completion is not claimed.

---

## 1. Prayer-time domain model and calculation engine — CRITICAL PATH

### 1.1 Core astronomical engine

- [~] Implement pure prayer-calculation engine with no UI, DOM or network dependency
- [~] Implement Julian date / solar-position calculations
- [~] Implement equation of time and solar declination calculations
- [~] Implement solar noon calculation
- [~] Implement sunrise and sunset calculations
- [x] Document atmospheric refraction, sunrise/sunset depression and observer-elevation assumptions
- [ ] Implement deterministic calculation rounding policy in a dedicated module
- [ ] Keep raw calculated times separate from displayed/rounded times
- [ ] Add provenance metadata to every calculated result

### 1.2 Five daily prayers and supplementary times

- [ ] Calculate Fajr
- [ ] Calculate Dhuhr
- [ ] Calculate Asr
- [ ] Calculate Maghrib
- [ ] Calculate Isha
- [ ] Calculate and display Sunrise separately from the five obligatory prayers
- [ ] Add optional Imsak/Suhur cutoff support
- [ ] Add optional Duha/Ishraq support
- [ ] Add optional Islamic midnight calculation
- [ ] Add optional last-third-of-the-night calculation

### 1.3 Calculation-method registry

- [ ] Build an extensible calculation-method registry rather than hard-coding method logic throughout the engine
- [ ] Record each method's Fajr angle, Isha angle/interval, Maghrib rule where applicable and authoritative source
- [ ] Implement and verify Muslim World League method
- [ ] Implement and verify Umm al-Qura / Makkah method
- [ ] Implement and verify Egyptian method
- [ ] Implement and verify University of Islamic Sciences, Karachi method
- [ ] Implement and verify ISNA method
- [ ] Research and add other reputable regional methods where appropriate, including Diyanet/Turkey, MUIS/Singapore, Dubai, Kuwait and Qatar
- [ ] Provide custom calculation parameters for advanced users where safe and clearly labelled
- [ ] Never silently change an explicitly selected calculation method

### 1.4 Madhhab / Asr calculation

- [ ] Implement Standard Asr shadow factor (Shafi'i, Maliki and Hanbali convention)
- [ ] Implement Hanafi Asr shadow factor
- [ ] Set Shafi'i/Standard as initial default while allowing user selection
- [ ] Keep internal terminology mathematically precise (`Standard` / `Hanafi`) while explaining madhhab associations in UI
- [ ] Add unit tests proving both shadow-factor branches differ correctly

### 1.5 High-latitude handling

- [ ] Implement Middle of the Night rule
- [ ] Implement One-Seventh of the Night rule
- [ ] Implement Angle-Based portion-of-night rule
- [ ] Research nearest-latitude / nearest-valid-day strategies for extreme polar conditions
- [ ] Define behaviour for polar day and polar night when normal astronomical events are unavailable
- [ ] Never fabricate an astronomical event without identifying the applied fallback rule
- [ ] Surface active high-latitude rule in calculation provenance/settings

### 1.6 Manual adjustments

- [ ] Support per-prayer minute offsets
- [ ] Keep adjustments separate from the underlying astronomical result
- [ ] Show when a displayed time contains a manual adjustment
- [ ] Allow reset-to-method-default

---

## 2. Prayer-calculation validation and reference parity

- [ ] Archive or pin the canonical reference implementation used for algorithm comparison
- [ ] Create independent cross-check dataset instead of treating one online API as absolute ground truth
- [ ] Compare against canonical calculation implementation
- [ ] Compare against AlAdhan or another reputable independent calculator as a secondary cross-check
- [ ] Compare against authoritative published timetables where practical
- [ ] Record rounding, offsets and methodology differences instead of forcing false parity

### Geographic test matrix

- [ ] Makkah
- [ ] Madinah
- [ ] Sydney
- [ ] Melbourne
- [ ] Cairo
- [ ] Istanbul
- [ ] Karachi
- [ ] Jakarta
- [ ] Singapore
- [ ] London
- [ ] New York
- [ ] Oslo
- [ ] Tromsø
- [ ] Equatorial location
- [ ] Northern-hemisphere location
- [ ] Southern-hemisphere location
- [ ] Extreme high-latitude summer case
- [ ] Extreme high-latitude winter case

### Date/time edge cases

- [ ] DST start transition
- [ ] DST end transition
- [ ] Leap year
- [ ] Gregorian year boundary
- [ ] Local midnight rollover
- [ ] Next-prayer calculation after Isha → tomorrow's Fajr
- [ ] Timezone-offset changes
- [ ] Southern-hemisphere DST direction
- [ ] Device clock correction while app is running
- [ ] System suspend/resume recovery

---

## 3. Location and timezone subsystem

- [ ] Implement browser geolocation adapter
- [ ] Implement native Android/iOS location adapter
- [ ] Support manual latitude/longitude entry
- [ ] Support manual city/location search
- [ ] Support saved/favourite locations
- [ ] Support current-location refresh
- [ ] Handle denied-location-permission flow gracefully
- [ ] Handle unavailable GPS/location services gracefully
- [ ] Fall back to saved/manual location without breaking prayer calculations
- [ ] Resolve coordinates to an IANA timezone
- [ ] Cache timezone data for offline use
- [ ] Use IANA timezone rules rather than deriving timezone from longitude
- [ ] Correctly handle UTC offsets and daylight-saving changes
- [ ] Avoid continuous GPS polling when not required
- [ ] Avoid sending precise location to remote services unless required and explicitly disclosed

---

## 4. Gregorian and Hijri calendar subsystem

- [ ] Display Gregorian date
- [ ] Implement Hijri date support
- [ ] Support Umm al-Qura / selected calculated Hijri calendar where platform/runtime permits
- [ ] Clearly identify whether Hijri date is calculated or based on a selected calendar convention
- [ ] Allow manual Hijri day correction (for example ±1/±2 days)
- [ ] Test Hijri month boundaries
- [ ] Test Hijri year boundaries
- [ ] Test Ramadan boundary behaviour
- [ ] Ensure date changes update without requiring app restart

---

## 5. Local mosque timetable system

### 5.1 Source modes

- [ ] Implement `Calculated` prayer-time source mode
- [ ] Implement `Local Mosque` timetable source mode
- [ ] Implement `Calculated + Adjustments` source mode
- [ ] Show active source/provenance clearly in the UI

### 5.2 Timetable management

- [ ] Support manual mosque timetable entry
- [ ] Support CSV timetable import
- [ ] Define and document CSV schema
- [ ] Ship sample timetable file
- [ ] Support JSON import/export
- [ ] Validate imported timetable data before activation
- [ ] Preserve mosque timetable offline
- [ ] Research optional reputable mosque APIs/integrations
- [ ] Do not rely on fragile arbitrary website scraping as an authoritative source

### 5.3 Salah start vs Iqamah/Jama'ah

- [ ] Model prayer-start time separately from Iqamah/Jama'ah time
- [ ] Support fixed Iqamah time
- [ ] Support Iqamah as `prayer start + N minutes`
- [ ] Support timetable-provided Iqamah times
- [ ] Clearly distinguish Adhan/start and Iqamah on smart displays

### 5.4 Jumu'ah

- [ ] Detect Friday and support Jumu'ah presentation
- [ ] Support one or multiple Jumu'ah sessions
- [ ] Store Khutbah/Jumu'ah times independently of astronomical Dhuhr
- [ ] Allow mosque-specific Friday configuration

---

## 6. Internationalisation, Arabic and RTL

- [ ] Build localisation framework from the beginning
- [ ] English translation complete
- [ ] Arabic translation complete
- [ ] Enable `dir="rtl"` correctly for Arabic
- [ ] Verify mixed Arabic/Latin text rendering
- [ ] Verify Arabic numerals/date/time formatting choices
- [ ] Ensure prayer names have correct Arabic forms
- [ ] Keep all user-facing text out of hard-coded components
- [ ] Design translation structure for additional languages later
- [ ] Test RTL at every major breakpoint

---

## 7. Core UI / UX

### 7.1 Shared prayer dashboard

- [ ] Current local time
- [ ] Gregorian date
- [ ] Hijri date
- [ ] Current location / selected mosque
- [ ] Today's five prayer times
- [ ] Sunrise as supplementary information
- [ ] Next-prayer indicator
- [ ] Live next-prayer countdown
- [ ] Highlight current/next prayer
- [ ] Calculation method/source indicator
- [ ] Iqamah time where configured
- [ ] High-latitude/manual-adjustment indicator when applicable

### 7.2 Responsive layouts

- [ ] Phone portrait layout
- [ ] Phone landscape layout
- [ ] Tablet layout
- [ ] Raspberry Pi Touch Display 2 first-class layout
- [ ] 1920×1080 TV/kiosk layout
- [ ] Large-format display layout
- [ ] Avoid separate duplicated application logic for each form factor

### 7.3 Themes and accessibility

- [ ] Light theme
- [ ] Dark theme
- [ ] Follow-system theme
- [ ] High-contrast readable typography
- [ ] Scalable text
- [ ] Keyboard navigation
- [ ] Touch-friendly controls
- [ ] Appropriate semantic/ARIA roles on web targets
- [ ] Visible focus state
- [ ] Respect reduced-motion preference where applicable
- [ ] Validate TV readability from several metres away

---

## 8. Android application

- [ ] Configure Android project/shell
- [ ] Implement native location permissions
- [ ] Implement persistent settings/storage
- [ ] Implement local prayer notifications
- [ ] Implement Android exact-alarm strategy where permitted and required
- [ ] Handle Android battery optimisation/background restrictions honestly
- [ ] Implement Adhan playback policy compatible with Android lifecycle constraints
- [ ] Handle notification permission versions correctly
- [ ] Test offline cold start
- [ ] Test orientation changes
- [ ] Build signed/release-ready configuration without committing secrets
- [ ] Run on real Android device or emulator and record evidence

---

## 9. iOS / iPadOS application

- [ ] Configure iOS project/shell
- [ ] Implement location permission descriptions and flow
- [ ] Implement persistent settings/storage
- [ ] Implement local prayer notifications within iOS scheduling limits
- [ ] Implement Adhan/notification audio within Apple platform restrictions
- [ ] Handle background execution limitations explicitly
- [ ] Test iPhone responsive layout
- [ ] Test iPad responsive layout
- [ ] Test offline cold start
- [ ] Prepare signing/build documentation without committing credentials
- [ ] Run on simulator/device when macOS/Xcode environment is available
- [ ] Document untested iOS items honestly when unavailable on development host

---

## 10. Notifications and Adhan

- [ ] Per-prayer notification enable/disable
- [ ] Reminder N minutes before prayer
- [ ] Prayer-time notification
- [ ] Per-prayer sound choice
- [ ] Vibration option where supported
- [ ] Adhan enable/disable
- [ ] User-selectable/local Adhan audio
- [ ] Do not bundle copyrighted Adhan recordings without suitable rights
- [ ] Reschedule notifications after timezone/location/method changes
- [ ] Reschedule notifications after device reboot where platform requires it
- [ ] Reschedule future prayer notifications at date rollover
- [ ] Prevent duplicate notifications
- [ ] Test notification behaviour across DST transition
- [ ] Document platform-specific limitations instead of promising impossible exact behaviour

---

## 11. Raspberry Pi Touch Display 2

- [ ] Research and document Raspberry Pi Touch Display 2 resolution/orientation constraints
- [ ] Build touch-first layout fixture for the display
- [ ] Provide Raspberry Pi OS installation instructions
- [ ] Provide one-command or simple launcher script
- [ ] Provide optional automatic launch on boot
- [ ] Implement Chromium/full-screen kiosk mode where applicable
- [ ] Persist settings across restart
- [ ] Operate without internet after initial configuration
- [ ] Recover gracefully when network disappears
- [ ] Recover after system suspend/reboot
- [ ] Prevent display from getting stuck on yesterday's prayer schedule
- [ ] Test on physical Raspberry Pi / Touch Display 2 when available

---

## 12. TV and kiosk display mode

- [ ] Create dedicated smart-display mode using shared app logic
- [ ] Large current clock
- [ ] Large next-prayer countdown
- [ ] Five-prayer timetable visible at a glance
- [ ] Iqamah/Jama'ah display where configured
- [ ] Jumu'ah display on Fridays
- [ ] Current/next-prayer highlighting
- [ ] Full-screen/kiosk operation
- [ ] Automatic daily schedule rollover
- [ ] Automatic timezone/DST update
- [ ] Sleep/wake recovery
- [ ] Burn-in-conscious layout behaviour where practical
- [ ] Remote-control/keyboard navigation where practical
- [ ] Document supported TV deployment paths rather than claiming unsupported native platforms

---

## 13. Offline-first / PWA capability

- [ ] Create web app manifest
- [ ] Add installable PWA icons/assets
- [ ] Implement service worker/static application shell caching
- [ ] Keep prayer calculation engine fully local/offline
- [ ] Persist selected location/timezone/calculation settings locally
- [ ] Persist mosque timetable locally
- [ ] Provide clear online/offline state only where relevant
- [ ] Verify app remains useful with internet disabled
- [ ] Test offline page reload
- [ ] Test cache/version migration after app upgrade

---

## 14. Settings and persistent configuration

- [ ] Calculation method selector
- [ ] Asr method selector
- [ ] High-latitude rule selector
- [ ] Manual prayer offsets
- [ ] Location selector
- [ ] Mosque/source selector
- [ ] Hijri correction
- [ ] Language selector
- [ ] Theme selector
- [ ] Time format (12/24-hour)
- [ ] Per-prayer notifications
- [ ] Adhan settings
- [ ] Iqamah settings
- [ ] Export settings
- [ ] Import settings
- [ ] Reset to defaults
- [ ] Version/migration system for persisted configuration

---

## 15. Runtime reliability

- [ ] Recompute prayer schedule when local date changes
- [ ] Recompute after location change
- [ ] Recompute after calculation-method change
- [ ] Recompute after Asr-method change
- [ ] Recompute after timezone/DST change
- [ ] Re-sync clock/countdown after app resumes from background
- [ ] Recover correctly after system sleep/wake
- [ ] Detect significant system-clock changes
- [ ] Avoid countdown drift from long-running intervals
- [ ] Handle invalid system time gracefully
- [ ] Handle unavailable calculation results gracefully
- [ ] Add structured error logging without exposing private location unnecessarily

---

## 16. Privacy and security

- [ ] Document threat/privacy model
- [ ] Minimise collection of precise location data
- [ ] Keep prayer calculations local by default
- [ ] No mandatory account for core prayer-time functionality
- [ ] No unnecessary analytics/telemetry
- [ ] Obtain explicit permission before using location
- [ ] Secure any optional remote API calls
- [ ] Do not commit secrets/API keys
- [ ] Dependency vulnerability review
- [ ] Content Security Policy for web/PWA where applicable
- [ ] Validate imported CSV/JSON data safely
- [ ] Review native permissions and remove unnecessary ones

---

## 17. Automated test suite

### Unit tests

- [~] Solar/astronomical math tests
- [ ] Prayer-engine tests
- [ ] Calculation-method tests
- [ ] Asr-method tests
- [ ] High-latitude tests
- [ ] Rounding tests
- [ ] Adjustment tests
- [ ] Next-prayer tests
- [ ] Timezone/DST tests
- [ ] Hijri-date tests
- [ ] Mosque timetable tests
- [ ] CSV/JSON import/export tests
- [ ] Iqamah-rule tests
- [ ] Settings persistence/migration tests

### Integration tests

- [ ] Location → timezone → prayer calculation flow
- [ ] Mosque source-selection isolation
- [ ] Settings → recalculation flow
- [ ] Date rollover flow
- [ ] Notification scheduling flow
- [ ] Offline startup flow

### UI / visual regression

- [ ] Phone portrait — English/light
- [ ] Phone portrait — Arabic/RTL/dark
- [ ] Phone landscape
- [ ] Tablet
- [ ] Raspberry Pi Touch Display 2
- [ ] 1080p kiosk
- [ ] Verify no clipping/overflow
- [ ] Verify Arabic/RTL alignment
- [ ] Verify scalable text/accessibility
- [ ] Save screenshots/artifacts in CI where practical

---

## 18. Quality gates

- [ ] Formatter clean
- [ ] Linter clean
- [ ] Strict typecheck clean
- [ ] Unit tests green
- [ ] Integration tests green
- [ ] UI/component tests green
- [ ] Production web build succeeds
- [ ] Android build succeeds where SDK is available
- [ ] iOS build succeeds where Xcode is available
- [ ] Raspberry Pi/kiosk deployment script validated
- [ ] No unexplained widened test tolerances
- [ ] No disabled failing tests without documented blocker
- [ ] No placeholder implementation marked complete
- [ ] Final dependency/license review

---

## 19. Documentation and deployment

- [~] Expand `README.md` with screenshots, features and platform status
- [ ] Create `BUILD.md`
- [ ] Document web/PWA build and deployment
- [ ] Document Android build/install
- [ ] Document iOS build/install
- [ ] Document Raspberry Pi Touch Display 2 setup
- [ ] Document TV/kiosk deployment
- [ ] Document prayer calculation methods and references
- [ ] Document privacy behaviour
- [ ] Document mosque timetable import format
- [ ] Document notification platform limitations
- [ ] Add troubleshooting section
- [x] Add contributor/development setup instructions

---

## 20. Final verification / release readiness

- [ ] Run clean install from lockfile
- [ ] Run complete test suite from a clean checkout
- [ ] Run lint + typecheck + production build
- [ ] Run prayer-time parity/reference suite
- [ ] Run DST/high-latitude regression suite
- [ ] Run English + Arabic/RTL visual suite
- [ ] Validate offline operation
- [ ] Validate phone layout
- [ ] Validate Raspberry Pi layout
- [ ] Validate TV/kiosk layout
- [ ] Validate Android notifications on supported test environment
- [ ] Validate iOS notifications on supported test environment
- [ ] Perform fresh final code review
- [ ] Review all `[!]` blocked items and document reasons
- [ ] Ensure `TODO.md`, `DESIGN.md`, `RESEARCH.md` and `TESTING.md` reflect actual state
- [ ] Create release notes
- [ ] Tag first release only after applicable quality gates are satisfied

---

## 21. Phase 2 / future roadmap

- [ ] Qibla bearing from current coordinates
- [ ] Device compass integration where supported
- [ ] Ramadan mode
- [ ] Suhur/Imsak and Iftar presentation
- [ ] Taraweeh timetable support
- [ ] Mosque announcements/events
- [ ] Configurable smart-display themes
- [ ] Multiple mosque profiles
- [ ] Remote administration for managed mosque displays
- [ ] Home Assistant integration
- [ ] Optional local network API for smart-home/display integration
- [ ] Calendar integrations
- [ ] Wearable/watch companion exploration
- [ ] Additional languages

---

## Definition of Done for SalahOS v1

SalahOS v1 must not be declared complete until the following are true:

- [ ] Accurate five-prayer calculation engine is independently testable
- [ ] Major recognised calculation methods are implemented and documented
- [ ] Standard/Shafi'i-family and Hanafi Asr calculations are validated
- [ ] High-latitude handling is implemented and transparent
- [ ] Local mosque timetable mode works offline
- [ ] Prayer-start and Iqamah/Jama'ah times are distinct
- [ ] Jumu'ah timetable support is functional
- [ ] GPS/manual location and timezone handling work correctly
- [ ] DST/date rollover behaviour is tested
- [ ] Gregorian and Hijri dates work
- [ ] English and Arabic/RTL are production-ready
- [ ] Mobile, Raspberry Pi and TV/kiosk layouts are validated
- [ ] Offline prayer calculation is fully functional
- [ ] Notifications/Adhan work on supported platforms within platform restrictions
- [ ] Automated quality gates pass
- [ ] Actual tested platform/build matrix is documented without overclaiming
- [ ] Final code review and regression pass are complete
