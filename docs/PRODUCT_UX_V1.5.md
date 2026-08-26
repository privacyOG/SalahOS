# SalahOS v1.5 Product UX

Stage 8 keeps the existing SalahOS visual identity while making daily use more prayer-first and less configuration-heavy.

## Today hierarchy

The Today surface now presents the current prayer, next prayer/countdown, local location confidence and weather before the daily prayer table. Seasonal/community alerts remain visible when relevant. Solar times, Jumu'ah, shortcuts and technical calculation provenance use a `More today` disclosure so the primary prayer workflow stays compact.

Location feedback distinguishes a recent live/cached fix from a saved fallback and exposes approximate/precise status plus accuracy when available. This is presentation only; prayer calculations continue to use the existing shared best-available-location resolver.

## Mobile navigation

Phone navigation exposes Today, Mosques, Qiblah, Knowledge and Settings directly. Community remains available through contextual product surfaces instead of occupying the persistent prayer bar, while tablet/desktop navigation continues to show all six destinations directly. This avoids the previous six-items-in-five-columns phone layout without removing the Community route.

## Settings information architecture

Settings has seven canonical groups, in this order:

1. Location
2. Prayer
3. Adhan
4. Display
5. Mosques
6. Privacy & data
7. Advanced

Display now owns language, clock/appearance, prayer-board themes, weather presentation and managed-display entry points. Legacy `settingsView` links (`mosque`, `notifications`, `appearance`, `display-themes`, `data-privacy`) are migrated at read time to the corresponding canonical group, so existing links remain useful.

## Verification

`scripts/visual-product-ux-stage8.mjs` validates phone navigation, the Today content order, progressive disclosure, seven Settings categories, legacy deep-link migration and Arabic RTL behaviour. It runs inside the permanent `visual:check` matrix.
