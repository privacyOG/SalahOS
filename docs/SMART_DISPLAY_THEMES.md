# Smart-display themes

**Author:** privacyOG

## Purpose

Smart-display themes control only the presentation used by SalahOS smart-display mode for TV, kiosk and dedicated prayer-display deployments. They are deliberately independent from the personal application `system` / `light` / `dark` appearance preference.

Changing a smart-display theme therefore does not alter the ordinary phone/web application appearance, prayer calculations, timetable sources, notifications or stored mosque content.

## Presets

The initial deterministic preset registry contains:

- `classic` — bright neutral surfaces with restrained green accents;
- `midnight` — deep navy surfaces with restrained gold accents;
- `sandstone` — warm stone and parchment tones;
- `emerald` — dark green surfaces with luminous prayer highlights.

The preset identifier is the persisted contract. User-facing labels may be localized without changing the stored value.

## Persistence

The selected preset is stored locally under `salahos.smartDisplayTheme`.

Web installations use the application storage adapter. Android includes the same key in the native Preferences hydration allow-list so the selected smart-display preset survives application restart. Invalid or missing values fail closed to `classic`.

## Runtime application

`SmartDisplay` reads the persisted preset and exposes it as `data-display-theme` on the smart-display root. Theme CSS overrides only the display-scoped custom properties used by that root.

The settings surface dispatches a local `salahos:smart-display-theme-change` event after saving a selection. An already-mounted smart display can therefore refresh its preset without changing prayer state or reloading remote content.

## Design constraints

- Theme presets must preserve high legibility at viewing distance.
- Prayer hierarchy and current/next-prayer emphasis must remain intact.
- Theme selection must not introduce network access.
- Arbitrary user-supplied CSS is not accepted.
- Theme choice must not mutate personal app appearance.
- Reduced-motion and burn-in mitigation behaviour remain controlled by the shared smart-display stylesheet.

## Extension

Additional presets can be added by extending the typed registry and adding a matching `.smart-display[data-display-theme='...']` token block. Any new preset must be covered by the quality and visual-regression gates before it is considered supported.
