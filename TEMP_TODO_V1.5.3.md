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

## Work Item 1 — Stop impossible mosque iqamah times — IN PROGRESS

- [ ] Export named congregation-time acceptance-window constants: Fajr 0–120 minutes; Dhuhr/Asr/Maghrib/Isha 0–90 minutes.
- [ ] Add a guarded accessor while preserving `publishedAustralianMosqueCongregationMinutes()` unchanged for raw callers.
- [ ] Reject, rather than clamp or shift, published congregation values outside the accepted window after the calculated prayer start.
- [ ] Handle Isha midnight wraparound.
- [ ] Make `applyAustralianMosqueCongregationTimes()` use the guarded values and fall back to the existing unpublished state when rejected.
- [ ] Add real-record fixtures for Lismore Masallah, Sydney CBD - Erskine Musallah, and Canning Vale Musalla.
- [ ] Assert Lismore Isha and Canning Vale Maghrib are rejected; Erskine Dhuhr resolves to exactly 13:15 while 12:15 is rejected.
- [ ] Do not modify the dataset or UI.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 2 — Fix the scraper that caused Item 1

- [ ] Trace and report how scraped values reach `record.prayerTimes` in both Australian mosque generators before changing code.
- [ ] Drop normalized fard candidates that collide with a record's Jumu'ah times; log record id and field.
- [ ] Add named coarse sanity guards for impossible Australian fard times, including Maghrib before 15:00 and Isha before 16:00.
- [ ] Regenerate the dataset and packs; report before/after record counts carrying `prayerTimes`.
- [ ] Normalize formatted addresses by collapsing repeated commas and whitespace.
- [ ] Gate: `npm run mosques:australia:check` then `npm run mosques:packs:check` after `npm ci`.

## Work Item 3 — Fix text direction on translations and metadata

- [ ] Give every translation/transliteration element explicit `lang` and `dir` from its own metadata, not the UI locale.
- [ ] Use `BidiText` for mixed-script strings and isolate verse references such as `1:1` in RTL text.
- [ ] Cover Qur'an translation, knowledge source metadata, hadith translation, Qur'an translation metadata, tafsir summary, and related-ayat labels.
- [ ] Add an assertion preventing translation elements from inheriting direction implicitly.
- [ ] Verify the Qur'an reader in Arabic locale and report before/after behavior.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 4 — Bundle a real Arabic Qur'anic font

- [ ] Bundle/self-host Amiri Quran (SIL OFL 1.1) as the default; optionally bundle Scheherazade New.
- [ ] Subset to required Arabic ranges, produce WOFF2, and report byte size.
- [ ] Add `@font-face` with `font-display: swap` and Arabic-only `unicode-range`.
- [ ] Keep KFGQPC Uthmanic HAFS optional/downloadable only if offered, with its notice and licence restrictions.
- [ ] Record font licence/provenance in `docs/DEPENDENCY_LICENSE_REVIEW.md`.
- [ ] Reduce the font picker to genuinely present/distinct faces.
- [ ] Gate: `npm run security:licenses && npm run build && npm run bundle:size`.

## Work Item 5 — Fix Arabic typography and unify selector systems

- [ ] Remove conflicting `!important` typography declarations and set line-height per size step.
- [ ] Use Qur'anic justification where it remains readable; add `letter-spacing: 0` and required ligature/font-feature settings.
- [ ] Standardize on data-attribute state selectors for Qur'an font/scale and migrate both reader surfaces.
- [ ] Delete dead modifier selectors and remove import-order dependence.
- [ ] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership && npm run format:check`.

## Work Item 6 — Translation and transliteration licensing/research

- [ ] Do not write product code until the licensing position is reported and a decision is approved.
- [ ] Draft permission request for Mustafa Khattab's *The Clear Quran* to Al-Furqaan / Book of Signs.
- [ ] Prepare fallback licence requests for Bewley and Abdel Haleem.
- [ ] Verify Talal Itani's current ClearQuran.com edition/licence as a neutral secondary option.
- [ ] Source and provenance-pin a Tanzil-derived Latin transliteration; checksum it and budget proofreading.
- [ ] After any translation is licensed, plan multi-state translation preferences plus independent transliteration with per-stream `lang`/`dir`.
- [ ] Gate after approval: `npm run quran:offline:prepare && npm run quran:offline:check && npm run security:licenses && npm run test`.

## Work Item 7 — Give the Qur'an its own route and rebuild reading UX

### 7a — Routing and information architecture
- [ ] Add a deep-linkable Qur'an route using the existing routing/query-parameter system; add no router dependency.
- [ ] Add Library / Qur'an / Hadith segmented navigation inside Knowledge, rendering only one at a time.
- [ ] Move reading controls adjacent to the Qur'an text.
- [ ] Preserve specific-ayah deep links and the existing six-destination phone bottom navigation.

### 7b — Ayah presentation
- [ ] Add persistent List and Page/mushaf reading modes.
- [ ] Replace Latin badges with Arabic-Indic end-of-ayah markers via `Intl.NumberFormat('ar-u-nu-arab')`.
- [ ] Add surah header bands and correct basmala handling, including Al-Fatihah and At-Tawbah exceptions.
- [ ] Move bookmark/last-read/share actions out of the reading flow.
- [ ] Move repeated provenance to a surah footer/info surface and remove the duplicate reader heading.
- [ ] Preserve search, bookmarks, last-read, share, tafsir, related ayat, and offline behavior.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test && npm run knowledge:content:check`.

## Work Item 8 — Hadith honesty, typography, and scope

- [ ] Label partial Arabic matn excerpts honestly and link to full text where available.
- [ ] Give hadith Arabic a visually distinct treatment from Qur'anic text.
- [ ] Surface isnad, grade, and grading authority adjacent to the text.
- [ ] Replace silent metadata fallback with an explicit state.
- [ ] Right-size the 12-entry information architecture and surface the scholar disclaimer clearly.
- [ ] Decide corpus expansion path with the project owner before implementing expansion.
- [ ] Apply tanzih notes to divine-attribute hadith where required by the project aqidah constraint.
- [ ] Gate: `npm run knowledge:content:check && npm run typecheck && npm run lint && npm run test`.

## Work Item 9 — Style the sunrise row

- [ ] Define `today-prayer-row--sunrise` using design tokens only.
- [ ] Reduce name/time weight and use secondary foreground; render "Not applicable" at tertiary/xs styling.
- [ ] Add boundary/hairline treatment and defensively suppress current/next highlighting.
- [ ] Verify dark/light themes and logical properties; do not touch mobile-prayer theme or smart-display overrides.
- [ ] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership && npm run format:check`.

## Work Item 10 — Style selected-mosque location state

- [ ] Add distinct mosque-state border/background using existing tokens/color-mix.
- [ ] Add quiet approximate-location warning treatment; leave saved/precise neutral.
- [ ] Reuse the existing mosque icon from `SalahIcon.tsx`.
- [ ] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership`.

## Work Item 11 — Guard mosque-driven relocation

- [ ] Add pure great-circle distance logic in `src/domain/` using existing coordinate conventions.
- [ ] Beyond a named 150 km threshold, retain the user's own coordinates/timezone rather than relocating prayer calculation to the mosque.
- [ ] Still show far-away mosque congregation/Jumu'ah data, clearly labelled.
- [ ] Show selected-mosque distance in all four locales.
- [ ] Preserve mosque-coordinate adoption when no user location exists.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.

## Work Item 12 — First-run calculation method and Asr convention

- [ ] Add a second onboarding step after location with only calculation method and Asr convention.
- [ ] Suggest calculation method from an explicit offline ISO-country mapping with documented MWL fallback.
- [ ] Show today's Standard and Hanafi Asr preview times at the user's location.
- [ ] Keep "Use defaults" fully available and persist through existing settings storage.
- [ ] Reuse the existing completion-flag onboarding pattern; do not show again after completion.
- [ ] Add domain tests for country mapping and Asr preview computation.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test && npm run format:check`.

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

- Work Item 1: in progress on branch `v1.5.3-work-item-1`.
