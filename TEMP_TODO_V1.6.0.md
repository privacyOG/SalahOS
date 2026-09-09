# Temp TODO V1.6.0

Source: SalahOS-V1.5.3-Mobile-Visual-Audit.pdf (16 pages), supplied 7 September 2026. Baseline: `31f5d896d582eb785fe7c02fa08b08716d925558`.

This tracker records the V1.6.0 release disposition. Automated checks are evidence for software behavior; they are not represented as physical-device testing.

## 1. Qur’an access

- [x] A01 Rejected loader promises recover correctly; Retry performs a fresh load without deleting bookmarks/last-read state.
- [x] A02 PWA Qur’an preparation exposes preparing, ready, unavailable and native-bundled states.
- [x] A03 Complete corpus and Amiri Quran font are verified in production/native bundles and Android offline transport acceptance.
- [x] A04 Lazy-route/chunk failures retain a visible recovery action.

## 2. Knowledge and reading

- [x] K01 Distinct Qur’an / Hadith / Fiqh & questions scopes and scoped counts.
- [x] K02 Compact Knowledge presentation with source/review disclosure and Qur’an Resume.
- [x] K03 English content/commentary labelled honestly with explicit language/direction metadata.
- [x] K04 Companion narrator label preserves sourced grading and school distinctions.
- [x] K05 Qur’an navigation/preferences on demand, empty-search handling and preserved search-return context.
- [x] K06 Accurate Mushaf-page grouping description with bookmark/resume/share/RTL behavior preserved.

## 3. Today, themes and responsive layout

- [x] UI01 Standard, Light Blue, Emerald, Navy, Warm Sand and Soft Lavender palettes persist independently of appearance mode.
- [x] UI02 Palette previews/reset and semantic contrast/focus/border acceptance.
- [x] UI03 Iqamah removed from Today.
- [x] UI04 Locality/calculation provenance plus date/DST/resume behavior validated.
- [x] UI05 Mobile Calendar agenda/cards with optional full timetable and localized labels.
- [x] UI06 Clipping, navigation labels, landscape height, touch/focus targets and 200% text acceptance.
- [x] UI07 Permanent responsive/RTL/appearance/keyboard/back matrix across the required viewports.
- [x] UI08 Mosque fallback states, Qiblah unavailable-sensor fallback and Settings discoverability.
- [ ] UI09 Physical Android/iOS acceptance remains a post-release hardware-validation item; no physical-device pass is claimed by CI.

## 4. Qur’an editorial policy

- [x] Q01 Supplied Muhkam/Mutashabih guide encoded with Qur’an 3:7 methodology and tanzīh foundations.
- [x] Q02 Verse-specific tafwīd and contextual taʾwīl supported without universal lexical replacement.
- [x] Q03 Whole 114-surah / 6,236-ayah corpus approved for V1.6.0 by explicit project-owner whole-corpus sign-off on 2026-09-09.
- [x] Q04 Verse register schema records key, Arabic expression, context, English wording, treatment, sources, reviewer, status and disagreements.
- [x] Q05 SalahOS 2026 is the approved English-content identity across reader/search/excerpts/copy-share paths, with Pickthall retained as the transparent baseline/reference.
- [x] Q06 Required guide seeds are present with dedicated SalahOS 2026 treatments; whole-corpus sign-off completes the release disposition without global replacement.
- [x] Q07 Translation identity is preserved and the whole-corpus release approval is recorded in `src/data/quran-scholarly-signoff.json`.
- [x] Q08 Full Uthmani corpus/source/reading/edition/licence/hash contract and separate normalized search are verified.
- [ ] Q09 Offline font and automated glyph/bundle checks pass; representative physical-device rendering/copy/share/export remains tracked under UI09.
- [x] Q10 Release gate verifies complete corpus, required seed treatments, identity/provenance and explicit whole-corpus sign-off. It does not fabricate 6,236 individual reviewer rows.

## 5. Release V1.6.0

- [x] R01 Instructions, changelog/release documentation and limitations prepared.
- [x] R02 npm/lock/Android/iOS versions synchronized to 1.6.0 with native build number 11.
- [x] R03 Formatting, lint, typecheck, tests/coverage, integrity, security, production build and bundle checks implemented as permanent gates.
- [ ] R04 Final exact release revision/current `main` must pass Quality, Visual, Android, iOS and Windows before promotion.
- [ ] R05 Final signed Android APK/AAB, Windows EXE, Web/PWA ZIP, Raspberry Pi kiosk archive and SHA256SUMS must be built and verified by the release workflows.
- [ ] R06 Publish and verify `v1.6.0` only after R04/R05 complete.

## Release disposition

- Whole-corpus scholarly sign-off: **approved** by project owner `privacyOG` on 2026-09-09 for scope `whole-corpus-6236`.
- The verse-level review register remains supplemental provenance and is not machine-filled with synthetic approvals.
- Physical Android/iOS acceptance remains unverified and is not claimed; by project-owner release decision it is a post-release hardware-validation item rather than a publication blocker.
- Final publication still requires the exact-main workflow matrix, release signing/archive integrity and published-asset checksum verification.
