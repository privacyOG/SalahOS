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

Stage 4 implementation: `src/mosque-display-theme.css` adds viewing-distance hierarchy for clocks, next prayer, prayer/Iqamah rows, announcements and subordinate mosque branding. Royal Blue, Emerald Mosque, Midnight Gold and High Contrast receive display treatments while consuming the Stage 2 semantic palette contract. Smart-display runtime explicitly reapplies persisted palette + appearance and keeps reduced-motion/forced-colour behaviour.

## Stage 5 — Visual regression and accessibility QA ✅
- [x] Cover representative Light/Dark/System + palette combinations across phone, tablet, web and display targets.
- [x] Add contrast, text-clipping, RTL and large-text acceptance where practical.
- [x] Preserve regression fixtures for the reported Today and Qiblah readability failures.

Stage 5 implementation: `scripts/visual-theme-matrix.mjs` covers Today phone/light, Qiblah phone/dark, Settings tablet/System, high-contrast web, 1080p and 4K smart displays, plus Arabic RTL at 125% text size. It checks applied mode/palette, System resolution, RTL, horizontal clipping and visible text contrast. `scripts/check-theme-stage45.mjs` statically enforces the mosque hierarchy and matrix coverage. Both are wired into repository quality/visual gates; the Stage 1 Today/Qiblah contrast regression guard remains active.

## Stage 6 — Instructions guide
- [ ] Create `Instructions guide.md` for ordinary users and mosque administrators.
- [ ] Cover Android, iPhone/iPad, Web/PWA, Raspberry Pi and TV/kiosk operation.
- [ ] Document setup, location, prayer calculation/madhhab, Iqamah, Qiblah, mosque features, Adhan/notifications, language/themes, offline use, displays, updates, troubleshooting and reset.

## Stage 7 — v1.5.1 reconciliation
- [ ] Run relevant quality, visual, web/mobile/display and accessibility gates on the exact final head.
- [ ] Reconcile this tracker and mark v1.5.1 complete only when all stages pass.
