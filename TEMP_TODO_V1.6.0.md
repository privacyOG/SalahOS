# Temp TODO V1.6.0

Source: SalahOS-V1.5.3-Mobile-Visual-Audit.pdf (16 pages), supplied 7 September 2026. Baseline: `31f5d896d582eb785fe7c02fa08b08716d925558`.

Mark `[x]` only after implementation and the applicable validation pass. Record evidence below each item. Unavailable hardware, unapproved religious wording and pending CI are not passes.

## 1. Quran access (audit pages 5–6)

- [ ] A01 Clear rejected loader promises; Retry after HTTP, network and malformed-pack failures without deleting bookmarks or last-read state.
- [ ] A02 Explicit PWA offline preparation verifies reader assets, corpus and font; distinguish preparing, ready, unavailable and native bundled states.
- [ ] A03 Verify complete corpus/font in production and native bundles; test clean native offline, prepared/unprepared PWA and interrupted loads.
- [ ] A04 Recover from lazy-route/chunk failures with a visible action.

## 2. Knowledge and reading (pages 2, 7–9)

- [ ] K01 Distinct Quran / Hadith / Fiqh & questions scopes, remove duplicate filters, report scoped collection/result counts.
- [ ] K02 Compact heading and source/review disclosure; resume Quran; expose useful content sooner.
- [ ] K03 Label English content and selected commentary honestly with explicit language/direction.
- [ ] K04 Rename abbreviated Isnad to Companion narrator; preserve sourced grading and school distinctions.
- [ ] K05 Quran navigation/preferences on demand; explicit empty-surah search; preserve search results and return context.
- [ ] K06 Describe page grouping accurately, preserve bookmark/resume/share/RTL behavior.

## 3. Today, themes and responsive layout (pages 3–4, 10–12, 16)

- [ ] UI01 Persistent Standard, Light Blue, Emerald, Navy, Warm Sand, Soft Lavender palettes independently of Light/Dark/System mode.
- [ ] UI02 Palette previews/reset; consistent semantic surfaces, text, focus, borders and selection across app; rendered contrast verification.
- [ ] UI03 Remove all Iqamah labels, values, placeholders, prompts and empty columns from Today for configured and unconfigured cases.
- [ ] UI04 Clear locality and calculation provenance; verify midnight/DST/resume behavior.
- [ ] UI05 Mobile calendar agenda/cards, optional full timetable, localized labels.
- [ ] UI06 Check internal clipping, navigation labels, landscape height, touch/focus targets and 200% text.
- [ ] UI07 Live matrix: 320×568, 360×780, 390×844, 430×932, 844×390 and 768×1024; English/Arabic RTL; Light/Dark/System; keyboard/back navigation.
- [ ] UI08 Mosque search/empty/location-denied/cache states; Qibla unavailable-sensor/map fallback; Settings import/export/notification discoverability.
- [ ] UI09 Physical Android/iOS acceptance: offline clean install, font marks, gesture insets, screen reader, rotation/keyboard, compass/calibration, notifications/Doze/reboot/background. Profile Quran loading on lower-end Android.

## 4. Quran editorial policy (pages 14–15)

- [ ] Q01 Encode supplied Muhkam/Mutashabih guide; foundations 42:11, 112:4, 19:65 and method 3:7; prohibit bodily/spatial implications for Allah.
- [ ] Q02 Support tafwid and sourced contextual ta'wil, recording selected reading/evidence; no universal gloss.
- [ ] Q03 Screen all 114 surahs / 6,236 ayat; scholarly review includes non-attribute and unknowable passages.
- [ ] Q04 Verse register: key, Arabic expression, context, original English, proposed meaning, treatment, source/edition/reference, reviewer, status and disagreements.
- [ ] Q05 One approved English content source across reader, excerpts, search, tafsir, related ayat, saved reading, copy/share/export and cached/native paths; no unapproved fallback.
- [ ] Q06 Include guide seeds 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61, 16:128; expand through full review without global replacement.
- [ ] Q07 Preserve translation identity; compliant licensed edition or separately identified reviewed SalahOS meanings; unapproved editions unavailable.
- [ ] Q08 Verify full Uthmani corpus/source/reading/edition/licence/hash; preserve canonical marks and separate normalized search.
- [ ] Q09 Offline font; separate script/font/size labels; full glyph coverage and representative device rendering/copy/share/export checks.
- [ ] Q10 Regression gates, explicit complete coverage report and named scholarly sign-off; no unresolved policy violations before release.

## 5. Release V1.6.0 (after all applicable items above pass)

- [ ] R01 Update Instructions guide, CHANGELOG and V1.6.0 release notes with verified behavior and limitations.
- [ ] R02 Synchronize npm/lock/Android/iOS versions to 1.6.0 and advance native build numbers together.
- [ ] R03 Pass formatting, lint, typecheck, tests/coverage, content/integrity, security, design-token checks, production build and bundle limits.
- [ ] R04 Pass permanent Quality, Visual, Android, iOS and Windows workflows on exact release revision/current main; preserve branch protections.
- [ ] R05 Build and verify persistently signed Android APK/AAB, Windows x64 EXE, Web/PWA ZIP, Raspberry Pi kiosk tar.gz and SHA256SUMS.txt, matching V1.5.3 assets.
- [ ] R06 Publish v1.6.0 only after audit acceptance and existing exact-main/signature/archive/final-file-set gates pass; verify published downloads/checksums.

## Evidence and blockers

- Initial inspection: audit baseline is still current main; V1.5.3 published assets confirmed through GitHub.
- Original supplied Quran guide is available for policy extraction.
- Named whole-corpus scholarly review and physical Android/iOS acceptance are mandatory in the supplied audit; neither may be inferred from automated scans or desktop tests.
- Implementation in progress on `codex/v1.6.0-implementation`. No V1.6.0 release is claimed.
