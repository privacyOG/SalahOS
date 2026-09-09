# SalahOS v1.6.0 release notes

SalahOS v1.6.0 is a mobile usability, Qur’an reliability, Knowledge organisation, theme and release-hardening update. It focuses on making the main prayer and reading surfaces usable at small phone sizes, large text, Arabic/RTL and offline conditions without weakening the existing provenance, security, signing or exact-head release contracts.

## Today and prayer presentation

- Removes Iqamah labels, values, placeholders and empty Iqamah columns from **Today**. Mosque and administration data can still retain Iqamah for mosque-specific timetable and display workflows; Today now concentrates on prayer start times.
- Keeps locality and calculation provenance visible, including calculation method and Asr convention, and retains runtime refresh behavior across civil-date rollover, Sydney DST boundaries and application resume/focus events.
- Hardens the smallest supported phone layout so Today remains horizontally contained at 320×568, including 200% text sizing, without hiding required prayer or navigation content.
- Preserves Sunrise as the non-prayer Fajr-end boundary and the existing explicit civil-day prayer-state semantics.

## Appearance, palettes and responsive navigation

- Adds persistent **Standard, Light Blue, Emerald, Navy, Warm Sand and Soft Lavender** palettes, selected independently from Light, Dark or System appearance.
- Adds palette previews and reset behavior while keeping semantic backgrounds, borders, focus states and text contrast under the permanent theme/visual acceptance gates.
- Preserves seven visible primary destinations — Today, Calendar, Mosques, Qiblah, Knowledge, Community and Settings — with localized navigation labels and touch/focus target checks.
- Adds a permanent V1.6 responsive acceptance matrix covering 320×568, 360×780, 390×844, 430×932, 844×390 and 768×1024 in English and Arabic RTL, Light/Dark/System appearance, keyboard activation, browser Back restoration and 200% text scenarios.

## Calendar, Mosques, Qiblah and Settings

- Refines Calendar for mobile use with compact agenda/card presentation, localized labels and access to the fuller timetable when required.
- Extends mosque acceptance for search, zero-result, no-location/location-denied and cached/offline directory states without requiring live network access for the bundled Australian catalogue.
- Keeps Qiblah usable when orientation sensors are unavailable by retaining the calculated bearing and map-oriented fallback rather than presenting a dead end.
- Keeps Settings import/export/reset and prayer-notification controls discoverable in mobile layouts.

## Qur’an reader, SalahOS 2026 and offline reliability

- Adds **SalahOS 2026 (English meaning)** as the default Qur’an English-meaning mode. It is a transparent derived edition: M. M. Pickthall (1930) remains the pinned baseline/reference where a verse has not yet received a new reviewed wording, while owner-guide-driven verse-specific meanings override that baseline.
- Keeps **M. M. Pickthall (1930)** separately selectable as a baseline/reference and keeps Arabic-only reading available; the UI does not silently relabel Pickthall as original SalahOS wording.
- Applies the project-owner-supplied Ashʿarī **Muhkam/Mutashabih** guideline to dedicated V1.6.0 entries for 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61 and 16:128. Covered verses expose expandable notes distinguishing Salaf-style tafwīd/tanzīh from contextual Khalaf taʾwīl where the supplied guide gives one.
- Preserves the guide’s concrete non-corporeal examples, including 28:88 as **His Dominion**, 68:42 as **hardship**, 2:115 as **qiblah** in context, 38:75 as **care**, 24:35 as Allah being the **Creator of guidance**, 57:4 as Allah **knowing** people wherever they are, 6:61 as **subjugation**, and 16:128 as divine **support** rather than physical co-location.
- Makes the provisional status explicit: `SalahOS 2026` does not claim completed whole-corpus scholarly approval until all 6,236 ayat are screened/approved and a named qualified scholar signs the complete corpus.
- Pins Qur’anic Arabic as **Uthmani · Medina Mushaf · Hafs** and now enforces the display contract on every tagged Arabic Qur’an surface: `lang="ar"`, `dir="rtl"`, explicit Uthmani class, RTL direction, right alignment and bidi isolation. Page mode no longer replaces right alignment with justified Arabic text.
- Clears rejected Qur’an loader promises after HTTP, network and malformed-pack failures so **Retry** performs a genuine new load without deleting bookmarks or last-read state.
- Adds explicit Qur’an offline preparation states for Web/PWA: preparing, ready and unavailable; native builds identify the verified bundled corpus/font path separately.
- Verifies the production/native Qur’an pack and Amiri Quran font during native build pipelines and keeps visible recovery for lazy-route/chunk failures.
- Makes reader navigation and preferences available on demand so the selected surah is the dominant reading surface rather than persistent control chrome.
- Preserves search-result return context, explicit empty-search states, bookmarks, Resume last read, copy/share and RTL behavior; search indexes both the selected SalahOS 2026 wording and the pinned Pickthall baseline.
- Describes dataset page grouping as navigation metadata rather than implying that the screen is a facsimile of a printed mushaf.
- Search derives a separate normalized Arabic comparison key so unvocalised queries can match marked Uthmani text without modifying the canonical display/copy/share corpus.

## Islamic Knowledge organisation

- Separates Qur’an, Hadith and **Fiqh & questions** scopes and reports scoped collection/result counts instead of duplicating filters.
- Moves useful content higher in the Knowledge experience with more compact heading/source/review disclosure and a direct Qur’an Resume path.
- Renames the abbreviated Hadith “Isnad” field to **Companion narrator** while preserving sourced grading and juristic/school distinctions.
- Keeps translation text distinct from separately identified commentary/summary content and preserves explicit `lang`/`dir` handling.
- Aligns curated Qur’an excerpts to the `SalahOS 2026` translation identity while retaining explicit Uthmani Arabic, Pickthall baseline and tafsir provenance.

## Qur’an editorial governance

V1.6.0 includes repository-level Muhkam/Mutashabih policy and the supplemental `docs/quran-salahos-2026-policy.md`, derived from the supplied project guide. Qur’an 3:7 governs the method and 42:11, 112:4 and 19:65 provide clear foundations. The policy prohibits bodily/spatial implications for Allah and supports either general tafwīd with tanzīh or sourced contextual taʾwīl on a verse-by-verse basis rather than universal lexical replacement.

A permanent `quran:salahos-2026:check` now verifies required seed coverage, translation identity, Uthmani/Hafs/Medina provenance and explicit RTL/right-aligned Arabic rendering. The release-only editorial gate is additionally bound to the SalahOS 2026 override set so approved Mutashabih treatments cannot drift away from displayed English wording.

**Release boundary:** whole-corpus 114-surah / 6,236-ayah review and named qualified scholarly sign-off remain mandatory external acceptance gates. They must be completed and recorded before v1.6.0 is published; CI or machine-generated text cannot substitute for that sign-off.

## Quality and release engineering

- Synchronises npm and package-lock to `1.6.0`, Android to `versionCode 11` / `versionName 1.6.0`, and iOS to build `11` / marketing version `1.6.0`.
- Preserves formatting, lint, typecheck, unit/coverage, Qur’an integrity/governance, dependency/security, mosque reproducibility, production-build and bundle-budget checks.
- Preserves permanent Quality, Visual Regression, Android emulator lifecycle, fresh iPhone/iPad Simulator and Windows executable workflows.
- Keeps release publication fail-closed on the exact current `main` revision, persistent Android signing, archive integrity, exact final file-set verification and SHA-256 verification.

## Downloadable v1.6.0 assets

A successful v1.6.0 publication is expected to include:

- `SalahOS-v1.6.0-android.apk` — persistently signed Android release APK for direct installation;
- `SalahOS-v1.6.0-android.aab` — persistently signed Android App Bundle for Google Play/distribution workflows;
- `SalahOS-v1.6.0-windows-x64.exe` — self-contained 64-bit Windows 10/11 desktop executable;
- `SalahOS-v1.6.0-web-pwa.zip` — complete production Web/PWA package;
- `SalahOS-v1.6.0-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — SHA-256 hashes for the packaged release assets.

The Windows executable includes its .NET runtime and expects the Microsoft Edge WebView2 Runtime, normally present on current Windows 10/11 installations. GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution and physical-device boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and a distribution archive can be validated. Simulator acceptance is test evidence, not a consumer installer.
- No native macOS `.dmg` is published because SalahOS does not contain a native macOS application target.
- The V1.6 audit separately requires physical Android and iOS acceptance, including clean offline installation, Arabic/Qur’an rendering, gesture/safe-area behavior, rotation/keyboard, screen reader, compass/calibration and notification/background lifecycle checks. Emulator, Simulator and browser evidence do not satisfy that physical-device gate.

## Release gate

The `v1.6.0` tag and downloadable release must not be published until the exact release revision passes Quality, Visual, Android, iOS and Windows workflows **and** the outstanding physical-device and named scholarly-review requirements recorded in `TEMP_TODO_V1.6.0.md` are satisfied. The existing release workflows then verify persistent Android signing, Web/PWA and Raspberry Pi archives, Windows executable integrity and the final SHA-256 manifest before publication.

## Author

privacyOG
