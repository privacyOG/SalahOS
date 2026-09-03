# SalahOS v1.5.3 — Temporary Release Update Tracker

Source brief: `SalahOS V153 update.txt` supplied for the v1.5.3 update.

Keep this tracker authoritative for v1.5.3 implementation progress. Work items are completed one at a time. Mark an item `[x]` only after its implementation and required validation gate pass. Do not batch items that touch overlapping files.

## Release constraints

- [ ] Preserve `src/domain/` purity and existing domain/platform/UI boundaries.
- [ ] Use `--salah-*` design tokens only; no component/feature hex literals.
- [ ] Keep all user-facing copy complete in `en`, `ar`, `tr`, `id`, with RTL handling where applicable.
- [ ] Add no runtime or development dependency without explicit approval.
- [ ] Preserve explicit provenance; never invent or imply unavailable prayer, mosque, Qur'an, or hadith data.
- [ ] Keep Qur'an/hadith content consistent with the project's binding Ash'ari/Maturidi aqidah constraint.

## Work Item 1 — Stop impossible mosque iqamah times — COMPLETE

- [x] Export named congregation-time acceptance-window constants: Fajr 0–120 minutes; Dhuhr/Asr/Maghrib/Isha 0–90 minutes.
- [x] Add a guarded accessor while preserving `publishedAustralianMosqueCongregationMinutes()` unchanged for raw callers.
- [x] Reject, rather than clamp or shift, published congregation values outside the accepted window after the calculated prayer start.
- [x] Handle Isha midnight wraparound.
- [x] Make `applyAustralianMosqueCongregationTimes()` use the guarded values and fall back to the existing unpublished state when rejected.
- [x] Add real-record fixtures for Lismore Masallah, Sydney CBD - Erskine Musallah, and Canning Vale Musalla.
- [x] Assert Lismore Isha and Canning Vale Maghrib are rejected; Erskine Dhuhr resolves to exactly 13:15 while 12:15 is rejected.
- [x] Do not modify the dataset or UI.
- [x] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 2 — Fix the scraper that caused Item 1 — COMPLETE

- [x] Trace and report how scraped values reach `record.prayerTimes` in both Australian mosque generators before changing code.
- [x] Drop normalized fard candidates that collide with a record's Jumu'ah times; log record id and field.
- [x] Add named coarse sanity guards for impossible Australian fard times, including Maghrib before 15:00 and Isha before 16:00.
- [x] Regenerate the dataset and packs; report before/after record counts carrying `prayerTimes`.
- [x] Normalize formatted addresses by collapsing repeated commas and whitespace.
- [x] Gate: `npm run mosques:australia:check` then `npm run mosques:packs:check` after `npm ci`.

## Work Item 3 — Fix text direction on translations and metadata — COMPLETE

- [x] Give every translation/transliteration element explicit `lang` and `dir` from its own metadata, not the UI locale.
- [x] Use `BidiText` for mixed-script strings and isolate verse references such as `1:1` in RTL text.
- [x] Cover Qur'an translation, knowledge source metadata, hadith translation, Qur'an translation metadata, tafsir summary, and related-ayat labels.
- [x] Add an assertion preventing translation elements from inheriting direction implicitly.
- [x] Verify the Qur'an reader in Arabic locale and report before/after behavior.
- [x] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 4 — Bundle a real Arabic Qur'anic font — COMPLETE

- [x] Bundle/self-host Amiri Quran (SIL OFL 1.1) as the default; optionally bundle Scheherazade New.
- [x] Subset to required Arabic ranges, produce WOFF2, and report byte size.
- [x] Add `@font-face` with `font-display: swap` and Arabic-only `unicode-range`.
- [x] Keep KFGQPC Uthmanic HAFS optional/downloadable only if offered, with its notice and licence restrictions.
- [x] Record font licence/provenance in `docs/DEPENDENCY_LICENSE_REVIEW.md`.
- [x] Reduce the font picker to genuinely present/distinct faces.
- [x] Gate: `npm run security:licenses && npm run build && npm run bundle:size`.

## Work Item 5 — Fix Arabic typography and unify selector systems — COMPLETE

- [x] Remove conflicting `!important` typography declarations and set line-height per size step.
- [x] Use Qur'anic justification where it remains readable; add `letter-spacing: 0` and required ligature/font-feature settings.
- [x] Standardize on data-attribute state selectors for Qur'an font/scale and migrate both reader surfaces.
- [x] Delete dead modifier selectors and remove import-order dependence.
- [x] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership && npm run format:check`.

## Work Item 6 — Translation and transliteration licensing/research — RIGHTS PENDING

- [x] Do not write product code until the licensing position is reported and a decision is approved.
- [x] Draft permission request for Mustafa Khattab's _The Clear Quran_ to Al-Furqaan / Book of Signs.
- [x] Prepare fallback licence requests for Bewley and Abdel Haleem.
- [x] Verify Talal Itani's current ClearQuran.com edition/licence as a neutral secondary option.
- [x] Source and provenance-pin a Tanzil-derived Latin transliteration; checksum it and budget proofreading.
- [x] Project owner approved the documented rights strategy on 2026-09-01: The Clear Quran primary; Bewley/Abdel Haleem fallbacks; Talal Itani conditional on licence clarification; Tanzil transliteration clearance required.
- [ ] Obtain actual written permission/compatible licence before bundling any new translation or transliteration content.
- [ ] After any translation is licensed, plan multi-state translation preferences plus independent transliteration with per-stream `lang`/`dir`.
- [ ] Gate after approval: `npm run quran:offline:prepare && npm run quran:offline:check && npm run security:licenses && npm run test`.

## Work Item 7 — Give the Qur'an its own route and rebuild reading UX — COMPLETE

### 7a — Routing and information architecture

- [x] Add a deep-linkable Qur'an route using the existing routing/query-parameter system; add no router dependency.
- [x] Add Library / Qur'an / Hadith segmented navigation inside Knowledge, rendering only one at a time.
- [x] Move reading controls adjacent to the Qur'an text.
- [x] Preserve specific-ayah deep links and the existing six-destination phone bottom navigation.

### 7b — Ayah presentation

- [x] Add persistent List and Page/mushaf reading modes.
- [x] Replace Latin badges with Arabic-Indic end-of-ayah markers via `Intl.NumberFormat('ar-u-nu-arab')`.
- [x] Add surah header bands and correct basmala handling, including Al-Fatihah and At-Tawbah exceptions.
- [x] Move bookmark/last-read/share actions out of the reading flow.
- [x] Move repeated provenance to a surah footer/info surface and remove the duplicate reader heading.
- [x] Preserve search, bookmarks, last-read, share, tafsir, related ayat, and offline behavior.
- [x] Gate: `npm run typecheck && npm run lint && npm run test && npm run knowledge:content:check`.

## Work Item 8 — Hadith honesty, typography, and scope — COMPLETE

- [x] Label partial Arabic matn excerpts honestly and link to full text where available.
- [x] Give hadith Arabic a visually distinct treatment from Qur'anic text.
- [x] Surface isnad, grade, and grading authority adjacent to the text.
- [x] Replace silent metadata fallback with an explicit state.
- [x] Right-size the current 9-entry information architecture and surface the scholar disclaimer clearly.
- [x] Project owner decision: keep the current curated 3-hadith corpus for v1.5.3 and defer corpus expansion to a separately governed follow-up.
- [x] Audit the current hadith corpus for divine-attribute reports requiring tanzih notes under the project aqidah constraint; none of the current three hadith requires such a note, and any future corpus expansion must repeat this audit.
- [x] Gate: `npm run knowledge:content:check && npm run typecheck && npm run lint && npm run test`.

## Work Item 9 — Style the sunrise row — COMPLETE

- [x] Define `today-prayer-row--sunrise` using design tokens only.
- [x] Reduce name/time weight and use secondary foreground; render "Not applicable" at tertiary/xs styling.
- [x] Add boundary/hairline treatment and defensively suppress current/next highlighting.
- [x] Verify dark/light themes and logical properties; do not touch mobile-prayer theme or smart-display overrides.
- [x] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership && npm run format:check`.

## Work Item 10 — Style selected-mosque location state — COMPLETE

- [x] Add distinct mosque-state border/background using existing tokens/color-mix.
- [x] Add quiet approximate-location warning treatment; leave saved/precise neutral.
- [x] Reuse the existing mosque icon from `SalahIcon.tsx`.
- [x] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership`.

## Work Item 11 — Guard mosque-driven relocation — COMPLETE

- [x] Add pure great-circle distance logic in `src/domain/` using existing coordinate conventions.
- [x] Beyond a named 150 km threshold, retain the user's own coordinates/timezone rather than relocating prayer calculation to the mosque.
- [x] Still show far-away mosque congregation/Jumu'ah data, clearly labelled.
- [x] Show selected-mosque distance in all four locales.
- [x] Preserve mosque-coordinate adoption when no user location exists.
- [x] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 12 — First-run calculation method and Asr convention — COMPLETE

- [x] Add a second onboarding step after location with only calculation method and Asr convention.
- [x] Suggest calculation method from an explicit offline ISO-country mapping with documented MWL fallback.
- [x] Show today's Standard and Hanafi Asr preview times at the user's location.
- [x] Keep "Use defaults" fully available and persist through existing settings storage.
- [x] Reuse the existing completion-flag onboarding pattern; do not show again after completion.
- [x] Add domain tests for country mapping and Asr preview computation.
- [x] Gate: `npm run typecheck && npm run lint && npm run test && npm run format:check`.

## Work Item 13 — Persistent method/madhhab provenance chip

- [ ] Add a 44px-minimum tappable Today chip such as `MWL · Standard Asr` linked to Settings → Prayer.
- [ ] Reuse `asrConventionPresentation.ts` and support all four locales.
- [ ] Indicate manual prayer adjustments in the chip.
- [ ] Remove duplicated method/Asr lines from the collapsed provenance footer.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 14 — Promote Friday Jumu'ah

- [ ] On Friday with sessions, render Jumu'ah directly beneath the hero and above the prayer table.
- [ ] Render every configured session.
- [ ] Derive Friday from `PrayerBoardData.civilDateIso` in the calculation timezone, not device-local `Date`.
- [ ] Add a pure tested domain predicate including timezone/date-boundary disagreement coverage.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 15 — Ship directory Jumu'ah times

- [ ] Extend selected-directory mosque context to persist `jumuahTimes`; bump schema and migrate v1 reads.
- [ ] Map directory Jumu'ah into the existing Today Jumu'ah presentation without inventing khutbah times.
- [ ] Keep Jumu'ah out of the main fard prayer table.
- [ ] Test mapping in domain/platform, not the component.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 16 — Stop recomputing astronomy every second

- [ ] Split schedule computation from per-second current/next/countdown derivation.
- [ ] Memoize schedule by civil date, settings, and coordinates so astronomical work changes at date/settings/location boundaries only.
- [ ] Isolate countdown and app-bar clock into leaf tick components.
- [ ] Tick every 60s when countdown is >1 hour and the clock is hidden; restore 1s inside the final hour.
- [ ] Measure `buildPrayerDashboardResult` calls over a simulated 10-minute window before/after and add regression coverage.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 17 — Make 6,236 ayat navigable

- [ ] Replace the 114-option native select with a searchable surah index showing number, Arabic/transliterated name, ayah count, and revelation place.
- [ ] Add Juz and mushaf-page navigation.
- [ ] Replace "Show more ayat" with continuous virtualized surah scrolling, without a new dependency if reasonably possible.
- [ ] Persist/restore scroll position per surah.
- [ ] Make "Resume last read" jump and highlight.
- [ ] Report Al-Baqarah render timing before/after.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test && npm run bundle:size`.

## Work Item 18 — Consolidate bottom navigation and label overflow

- [ ] Remove the Knowledge stylesheet's six-column nav override and make the shell derive equal columns from item count.
- [ ] Correct the stale five-destination comment.
- [ ] Add label overflow/ellipsis safety and shorten Indonesian `Pengetahuan` to `Ilmu` at source.
- [ ] Verify 320/360/390/430px, LTR/RTL, and 44px touch targets; verify 800/1200px sidebar transitions.
- [ ] Gate: `npm run ui:design-system-ownership && npm run ui:theme-architecture && npm run format:check`.

## Work Item 19 — Wire up Tahajjud, Islamic midnight, and Ishraq

- [ ] Add a Night section with Islamic midnight, last-third start, and next-morning Ishraq/Duha.
- [ ] Show prominently only after Isha/before Fajr; otherwise keep under More today.
- [ ] Preserve supplementary-time provenance strings.
- [ ] Add explicit unset Ishraq offset to Settings → Prayer; hide the row until chosen.
- [ ] Expose `NightEndConvention`, default to Fajr, and label the active convention.
- [ ] Add all four locales.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test && npm run calendar:check`.

## Work Item 20 — Notification opt-in during onboarding

- [ ] Add a third onboarding step after Item 12 explaining local prayer notifications and background-Adhan platform limitations accurately.
- [ ] Use the existing notification preference shape for all/none or per-prayer toggles without unnecessary restructuring.
- [ ] Request OS permission only after opt-in, following existing native-permission patterns.
- [ ] Keep the step skippable/reachable later and do not re-prompt after decline.
- [ ] Preserve exact-alarm fallback and reboot-restoration contracts.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test && npm run security:native-permissions`.

## Work Item 21 — Knowledge accessibility and small corrections

- [ ] Move `aria-live` off the ayah content list to a concise status region.
- [ ] Localize hardcoded `Juz`, related-ayah, source-line, and page labels; format numbers with `Intl.NumberFormat`.
- [ ] Align browser/Android `theme-color` with dark canvas and add a light-mode media variant.
- [ ] Confirm Tanzil attribution and required link are visible in-app.
- [ ] Gate: `npm run check`.

## Work Item 22 — Batched small corrections

### 22a — Hijri correction range

- [ ] Widen correction from -2..2 to -3..3 in storage, settings controls, and tests.

### 22b — Midnight-to-Fajr current-prayer state

- [ ] Replace ambiguous "Between prayer times" behavior with an explicitly documented/tested convention; do not silently choose fiqh semantics.

### 22c — Mount-time storage snapshots

- [ ] Subscribe Today to mosque-profile changes and add an equivalent settings-change event using the existing location-event pattern.

### 22d — Eyebrow density

- [ ] Keep uppercase/strong tracking for hero prayer/countdown labels only; convert lower hierarchy labels to sentence case/weight 600 while preserving RTL overrides.
- [ ] Gate for Item 22: `npm run check`.

## Product-decision backlog — DO NOT IMPLEMENT WITHOUT DIRECTION

- [ ] Prayer tracking: local-only confirmations/export, no streaks/gamification/guilt copy.
- [ ] High-latitude fallback: decide conventions for nearest valid place/date behavior.
- [ ] Makruh windows: convention-labelled and off by default.
- [ ] Post-salah dhikr: offline governed content, no counter chrome.
- [ ] Restore an obvious phone path back to Community.

## Release verification notes

- `npm ci` is required before gates that import development dependencies.
- Qur'an-related items may require first-run network access for the pinned offline pack.
- Visual changes affecting Items 3–10, 14, 17, and 18 require deliberate snapshot regeneration/review.
- Verify every Qur'an item in both English and Arabic locale.

## Completion log

- Work Item 1: complete on branch `v1.5.3-work-item-1`; Quality Gate run 33362450657 passed including the required typecheck, lint, and test gate.
- Work Item 2: complete on branch `v1.5.3-work-item-2`; Finder and combined `prayerTimes` coverage reduced from 3 records to 1 after collision/sanity cleanup. Quality Gate run 33379143204 passed the required Australian directory and mosque-pack reproducibility gates after dependency installation; stale dataset expectations found later in the broader suite were updated without weakening the Item 1 guard fixtures.
- Work Item 3: complete on branch `v1.5.3-work-item-3`; required typecheck, lint, and test gate passed in validation run 33381446395 with 777 tests, including Arabic-locale direction coverage.
- Work Item 4: complete on branch `v1.5.3-work-item-4`; bundled Amiri Quran 1.003 as a 48320-byte WOFF2 subset (SHA-256 `b4550498a71ed77bddb93bb7c24608a2c40d706f8843178ed17420a4fd860a7d`), preserved OFL-1.1 notice, reduced the picker to bundled Amiri Quran/system, and passed the required licence/build/bundle gate.
- Work Item 5: complete on branch `v1.5.3-work-item-5`; unified both Qur’an reader surfaces on data-attribute font/scale state, removed duplicate modifier selectors and typography `!important`, added explicit Arabic shaping/spacing and scale-specific line heights, and passed the required theme/architecture/ownership/format gate.
- Work Item 6 research checkpoint: licensing matrix and permission-request drafts recorded in `docs/QURAN_TRANSLATION_TRANSLITERATION_LICENSING.md`; pinned `risan/quran-json` v3.1.2 transliteration at 2,214,403 bytes, SHA-256 `36369741f23fe2b64fdcca39d047659256dab7b40f1717aefcb6198c514313a0`, Git blob `7e2750a5b65306c9393b29e5a3ddfa264d33cc48`, 114 surahs/6,236 ayat. Product integration remains blocked pending owner approval and required rights clarification.
- Work Item 8 technical implementation: lean validation run `33497792180` passed Knowledge governance, typecheck, lint, 788 tests across 180 files, theme/design ownership, production build, and bundle architecture at 1,249,350 total JavaScript bytes (650 bytes below the 1,250,000-byte cap). The current three-hadith corpus contains no divine-attribute report requiring a tanzih note. Corpus expansion remains owner-decision pending before Item 8 can be closed.
- Work Item 12: complete via PR #234, merged as `05240f6aaf5cbcfc56d06f6163c3e5dff6ce3727`; exact-head Quality Gate run 33678029000 passed the required format, lint, typecheck, and unit-test steps before merge.
