# SalahOS v1.5.1 — Temporary UI Theme & Guide Tracker

Keep this tracker compact. Mark an item `[x]` only after implementation and relevant validation are complete.

## Stage 1 — Theme-system audit and contrast fixes ✅
- [x] Audit semantic foreground/background behaviour across Light, Dark and System modes.
- [x] Remove/fix theme-dependent foreground/background pairings that can produce unreadable text, controls or cards.
- [x] Ensure System mode resolves cleanly to the OS colour scheme and all shared semantic tokens have explicit light/dark values.
- [x] Add regression protection for core semantic contrast pairs and the reported Qiblah/Today light-theme failure class.
- [x] Validate Stage 1 and mark complete.

## Stage 2 — Expanded colour palettes ✅
- [x] Add curated Salah Classic, Midnight Gold, Emerald Mosque, Royal Blue, Desert Sand, Olive Heritage, Monochrome and High Contrast palettes.
- [x] Provide deliberate Light and Dark variants while keeping appearance mode independent from palette selection.
- [x] Persist palette selection and expose it cleanly in Display settings.

## Stage 3 — Theme architecture and cross-platform consistency ✅
- [x] Centralise palette + appearance-mode resolution through semantic design tokens.
- [x] Ensure Android, iOS/iPadOS, Web/PWA and display/kiosk surfaces consume the same theme contract where applicable.
- [x] Preserve RTL, reduced-motion, forced-colours and accessibility behaviour.

## Stage 4 — Mosque / smart-display themes ✅
- [x] Add display-oriented variants with strong clock, next-prayer, prayer/Iqamah and announcement hierarchy.
- [x] Support mosque branding without sacrificing readability at viewing distance.
- [x] Reuse shared semantic tokens rather than introducing an independent styling system.

## Stage 5 — Visual regression and accessibility QA ✅
- [x] Cover representative Light/Dark/System + palette combinations across phone, tablet, web and display targets.
- [x] Add contrast, text-clipping, RTL and large-text acceptance where practical.
- [x] Preserve regression fixtures for the reported Today and Qiblah readability failures.

## Stage 5.1 — Hijri-aligned prayer calendar
- [x] Correct Hijri/Gregorian alignment using the Umm al-Qura calendar with the existing optional ±2-day local correction.
- [x] Standardise English Hijri month names: Muharram, Safar, Rabi al-Awwal, Rabi al-Akhir, Jumada al-Ula, Jumada al-Akhirah, Rajab, Sha'ban, Ramadan, Shawwal, Dhu al-Qi'dah, Dhu al-Hijjah.
- [x] Add explicit reference acceptance for 1 January 2026 = 12 Rajab 1447 AH and key 2026 month/year boundaries.
- [x] Add a separate Prayer Calendar route with Daily, Weekly, Monthly and Yearly views; do not alter the Today screen.
- [x] Keep every calendar view derived from the same civil-date, Hijri and prayer-time calculation pipeline so views remain mutually aligned.
- [x] Add responsive/RTL/accessibility styling and regression/acceptance coverage.
- [ ] Validate Stage 5.1 on the exact final head and mark complete.

Stage 5.1 implementation: canonical Hijri presentation now emits `AH` explicitly rather than relying on an ambiguous era label; `src/domain/prayerCalendar.ts` derives date ranges and prayer rows from the same location/timezone/calculation settings as the app; `PrayerCalendarScreen` supplies Daily/Weekly/Monthly/Yearly views on a separate Calendar destination; `prayerCalendar.test.ts` locks the requested 2026 reference alignment and month names; `calendar:check` is enforced by the Quality Gate. Exact-head CI validation is pending before this stage is marked complete.

## Stage 6 — Instructions guide
- [ ] Create `Instructions guide.md` for ordinary users and mosque administrators.
- [ ] Cover Android, iPhone/iPad, Web/PWA, Raspberry Pi and TV/kiosk operation.
- [ ] Document setup, location, prayer calculation/madhhab, Iqamah, Qiblah, mosque features, Adhan/notifications, language/themes, offline use, displays, updates, troubleshooting and reset.

## Stage 7 — v1.5.1 reconciliation
- [ ] Run relevant quality, visual, web/mobile/display and accessibility gates on the exact final head.
- [ ] Reconcile this tracker and mark v1.5.1 complete only when all stages pass.
