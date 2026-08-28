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

Stage 2 implementation: `src/theme-palettes.css` contains the curated semantic variants; `src/platform/themePalette.ts` defines the shared palette contract; palette is validated/persisted through `settingsStorage` and selectable independently from System/Light/Dark in Display settings.

## Stage 3 — Theme architecture and cross-platform consistency ✅
- [x] Centralise palette + appearance-mode resolution through semantic design tokens.
- [x] Ensure Android, iOS/iPadOS, Web/PWA and display/kiosk surfaces consume the same theme contract where applicable.
- [x] Preserve RTL, reduced-motion, forced-colours and accessibility behaviour.

Stage 3 implementation: bootstrap now applies persisted appearance + palette before rendering the shared React/Capacitor surface, so Web/PWA and packaged Android/iOS consume the same semantic CSS contract and display/kiosk routes inherit it from the same root. Existing RTL/reduced-motion/forced-colour layers remain intact. `scripts/check-theme-architecture.mjs` enforces palette completeness, Light/Dark variants, persistence, bootstrap integration, Display-settings exposure and forced-colours support; it is wired into `npm run check`.

## Stage 4 — Mosque / smart-display themes
- [ ] Add display-oriented variants with strong clock, next-prayer, prayer/Iqamah and announcement hierarchy.
- [ ] Support mosque branding without sacrificing readability at viewing distance.
- [ ] Reuse shared semantic tokens rather than introducing an independent styling system.

## Stage 5 — Visual regression and accessibility QA
- [ ] Cover representative Light/Dark/System + palette combinations across phone, tablet, web and display targets.
- [ ] Add contrast, text-clipping, RTL and large-text acceptance where practical.
- [ ] Preserve regression fixtures for the reported Today and Qiblah readability failures.

## Stage 6 — Instructions guide
- [ ] Create `Instructions guide.md` for ordinary users and mosque administrators.
- [ ] Cover Android, iPhone/iPad, Web/PWA, Raspberry Pi and TV/kiosk operation.
- [ ] Document setup, location, prayer calculation/madhhab, Iqamah, Qiblah, mosque features, Adhan/notifications, language/themes, offline use, displays, updates, troubleshooting and reset.

## Stage 7 — v1.5.1 reconciliation
- [ ] Run relevant quality, visual, web/mobile/display and accessibility gates on the exact final head.
- [ ] Reconcile this tracker and mark v1.5.1 complete only when all stages pass.
