# Home Prayer Hub — physical device acceptance

**Project developer:** PrivacyOG  
**Status:** Pending. This is a repeatable protocol, not evidence that a physical device passed.

The Home Prayer Hub shares SalahOS's prayer-time engine. Verify the displayed time and selected method/source independently. Browser/Playwright, Android emulator and unsigned iOS Simulator CI checks do not substitute for real hardware, native notification delivery or signed distribution.

## Preparation

Record the exact Git commit, package version, location and timezone, selected method/Asr convention, Android/iOS version and actual hardware model. Use a test location and timetable. Do not expose personal geolocation or account credentials in issue comments, logs, screenshots or CI artifacts. Obtain approval before changing a production mosque display.

## Android acceptance (pending)

| ID | Procedure | Passing evidence |
| --- | --- | --- |
| A01 | Clean-install the matching debug APK on a physical phone/tablet; choose manual location and Home Hub theme | All five obligatory prayer times, source status, clock, dates, next prayer and countdown appear; no fabricated or clipped values |
| A02 | Start in landscape 1280×800-class orientation, then rotate portrait and back | Landscape prayer cards remain legible; portrait scrolls vertically without side overflow, Iqamah values remain accurate |
| A03 | Switch to airplane mode after installation and offline asset preparation; cold-start again while still offline | App launches from native bundle, retains saved location/method/locale, updates clock and prayer schedule without network |
| A04 | Lock/unlock and leave display asleep for at least 10 minutes; foreground it again | Clock, remaining countdown and next-prayer state recalculate from current local instant |
| A05 | Verify a real clock/day rollover and Sydney DST transition if practical | Date, time, timezone and next prayer agree with selected source; no skipped/duplicated prayers |
| A06 | Grant and deny notification permission in separate runs; lock/background app through a scheduled prayer | Record actual Android notification arrival separately from foreground Adhan; include OEM battery policy and exact-alarm state |
| A07 | Change source between calculated and valid local congregation timetable | No Iqamah placeholders with calculated-only data; sourced Iqamah values appear in dedicated Home Hub but not ordinary mobile Today |
| A08 | Enable reduced motion/high-contrast accessibility settings | Prayer text, current/next indication and time values stay readable; verify device-specific burn-in mitigation |

## iOS and iPadOS acceptance (pending)

| ID | Procedure | Passing evidence |
| --- | --- | --- |
| I01 | On macOS/Xcode, sign and install exact revision on physical iPhone and iPad | App boots, persists settings, renders prayer times in both orientations and relaunches |
| I02 | Cold-start in airplane mode after native bundle is installed | Offline core calculations, mosque selection and Arabic/RTL remain usable |
| I03 | Lock/unlock, suspend, force-quit and relaunch | Display refreshes clock, dates and countdown; no unsupported full-Adhan background playback claims |
| I04 | Allow and deny notifications; validate prayer notification on locked/backgrounded device | Record permissions, Focus state and actual device delivery timestamp |
| I05 | Validate an Xcode Release archive with the intended PrivacyOG team and provisioning | Archive validation and distribution eligibility pass independently of simulator compilation |

## Browser/PWA and home touchscreen acceptance (pending)

| ID | Procedure | Passing evidence |
| --- | --- | --- |
| P01 | Install PWA over HTTPS on physical 16:10 touchscreen; revisit offline | Cached shell launches and core prayer data works from saved location; document first-install cache |
| P02 | Leave display running overnight through Sydney civil midnight | Gregorian/Hijri date, five prayers, next prayer and countdown roll over without refresh |
| P03 | Check English/Arabic RTL, 12h/24h formatting and alternate calculation method | No clipping or wrong next-day offset; configuration persists |
| P04 | Confirm keyboard/touch focus and forced colours | Prayer information remains understandable; axe checks supplement, not replace, device acceptance |

## Recording evidence

For each test record test ID, Git commit, platform/version, device model, build identity, non-sensitive timezone, procedure, observed result, UTC timestamp, result, and redacted screenshot/log. Use distinct outcomes NOT RUN, BLOCKED, FAILED and PASSED.

An apparently successful GitHub workflow cannot turn a timed-out or non-blocking simulator runtime stage into a passed physical-device check. SalahOS's iOS CI compiles a native simulator target but currently treats fresh-device install/launch acceptance as a separately reported, non-blocking step. Its optional cosmetic appearance command is not an application-level failure; install, launch, relaunch, theme persistence and settled screenshots still have to succeed.

Reference procedures: [Android build](ANDROID.md), [iOS signing](IOS_BUILD_SIGNING.md), [Adhan rights/playback limits](ADHAN_AUDIO_LIBRARY.md), [Home Hub specification](HOME_PRAYER_HUB.md).

**Release rule:** Keep Home Hub in draft until hardware/distribution checks, existing editorial restrictions and PrivacyOG's explicit approval are satisfied.
