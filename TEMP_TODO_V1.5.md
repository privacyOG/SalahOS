# SalahOS v1.5.0 — Temporary Completion Tracker

Keep this tracker compact. Mark an item `[x]` only after implementation, tests/visual acceptance, and relevant documentation are complete.

## Stage 1 — Unified location + permissions

- [x] Add one best-available location resolver for prayer times, Qiblah, weather and mosques.
- [x] Prefer live GPS/GNSS; support approximate, saved/mosque, network and manual fallbacks with source/accuracy/freshness.
- [x] Make permission onboarding benefit-first and handle denied/stale/offline/travel/timezone cases.

## Stage 2 — Automatic weather

- [x] Make weather automatically use current resolved location and network when available.
- [x] Add current conditions, feels-like, high/low, precipitation, humidity, wind, UV, sunrise/sunset and useful prayer context.
- [x] Add caching, freshness display, offline/stale fallback and provider-failure isolation from prayer calculations.

## Stage 3 — Privacy without feature friction

- [x] Remove unnecessary privacy/configuration friction from normal user workflows.
- [x] Keep privacy/data controls in Settings while collecting/transmitting only data required by enabled features.
- [x] Add optional privacy-respecting crash/performance diagnostics without precise-location tracking.

## Stage 4 — Mosque directory enrichment

- [x] Expand mosque records with complete address, contact, website/social, prayer/Jumu'ah times, facilities, services and verification metadata.
- [x] Add multi-source enrichment with field-level provenance, deduplication/entity resolution and data-quality metrics.
- [x] Improve mosque cards/actions: distance, directions, call, website, timetable, favourite/select, report/edit and verification freshness.
- [x] Prepare regional/global downloadable mosque datasets instead of relying only on the bundled Australian seed.

## Stage 5 — Islamic Knowledge source governance

- [x] Add an approved scholarly source registry with provenance, edition/translator, citation, review and trust metadata.
- [x] Theology/creed content must use sources consistent with the Ash'ari and Maturidi Sunni scholarly traditions without requiring those labels in normal user-facing presentation.
- [x] Fiqh content must be sourced through the Hanafi, Maliki, Shafi'i and Hanbali madhhabs and accurately present recognised disagreement where relevant.
- [x] Add CI/content validation for approved sources, Qur'an/Hadith references, grading attribution and unattributed religious rulings.

## Stage 6 — Qur'an expansion

- [x] Arabic Qur'an text with configurable translations and approved tafsir.
- [x] Bookmarks, last-read position, ayah sharing and related ayat.
- [x] Arabic font selection, font sizing and search by ayah/text/topic.
- [x] Preserve clear source/translation/tafsir attribution and offline-friendly reading where practical.

## Stage 7 — Hadith + Fiqh expansion

- [x] Hadith collection, book/chapter, hadith number, Arabic, translation, grading and grading authority.
- [x] Add related hadith and topic taxonomy with searchable/filterable navigation.
- [x] Add first-class Fiqh topics with four-madhhab views where differences materially matter.
- [x] Expand Q&A with scholar, original source, date/topic, madhhab where relevant and supporting references.

## Stage 8 — Product UX refinement

- [ ] Strengthen Today hierarchy around current/next prayer, prayer times, weather and local context; reduce explanatory-card clutter.
- [ ] Simplify mobile navigation and reorganise Settings by Location, Prayer, Adhan, Display, Mosques, Privacy/Data and Advanced.
- [ ] Preserve the established visual identity while improving progressive disclosure and location-confidence feedback.

## Stage 9 — Real-world verification

- [ ] Expand automated tests for GPS/location fallbacks, weather failures/cache, mosque data quality/actions and timetable precedence.
- [ ] Add representative physical-device acceptance for Android/iPhone/iPad plus Raspberry Pi/TV targets where available.
- [ ] Add VoiceOver/TalkBack, large text, reduced motion and relevant accessibility acceptance.

## Stage 10 — v1.5 release reconciliation

- [ ] Run Quality, Visual, Android emulator lifecycle and fresh iPhone/iPad Simulator acceptance on the exact final head.
- [ ] Verify web/mobile/display regressions, content-source policy, bundle/coverage budgets and final documentation.
- [ ] Reconcile all v1.5 tracker items and merge only after final exact-head gates pass.
