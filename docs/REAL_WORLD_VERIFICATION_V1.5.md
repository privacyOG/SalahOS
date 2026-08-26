# SalahOS v1.5 real-world verification

This document defines the Stage 9 and Stage 10 verification contract for SalahOS v1.5.0. It distinguishes automated device emulation from physical-hardware evidence so release status is not overstated.

## Location, weather and mosque-data acceptance

The permanent unit suite covers the location and weather failure ladders that can affect prayer context:

- browser and native location prefer precise fixes and fall back to approximate/network-assisted fixes only after non-terminal precision failures;
- permission denial is terminal and does not trigger redundant location requests;
- failure of both precise and approximate acquisition returns a failure rather than inventing coordinates;
- weather uses live resolved location, caches successful current/daily context, serves an unexpired cache as stale after network/provider failures, expires old cache data, and never fabricates weather when no cache exists;
- local-mosque prayer mode remains authoritative over calculated times, exposes missing mosque entries as unavailable instead of silently substituting calculated values, and rejects wrong-date timetable data;
- mosque directory quality scoring verifies completeness, provenance coverage, freshness boundaries and conflict penalties;
- unsafe mosque website/social URLs are removed before they can become user actions;
- browser acceptance verifies distance ordering, selection, favourite persistence, directions, report/edit routing, verification/freshness labels, data-quality metadata and downloadable directory-pack provenance.

## Device acceptance matrix

| Target                     | Automated release evidence                                                                                                                          | Physical-device status                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Android phone              | Android API 35 `pixel_7_pro` emulator install/launch lifecycle plus 412×915 browser semantic/text-scale acceptance                                  | Physical OEM hardware is not attached to GitHub CI; use physical acceptance when hardware is available. |
| iPhone                     | Fresh iPhone Simulator install/launch/relaunch plus 390×844 browser semantic/text-scale acceptance                                                  | Physical iPhone hardware is not attached to GitHub CI.                                                  |
| iPad                       | Fresh iPad Simulator install/launch/relaunch plus 820×1180 browser semantic/text-scale acceptance                                                   | Physical iPad hardware is not attached to GitHub CI.                                                    |
| Raspberry Pi Touch Display | Browser acceptance at representative 5-inch, 7-inch and 10-inch portrait/landscape profiles, including recovery target geometry and overflow checks | Physical Raspberry Pi/Touch Display evidence remains separate when hardware is available.               |
| TV / kiosk                 | Browser acceptance across all prayer-board templates at 1920×1080 and 3840×2160, safe-frame checks, burn-in mitigation and keyboard recovery        | Physical TV/panel evidence remains separate when hardware is available.                                 |

The words _emulator_, _Simulator_ and _browser acceptance_ are deliberate. They must not be described as physical-device testing.

## Accessibility acceptance

Permanent Visual Regression includes axe-core WCAG A/AA checks, RTL/container-overflow checks and the v1.5 real-world acceptance matrix. The Stage 58 acceptance profiles verify:

- Android-phone, iPhone and iPad representative viewport semantics;
- visible interactive controls have an accessible name suitable for assistive-technology traversal;
- current-prayer semantics remain exposed;
- `prefers-reduced-motion: reduce` is delivered to the application;
- 200% root text scaling retains the next-prayer hierarchy and avoids horizontal overflow.

These automated semantic checks are the CI analogue for TalkBack and VoiceOver. Actual screen-reader speech, rotor/navigation behaviour and OEM accessibility services require physical Android/iOS hardware and are therefore recorded as physical-device acceptance when such hardware is available.

## Exact-head Stage 10 gate

The final v1.5 pull-request head must pass all permanent release gates after the tracker is reconciled:

1. **Quality Gate** — security policies, documentation links, content-source governance, mosque/Qur'an/Adhan reproducibility, formatting, lint, typecheck, full unit tests, locked coverage thresholds, production build, bundle budget and deployable-web verification.
2. **Visual Regression** — golden regressions, product/device/accessibility matrices, Chromium/Firefox/WebKit smoke journeys and the v1.5 semantic/large-text/reduced-motion acceptance.
3. **Android Build** — Android build plus emulator install/launch lifecycle acceptance.
4. **iOS Build** — iOS Simulator compile plus fresh iPhone/iPad Simulator install/launch/relaunch acceptance. Because the hosted CoreSimulator runtime step is infrastructure-sensitive, the final release reconciliation must inspect that step's actual outcome and may only claim runtime acceptance when it completed successfully.

After any change to the final candidate—including tracker reconciliation—the exact new head must rerun these gates. Stage 10 is complete only when the final candidate head is green and the iPhone/iPad runtime acceptance step itself completed successfully.

## Release boundaries

SalahOS does not claim physical-device coverage that was not executed. Automated evidence validates deterministic software behaviour on the supported CI environments; physical Android OEM, iPhone/iPad, Raspberry Pi Touch Display and TV/panel testing is supplementary where hardware is available.

## Author

privacyOG
