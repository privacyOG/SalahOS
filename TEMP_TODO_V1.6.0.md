# Temp TODO V1.6.0

Source: SalahOS-V1.5.3-Mobile-Visual-Audit.pdf (16 pages), supplied 7 September 2026. Baseline: `31f5d896d582eb785fe7c02fa08b08716d925558`.

Mark `[x]` only after implementation and the applicable validation pass. Record evidence below each item. Unavailable hardware, unapproved religious wording and pending CI are not passes.

## 1. Quran access (audit pages 5–6)

- [x] A01 Clear rejected loader promises; Retry after HTTP, network and malformed-pack failures without deleting bookmarks or last-read state.
  - Evidence: PR #269 merged the validated retry/recovery path and focused rejected-promise tests; the integrated V1.6.0 head was subsequently accepted by Quality, Visual, Android, iOS and Windows on PR #272.
- [x] A02 Explicit PWA offline preparation verifies reader assets, corpus and font; distinguish preparing, ready, unavailable and native bundled states.
  - Evidence: `quranOfflinePreparation` verifies Cache API availability, corpus/font/hash and exposes preparing/ready/unavailable/native-bundled states with focused prepared, unavailable and interrupted-load tests; integrated permanent workflows passed on PR #272.
- [x] A03 Verify complete corpus/font in production and native bundles; test clean native offline, prepared/unprepared PWA and interrupted loads.
  - Evidence: PR #270 added installed Android airplane-mode Qur’an/font transport acceptance; Android/iOS native bundle checks verify the packaged corpus/font and PWA tests cover prepared, unavailable and interrupted preparation. The integrated PR #272 Android/iOS workflows passed.
- [x] A04 Recover from lazy-route/chunk failures with a visible action.
  - Evidence: PR #268 added the permanent regression contract for `LazyRouteBoundary` and its localized visible recovery action across deferred application surfaces.

## 2. Knowledge and reading (pages 2, 7–9)

- [x] K01 Distinct Quran / Hadith / Fiqh & questions scopes, remove duplicate filters, report scoped collection/result counts.
  - Evidence: Knowledge now exposes the three distinct scopes, confines Fiqh/Questions filtering to the relevant library, and renders scoped collection/result counts; integrated Quality/Visual acceptance passed on PR #272.
- [x] K02 Compact heading and source/review disclosure; resume Quran; expose useful content sooner.
  - Evidence: PR #267 compacted the Knowledge presentation and moved detailed source/review metadata into semantic disclosures while preserving immediately visible useful content; the Qur’an Resume path remains available and passed integrated acceptance.
- [x] K03 Label English content and selected commentary honestly with explicit language/direction.
  - Evidence: PR #267 added explicit English rendering/answer labels and `lang`/`dir` treatment while keeping translation distinct from commentary/summary content; permanent validation passed after merge.
- [x] K04 Rename abbreviated Isnad to Companion narrator; preserve sourced grading and school distinctions.
  - Evidence: the Hadith metadata label is now Companion narrator without altering grading/madhhab data; integrated Quality and Visual acceptance passed on PR #272.
- [x] K05 Quran navigation/preferences on demand; explicit empty-surah search; preserve search results and return context.
  - Evidence: PR #265 collapsed secondary navigation/preferences by default, added explicit empty-surah search behavior and preserved a return path to the previous search context; dedicated Qur’an reader acceptance passed.
- [x] K06 Describe page grouping accurately, preserve bookmark/resume/share/RTL behavior.
  - Evidence: PR #265 labels page mode as source Mushaf-page grouping and explicitly states it is not a facsimile page while retaining bookmark, resume, sharing and RTL behavior under permanent reader acceptance.

## 3. Today, themes and responsive layout (pages 3–4, 10–12, 16)

- [x] UI01 Persistent Standard, Light Blue, Emerald, Navy, Warm Sand, Soft Lavender palettes independently of Light/Dark/System mode.
  - Evidence: PR #274 promoted the semantic palette picker and persistence model on the current implementation line; palette selection remains independent of appearance mode.
- [x] UI02 Palette previews/reset; consistent semantic surfaces, text, focus, borders and selection across app; rendered contrast verification.
  - Evidence: PR #274 added touch-friendly palette previews, localized selected/reset states and Reset to Standard, with permanent rendered English/light and Arabic/dark theme acceptance.
- [x] UI03 Remove all Iqamah labels, values, placeholders, prompts and empty columns from Today for configured and unconfigured cases.
  - Evidence: PR #263 merged as `7abc4132eefc2d8614dc67aee4e72fbd9f4a472b` after Quality, Visual, Android, iOS and Windows all passed on synchronized head `6d9bb7466ad58c8f8353576c383a21095e4301cb`.
- [x] UI04 Clear locality and calculation provenance; verify midnight/DST/resume behavior.
  - Evidence: Today exposes calculation method, Asr convention and local-context provenance; focused runtime tests cover Sydney civil-midnight rollover in standard/DST time plus focus/pageshow/visible resume refresh, and integrated Quality passed.
- [x] UI05 Mobile calendar agenda/cards, optional full timetable, localized labels.
  - Evidence: PR #271 added mobile agenda/day cards, a collapsed optional full timetable and localized English/Arabic/Turkish/Indonesian controls with permanent 390×844 and 360×780 RTL acceptance.
- [x] UI06 Check internal clipping, navigation labels, landscape height, touch/focus targets and 200% text.
  - Evidence: PR #272 fixed the remaining Today large-text overflow and its exact head `b0544c12d2e0f9ce9b52703b7cf56325fa17c7ad` passed Quality, Visual, Android, iOS and Windows before merge as `9bb2ccf7a7c9cd5a38485f25a701c08a66b9bf5a`.
- [x] UI07 Live matrix: 320×568, 360×780, 390×844, 430×932, 844×390 and 768×1024; English/Arabic RTL; Light/Dark/System; keyboard/back navigation.
  - Evidence: PR #272 permanently exercises every required viewport, English/Arabic RTL, Light/Dark/System resolution, keyboard activation, browser Back restoration and worst-case 200% text scenarios; all five permanent workflows passed on the exact accepted head.
- [x] UI08 Mosque search/empty/location-denied/cache states; Qibla unavailable-sensor/map fallback; Settings import/export/notification discoverability.
  - Evidence: PR #273 added mosque cache/retry and mobile fallback acceptance, Settings Privacy/data and notification discoverability checks, while existing permanent Qibla acceptance covers live/denied/unsupported sensor fallback and recalibration.
- [ ] UI09 Physical Android/iOS acceptance: offline clean install, font marks, gesture insets, screen reader, rotation/keyboard, compass/calibration, notifications/Doze/reboot/background. Profile Quran loading on lower-end Android.

## 4. Quran editorial policy (pages 14–15)

- [x] Q01 Encode supplied Muhkam/Mutashabih guide; foundations 42:11, 112:4, 19:65 and method 3:7; prohibit bodily/spatial implications for Allah.
  - Evidence: `docs/quran-editorial-policy-v1.6.0.md` encodes the supplied guide, governing/foundation verses and explicit prohibition on bodily/spatial implications; policy tests pass in the integrated Quality gate.
- [x] Q02 Support tafwid and sourced contextual ta'wil, recording selected reading/evidence; no universal gloss.
  - Evidence: the V1.6 editorial policy and validator support verse-specific tafwid/contextual-ta’wil treatments, require evidence for approval and prohibit universal lexical substitution; unresolved entries remain explicitly unassigned rather than fabricated.
- [ ] Q03 Screen all 114 surahs / 6,236 ayat; scholarly review includes non-attribute and unknowable passages.
- [x] Q04 Verse register: key, Arabic expression, context, original English, proposed meaning, treatment, source/edition/reference, reviewer, status and disagreements.
  - Evidence: `src/data/quran-mutashabih-review-register.json` and `quranEditorialPolicy` implement and validate every required register field, with approval impossible without named reviewer/evidence/treatment.
- [ ] Q05 One approved English content source across reader, excerpts, search, tafsir, related ayat, saved reading, copy/share/export and cached/native paths; no unapproved fallback.
- [ ] Q06 Include guide seeds 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61, 16:128; expand through full review without global replacement.
- [ ] Q07 Preserve translation identity; compliant licensed edition or separately identified reviewed SalahOS meanings; unapproved editions unavailable.
- [ ] Q08 Verify full Uthmani corpus/source/reading/edition/licence/hash; preserve canonical marks and separate normalized search.
  - Pending evidence: PR #275 records Tanzil Uthmani / Medina Mushaf / Hafs provenance and implements search-only Arabic normalization without mutating canonical display text. Do not check until its permanent workflow matrix passes and it is merged.
- [ ] Q09 Offline font; separate script/font/size labels; full glyph coverage and representative device rendering/copy/share/export checks.
- [ ] Q10 Regression gates, explicit complete coverage report and named scholarly sign-off; no unresolved policy violations before release.

## 5. Release V1.6.0 (after all applicable items above pass)

- [ ] R01 Update Instructions guide, CHANGELOG and V1.6.0 release notes with verified behavior and limitations.
  - Candidate work is isolated in draft PR #276 and is not yet accepted into the implementation line.
- [ ] R02 Synchronize npm/lock/Android/iOS versions to 1.6.0 and advance native build numbers together.
  - Candidate `1.6.0` / native build `11` synchronization is isolated in draft PR #276 and is not yet accepted into the implementation line.
- [ ] R03 Pass formatting, lint, typecheck, tests/coverage, content/integrity, security, design-token checks, production build and bundle limits.
- [ ] R04 Pass permanent Quality, Visual, Android, iOS and Windows workflows on exact release revision/current main; preserve branch protections.
- [ ] R05 Build and verify persistently signed Android APK/AAB, Windows x64 EXE, Web PWA ZIP, Raspberry Pi kiosk tar.gz and SHA256SUMS.txt, matching V1.5.3 assets.
  - Pipeline readiness verified: Release Assets already produces signed APK/AAB, Web/PWA and Raspberry Pi bundles with checksum verification; Windows Release builds the x64 EXE and reconciles its checksum. This item remains open until the final release artifacts are actually built and verified.
- [ ] R06 Publish v1.6.0 only after audit acceptance and existing exact-main/signature/archive/final-file-set gates pass; verify published downloads/checksums.

## Evidence and blockers

- Initial inspection: audit baseline was the then-current main; V1.5.3 published assets and release conventions were confirmed through GitHub.
- Original supplied Quran guide is available for policy extraction and has been encoded into the V1.6 editorial policy/register infrastructure without fabricating approved meanings.
- Shared integrated software evidence: PR #272 exact head `b0544c12d2e0f9ce9b52703b7cf56325fa17c7ad` contained the preceding merged V1.6 work and passed permanent Quality, Visual, Android, iOS and Windows workflows before merge as `9bb2ccf7a7c9cd5a38485f25a701c08a66b9bf5a`.
- Named whole-corpus scholarly review and physical Android/iOS acceptance are mandatory in the supplied audit; neither may be inferred from automated scans, emulator/Simulator runs or desktop/browser tests.
- Implementation continues on `codex/v1.6.0-implementation`. No V1.6.0 release is claimed.
