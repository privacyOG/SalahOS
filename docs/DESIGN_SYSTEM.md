# SalahOS Design System

## Purpose

This document defines the Stage 22 visual and interaction foundation for SalahOS. It applies to the congregation application, managed-masjid administration, Raspberry Pi Touch Display 2 surfaces, and TV/kiosk presentation where the shared web UI is used.

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

## Semantic tokens

The implementation lives in `src/design-system.css`. New UI must use semantic tokens rather than introducing component-specific literal colours, radii or shadows.

### Surfaces

- `--salah-bg-canvas`: application background.
- `--salah-bg-subtle`: low-emphasis secondary background.
- `--salah-bg-surface`: standard card/panel surface.
- `--salah-bg-surface-raised`: modal or elevated surface.
- `--salah-bg-control`: form/control surface.
- `--salah-bg-accent-soft`: selected/current/next emphasis surface.

### Foreground content

- `--salah-fg-primary`: primary readable content.
- `--salah-fg-secondary`: supporting content.
- `--salah-fg-tertiary`: labels and metadata.
- `--salah-fg-accent`: positive/action emphasis.
- `--salah-fg-warning`: caution/current-state emphasis.
- `--salah-fg-provenance`: calculation/source provenance.

### Structure and interaction

- `--salah-border-subtle`, `--salah-border-default`, `--salah-border-strong`.
- `--salah-focus-ring`.
- radius scale from `--salah-radius-xs` through `--salah-radius-xl`, plus `--salah-radius-pill`.
- spacing scale from `--salah-space-1` through `--salah-space-16`.
- elevation tokens `--salah-shadow-sm`, `--salah-shadow-md`, `--salah-shadow-hero`.
- motion tokens `--salah-motion-fast`, `--salah-motion-standard`, `--salah-ease-standard`.

The existing `--page`, `--text`, `--card`, `--control` and related variables are temporarily retained as compatibility aliases while Stage 22 is incremental. New components should prefer the `--salah-*` names.

## Typography

The shared scale is intentionally fluid rather than device-specific hard-coded pixel sizes:

- `--salah-text-xs`: metadata, compact labels and badges.
- `--salah-text-sm`: supporting copy.
- `--salah-text-md`: normal body/control content.
- `--salah-text-lg`: important values/headings.
- `--salah-text-xl`: major clock/section information.
- `--salah-text-display`: primary hero/display heading.
- `--salah-text-countdown`: next-prayer countdown.

Prayer times and countdowns must use tabular numerals where available. Arabic pages must not inherit Latin-only tracking or forced uppercase treatment.

## Reusable primitives

Stage 22 introduces CSS primitives that may be used by new React components without duplicating visual rules:

- `.ds-surface`: standard panel/card shell.
- `.ds-surface-raised`: elevated panel shell.
- `.ds-stack`: vertical content rhythm.
- `.ds-inline`: wrapping inline action/status group.
- `.ds-status-pill`: compact semantic state label.
- `.ds-empty-state`: accessible empty/unconfigured state container.

Existing production panels are progressively mapped onto the same tokens so the application can migrate without a disruptive domain rewrite.

## Responsive navigation contract

The managed-platform roadmap will use one information architecture with different navigation presentations:

- Phone: bottom navigation for primary congregation destinations; secondary configuration in sheets/pages.
- Tablet/desktop: persistent or collapsible side navigation when multiple destinations are implemented.
- TV/kiosk: focusable display controls only when administration/escape is required; ordinary signage remains presentation-first.
- Touch Display 2: touch-sized navigation appropriate to its viewport/orientation without duplicating application logic.

Navigation items must not be exposed as dead controls before their destination exists.

## Accessibility requirements

All new UI must:

- retain visible keyboard focus;
- meet the existing touch-target requirements;
- remain usable with `prefers-reduced-motion`;
- preserve high-contrast and forced-colours operation;
- use semantic HTML before ARIA overrides;
- support English and Arabic/RTL before being marked complete;
- isolate administrator/provider mixed-direction text where required;
- avoid using colour as the only indication of current, next, warning or failure state.

## State model

Managed-platform surfaces must eventually distinguish these states explicitly:

- loading;
- offline but locally usable;
- sync pending;
- synchronized;
- stale remote data;
- synchronization failure;
- unconfigured/empty;
- permission denied where applicable.

The existing offline prayer experience remains authoritative for local calculation and must not be replaced by a generic network-error screen.

## Human visual acceptance

Automated clipping/overflow and screenshot gates remain required, but Stage 22 also requires human review before a major UI milestone is called visually complete.

Review each supported visual milestone for:

- visual hierarchy: next prayer is immediately identifiable;
- prayer/start/Iqamah distinction is unambiguous;
- restrained density and sufficient whitespace;
- readable typography at phone/tablet sizes;
- Arabic/RTL balance and mixed-direction safety;
- light and dark theme quality rather than mere functional inversion;
- no visually dominant advanced controls on the everyday prayer view;
- 1080p/4K long-distance readability for dedicated display templates;
- no decorative animation that conflicts with reduced-motion or long-running kiosk use.

## Stage 22 migration rule

Stage 22 is an incremental UI refactor. A visual change must not alter prayer calculations, timetable semantics, location persistence, notification scheduling or offline guarantees merely to simplify component code. Domain behaviour remains covered by the existing test suite and quality gates.
