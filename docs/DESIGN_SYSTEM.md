# SalahOS Design System

## Purpose

This document defines the completed UI/UX v2 visual and interaction foundation for SalahOS. It applies to the congregation application, managed-masjid administration, Raspberry Pi Touch Display 2 surfaces, and TV/kiosk presentation where the shared web UI is used.

The design system exists to keep the product modern, restrained, readable and consistent without coupling visual decisions to prayer-domain logic.

## Product hierarchy

The congregation experience follows this priority order:

1. Current time and next prayer.
2. Prayer start and Iqamah/Jama'ah information.
3. Today's complete prayer schedule.
4. Selected mosque/location and source provenance.
5. Relevant Jumu'ah, Ramadan, announcement or event context.
6. Advanced calculation, import and administration controls.

Configuration must not visually compete with prayer information during normal daily use.

## Authoritative layer

`src/design-system.css` is the only stylesheet allowed to define semantic `--salah-*` tokens. `src/design-system-primitives.css` consumes those tokens to provide reusable layout, typography, control, state and content patterns. Feature stylesheets may compose these contracts but must not redefine semantic tokens or reclaim global shell ownership.

The Quality Gate runs `scripts/check-design-system-ownership.mjs` so token leakage, retired global ownership and missing primitive contracts fail CI rather than becoming gradual visual drift.

## Semantic tokens

### Surfaces

- `--salah-bg-canvas`: application background.
- `--salah-bg-subtle`: low-emphasis secondary background.
- `--salah-bg-surface`: standard card/panel surface.
- `--salah-bg-surface-raised`: dialog, menu or intentionally elevated surface.
- `--salah-bg-control`: form/control surface.
- `--salah-bg-accent-soft`: selected/current/next emphasis surface.
- `--salah-bg-canvas-glow`: restrained canvas-level decorative glow.
- `--salah-bg-warning-soft`: warning-state background that remains subordinate to readable content.

### Foreground content

- `--salah-fg-primary`: primary readable content.
- `--salah-fg-secondary`: supporting content.
- `--salah-fg-tertiary`: labels and metadata.
- `--salah-fg-accent`: positive/action and Iqamah emphasis.
- `--salah-fg-warning`: caution, stale, offline and destructive emphasis.
- `--salah-fg-provenance`: calculation/source provenance.

### Structure and interaction

- Borders: `--salah-border-subtle`, `--salah-border-default`, `--salah-border-strong`.
- Focus: `--salah-focus-ring`.
- Radius scale: `--salah-radius-xs` through `--salah-radius-xl`, plus `--salah-radius-pill`.
- Elevation: `--salah-shadow-sm`, `--salah-shadow-md`, `--salah-shadow-hero`, plus `--salah-shadow-color` for composed shadows that cannot use a preset elevation.
- Motion: `--salah-motion-fast`, `--salah-motion-standard`, `--salah-ease-standard`.

Stage 27 retired the root `--page`, `--text`, `--card`, `--control` and related compatibility aliases. Application and administration UI must use `--salah-*` semantic tokens directly. Prayer-board and Touch Display palettes may keep locally scoped template variables when they are declared on the display surface itself and cannot leak into congregation or administration pages.

## Spacing and page geometry

The shared spacing scale is 8px-oriented. `--salah-space-2` (8px), `--salah-space-4` (16px), `--salah-space-6` (24px), `--salah-space-8` (32px), `--salah-space-10` (40px), `--salah-space-12` (48px) and `--salah-space-16` (64px) are the normal rhythm. `--salah-space-1` (4px), `--salah-space-3` (12px) and `--salah-space-5` (20px) are compact exceptions for badges, dense controls, display templates and small internal gaps.

- `.ds-page` owns normal congregation/administration content width and responsive page gutters.
- `.ds-section` owns normal vertical section spacing.
- `.ds-stack`, `.ds-stack--compact` and `.ds-stack--loose` own vertical rhythm.
- `.ds-inline` owns wrapping horizontal action/status groups.

Feature screens may use a narrower maximum width when their content benefits from it, but should inherit the same page gutter and spacing scale.

## Typography roles

The token scale remains fluid rather than device-specific. Reusable roles are:

- `.ds-type-display-clock`: long-distance or hero clock.
- `.ds-type-countdown`: next-prayer countdown.
- `.ds-type-prayer-name`: primary prayer identity.
- `.ds-type-prayer-time`: Athan/start time.
- `.ds-type-iqamah`: Iqamah/Jama'ah time.
- `.ds-type-section-heading`: page subsection heading.
- `.ds-type-body`: normal readable prose.
- `.ds-type-metadata`: supporting state/source/location information.
- `.ds-type-caption`: compact labels and captions.

Prayer times, Iqamah values, clocks and countdowns use tabular numerals where available. Arabic pages do not inherit Latin-only tracking or forced uppercase treatment.

## Buttons and controls

Use `.ds-button` with exactly one intent variant:

- `.ds-button--primary`: strongest affirmative action on the current surface.
- `.ds-button--secondary`: normal action.
- `.ds-button--quiet`: low-emphasis navigation or tertiary action.
- `.ds-button--destructive`: destructive/reset/remove action.
- `.ds-button--icon`: icon-only button; it still requires an accessible name.

`DesignButton` exposes these variants to React without duplicating class composition.

Forms use `.ds-field` with `.ds-field__label`, a native input/select/textarea or `.ds-field__control`, and optional `.ds-field__hint`. `FormField` provides the shared React contract. Controls must retain native semantics and explicit labels.

The following interaction patterns are defined in `design-system-primitives.css`:

- `.ds-segmented`: mutually exclusive or compact mode selection using buttons with `aria-pressed`.
- `.ds-tabs`: tablist presentation using `role="tab"` and `aria-selected`.
- `.ds-switch`: labelled checkbox/switch row; native checkbox behavior remains authoritative.
- `.ds-dialog`: centred modal/dialog surface.
- `.ds-sheet`: edge/bottom sheet surface for narrow displays.
- `.ds-popover`: anchored contextual surface.
- `.ds-tooltip`: short non-interactive explanation.
- `.ds-menu`: compact action/navigation menu.

These classes define visual treatment, not replacement semantics. Native `<dialog>`, buttons, inputs and appropriate ARIA patterns remain required.

## Reusable product components

`src/ui/DesignSurface.tsx` provides:

- `DesignSurface`.
- `DesignButton`.
- `FormField`.
- `StatusPill`.
- `StateBanner`.
- `EmptyState`.
- `PrayerRow`.
- `NextPrayerSummary`.
- `MosqueSummary`.
- `AnnouncementPreview`.

The matching CSS contracts are `.ds-surface`, `.ds-status-pill`, `.ds-banner`, `.ds-empty-state`, `.ds-prayer-row`, `.ds-next-prayer`, `.ds-mosque-summary` and `.ds-announcement-preview`.

Nested summaries should normally use the subtle surface without another shadow. Raised shadows are reserved for deliberate hierarchy such as dialogs, overlays or the single dominant prayer surface.

## Shared state model

Use explicit UI states instead of ambiguous generic notices:

- `loading`: work is in progress; skeletons may be used where layout is known.
- `offline`: locally usable data remains authoritative without network access.
- `stale`: stored or managed data is usable but not current.
- `sync-pending`: local work is waiting to synchronize.
- `sync-error`: synchronization failed and needs attention.
- `permission-denied`: a requested capability is unavailable because permission was denied.
- `empty`: the feature is configured correctly but has no content yet.

`StateBanner` and `.ds-banner[data-state]` provide the common contract. `.ds-skeleton` is the shared loading placeholder and automatically disables shimmer under reduced-motion preferences.

The existing offline prayer experience remains authoritative for local calculation and must never be replaced by a generic network-error screen.

## Icon family

`src/ui/SalahIcon.tsx` is the shared stroked icon family. It currently owns ten product concepts:

- Today.
- Mosques.
- Qiblah.
- Community.
- Settings.
- Prayer.
- Iqamah.
- Location.
- Display.
- Administration.

Decorative icons are hidden from assistive technology by default. Standalone meaningful icons accept a title and image role. Feature screens should extend this family rather than introduce unrelated stroke weights or geometry.

## Responsive navigation contract

- Phone: five-item bottom navigation for congregation destinations.
- Tablet: compact navigation rail with content-aware layouts where useful.
- Desktop/web: persistent readable navigation with page context.
- TV/kiosk: ordinary congregation navigation is absent during normal display mode.
- Touch Display 2 deterministic fixture routes remain isolated from congregation navigation.

`PrimaryNavigation` uses `SalahIcon` so navigation and feature iconography share one family.

## Light and dark visual rules

Light and dark themes are independent semantic palettes, not an inversion filter.

- Canvas and surface contrast must remain distinct without requiring heavy borders.
- Primary text keeps the highest contrast; secondary and tertiary text remain readable but visibly subordinate.
- Accent-soft surfaces indicate selection/current/next state without saturating large areas.
- Warning colour is reserved for caution, stale/offline/error/destructive meaning rather than decoration.
- Raised shadows are intentionally weaker in light mode and stronger in dark mode; ordinary nested surfaces should avoid additional elevation.
- Focus-ring contrast must remain visible against both canvas and control surfaces.
- Screens must be reviewed in both themes because functional token substitution alone is not sufficient visual acceptance.

## Accessibility requirements

All new UI must:

- retain visible keyboard focus;
- meet the existing touch-target requirements;
- remain usable with `prefers-reduced-motion`;
- preserve `prefers-contrast` and forced-colours operation;
- use semantic HTML before ARIA overrides;
- support English and Arabic/RTL before being marked complete;
- isolate administrator/provider mixed-direction text where required;
- avoid using colour as the only indication of current, next, warning or failure state.

## Human visual acceptance

Automated clipping/overflow and screenshot gates remain required, but major UI milestones also require human review for:

- next-prayer hierarchy;
- unambiguous prayer/start/Iqamah distinction;
- restrained density and sufficient whitespace;
- phone/tablet typography;
- Arabic/RTL balance and mixed-direction safety;
- light and dark theme quality;
- no visually dominant advanced controls on everyday prayer views;
- 1080p/4K long-distance readability for display templates;
- no decorative animation that conflicts with reduced-motion or long-running kiosk use.

## UI/UX v2 architecture

Stage 27 is the final ownership boundary for the v2 application. Congregation navigation is owned by `CongregationShell`; each destination mounts its own screen directly. `SettingsScreen` owns explicit category panels for Location, Mosque & Iqamah, Notifications & Adhan, Advanced prayer tools, appearance/data controls and personal display themes. It must never mount the retired single-page application and hide unrelated sections with CSS.

TV/kiosk mode is isolated in `SmartDisplayApplication`, which owns clock recovery, prayer calculation/source application, notification resynchronisation, theme/locale application and keyboard exit before rendering `SmartDisplay`. The retired `src/App.tsx` monolith must not return. Administration remains isolated under `AdminShell`; fleet credentials and managed-display controls do not mount inside congregation settings.

`scripts/check-ui-v2-retirement.mjs` is a permanent Quality Gate policy. It rejects the retired monolith, legacy destination-hiding wrappers, root portal/MutationObserver settings injection and root compatibility-token declarations. `scripts/visual-ui-v2-retirement.mjs` is the matching runtime acceptance check and captures final Stage 27 evidence for migrated settings and smart-display ownership.

Prayer calculations, timetable semantics, location persistence, notification scheduling and offline guarantees remain domain-owned and must not change merely to simplify UI composition.
