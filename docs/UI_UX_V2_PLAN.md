# SalahOS UI/UX v2 Upgrade Plan

## Purpose

This plan defines the next major SalahOS interface and experience upgrade. The objective is not a cosmetic restyle. The current single-page composition must be replaced with a clearer product architecture that separates everyday congregation use, mosque administration and dedicated display/signage operation while preserving the existing prayer calculation, offline, notification and managed-masjid domain behaviour.

The redesign must produce a modern, calm, neat and highly usable interface across phones, tablets, desktop/web, Raspberry Pi Touch Display 2, 1080p/4K television displays and kiosk deployments.

The daily prayer display surface must also become a first-class configurable product with at least six original SalahOS prayer-board designs. These designs may take broad inspiration from established prayer-board patterns such as large clocks, scenic backgrounds, Athan/Iqamah tables and strong next-prayer emphasis, but must use original SalahOS layouts, styling, assets and branding.

## Non-negotiable product principles

- Prayer information remains the primary visual hierarchy for congregation-facing surfaces.
- Current time, next prayer, Athan/start time and Iqamah/Jama'ah must be understandable at a glance.
- Advanced calculation, import, administration and display-management controls must not compete with ordinary daily prayer use.
- Congregation, administration and display/signage experiences must be distinct product surfaces.
- Existing local-first prayer calculation and offline operation must remain functional throughout the migration.
- Existing prayer-source provenance, timetable semantics and notification behaviour must not be weakened for visual simplicity.
- English and Arabic/RTL remain first-class acceptance targets; Turkish and Indonesian must remain supported.
- UI density must be deliberately controlled. Not every piece of information should be presented as a bordered card.
- New layouts must support keyboard, touch, remote-control and assistive-technology use where applicable.
- Large-display designs must be readable from several metres away at 1080p and 4K.
- Custom imagery and branding must preserve text contrast and must not obscure prayer information.
- Remote/optional content such as weather must fail independently and must never block local prayer-time display.

---

# Stage 22 — UI/UX v2 architecture and visual redesign

## 22.1 Product-surface separation

- [x] Replace the current feature-stacked composition with explicit product surfaces.
- [x] Create a dedicated congregation application layout.
- [x] Create a dedicated managed-masjid administration layout.
- [x] Keep TV/kiosk/signage presentation separate from congregation navigation and administration forms.
- [x] Keep deterministic Touch Display 2 fixture/testing routes isolated from unrelated application chrome.
- [x] Define stable screen/destination state instead of relying on DOM scrolling and CSS hiding as the primary navigation mechanism.
- [x] Preserve deep-link/reload behaviour for supported destinations.
- [x] Ensure route/surface separation does not duplicate or fork prayer-domain logic.

### Congregation application information architecture

- [x] Today.
- [x] Mosques.
- [x] Qiblah.
- [x] Community.
- [x] Settings.
- [ ] Place Announcements and Events inside Community using clear secondary navigation/tabs rather than expanding phone primary navigation beyond five destinations.

### Managed-masjid administration information architecture

- [ ] Overview.
- [ ] Prayer & Iqamah.
- [ ] Jumu'ah & Ramadan.
- [ ] Community content.
- [ ] Displays.
- [ ] Integrations.
- [ ] Members & permissions.
- [ ] Administration settings.

### Responsive navigation

- [x] Phone: five-item bottom navigation with consistent iconography and labels.
- [x] Tablet: compact navigation rail with content-aware two-column layouts where useful.
- [x] Desktop/web: persistent or collapsible sidebar with page title/context area.
- [x] TV/kiosk: no ordinary congregation navigation chrome in normal display mode.
- [x] Support logical RTL navigation order and icon/text alignment.

---

## 22.2 Design System v2

- [ ] Consolidate semantic colour, spacing, typography, radius, border, elevation and motion tokens into one authoritative layer.
- [ ] Remove overlapping global overrides where multiple stylesheets redefine the same shell, hero, spacing or responsive rules.
- [ ] Define an 8px-oriented spacing rhythm with documented exceptions for compact display layouts.
- [ ] Define consistent content-width, page-gutter and section-spacing rules.
- [ ] Define typography roles for display clock, countdown, prayer name, prayer time, Iqamah, section heading, body, metadata and captions.
- [ ] Ensure prayer times and countdowns use tabular numerals where appropriate.
- [ ] Define consistent button variants: primary, secondary, quiet, destructive and icon-only.
- [ ] Define consistent form-field, segmented-control, tabs, switch, banner, dialog, sheet, popover, tooltip and menu patterns.
- [ ] Define reusable prayer-row, next-prayer, mosque-summary, announcement-preview and status components.
- [ ] Define a coherent icon family for Today, Mosques, Qiblah, Community, Settings, prayer, Iqamah, location, display and administration concepts.
- [ ] Reduce unnecessary borders, nested cards and shadows.
- [ ] Preserve high-contrast, forced-colours and reduced-motion support.
- [ ] Add explicit skeleton/loading, offline, stale, sync-pending, sync-error, permission-denied and empty states.
- [ ] Document light and dark visual rules rather than relying on simple colour inversion.

---

## 22.3 Today / daily prayer application redesign

- [x] Replace the large introductory hero treatment with a compact application/header area.
- [x] Keep SalahOS branding, current location/preferred mosque, date and language access visible without dominating the page.
- [x] Make the next prayer the dominant content block.
- [x] Show next prayer name, Athan/start time, Iqamah/Jama'ah time and countdown with unambiguous labels.
- [x] Present today's full prayer schedule as a clean secondary timetable instead of six visually competing cards on narrow screens.
- [x] Clearly distinguish obligatory prayers from supplementary times such as Sunrise.
- [x] Highlight current/next prayer without relying on colour alone.
- [x] Surface selected mosque/location and data provenance in a compact secondary treatment.
- [x] Surface Jumu'ah context when relevant.
- [ ] Surface Ramadan/Suhur/Imsak/Iftar/Taraweeh context only when relevant rather than permanently increasing daily density.
- [x] Add at most a small number of useful quick actions below prayer information, such as Qiblah, Mosque and Notifications.
- [ ] Add optional announcement/event preview beneath core prayer information without allowing community content to dominate the prayer view.
- [ ] Design polished states for no location, no selected mosque, offline managed data, stale managed data and unavailable astronomical events.

---

## 22.4 Dedicated Qiblah experience

- [x] Move the Qiblah Finder out of the long stacked home flow into its own primary congregation destination.
- [ ] Give the live compass/bearing a dedicated full-screen hierarchy.
- [ ] Present current location and bearing clearly above/beside the compass depending on device size.
- [ ] Keep calibration, sensor quality, true-north/magnetic-declination and alignment guidance understandable but visually subordinate.
- [ ] Put city search, saved-location selection and map-pin workflows in secondary sheets/panels rather than always-visible large forms.
- [ ] Preserve offline bearing calculation and explicit network gating for optional map imagery.
- [ ] Validate portrait phone, landscape phone, tablet and desktop layouts independently.

---

## 22.5 Mosques and Community screens

### Mosques

- [ ] Create a dedicated mosque discovery/favourites screen.
- [ ] Separate followed mosques from location/GPS settings.
- [ ] Present mosque prayer/Iqamah freshness and provenance clearly.
- [ ] Create a polished mosque profile screen with today's prayer times, Jumu'ah, next prayer, announcements, events and contact/facility information.
- [ ] Keep nearby search privacy-gated and explicit.

### Community

- [x] Create a dedicated Community destination.
- [ ] Add Announcements and Events as clear secondary tabs/views.
- [ ] Remove community administration/import controls from the normal congregation reading experience.
- [ ] Use compact preview cards with clear hierarchy, expiry/status and optional call-to-action.
- [ ] Provide useful empty states when no managed content exists.

---

## 22.6 Settings restructuring and progressive disclosure

- [ ] Replace the current large settings form with category-based navigation.
- [ ] Create Prayer Settings category.
- [ ] Create Location category.
- [ ] Create Mosque & Iqamah category.
- [ ] Create Notifications & Adhan category.
- [ ] Create Appearance & Language category.
- [ ] Create Data & Privacy category.
- [ ] Create Display Themes category where applicable.
- [ ] Create Advanced category for import/export, raw coordinates and uncommon calculation controls.
- [ ] Move manual mosque timetable authoring/import into appropriate administration/advanced workflows instead of presenting it as normal daily-use configuration.
- [ ] Use explanatory copy only where needed; do not turn settings into dense documentation pages.

---

# Stage 23 — Daily Prayer Display Theme Library

## 23.1 Shared prayer-board template engine

- [ ] Define one shared display data contract for all prayer-board templates.
- [ ] Define reusable slots/modules for current time, dates, next prayer, countdown, prayer timetable, Jumu'ah, sunrise/sunset, mosque branding, announcements and optional weather.
- [ ] Create a template registry with stable template identifiers and versioned configuration.
- [ ] Ensure template choice never changes prayer calculations or prayer-source semantics.
- [ ] Allow per-template module visibility without allowing required prayer information to become ambiguous.
- [ ] Support 12-hour and 24-hour clock presentation.
- [ ] Support English, Arabic/RTL, Turkish and Indonesian.
- [ ] Support bilingual English/Arabic display mode where layout space permits.
- [ ] Support mosque name and validated logo branding.
- [ ] Support controlled accent-colour presets.
- [ ] Support approved custom background images with crop/focal-point controls.
- [ ] Enforce contrast overlays/scrims automatically when background imagery reduces readability.
- [ ] Provide sensible built-in artwork/pattern fallbacks so custom images are optional.
- [ ] Keep external/remote content isolated from the authoritative local prayer board.
- [ ] Keep all templates deterministic and usable when offline.

## 23.2 Template 1 — Heritage Classic

- [ ] Implement an original SalahOS Heritage Classic design.
- [ ] Use refined Islamic geometric/pattern styling and optional mosque/calligraphy imagery without copying third-party artwork.
- [ ] Use a strong Athan/Iqamah timetable region and a separate clock/next-prayer region.
- [ ] Include compact Jumu'ah and sunrise/sunset modules.
- [ ] Support dark, jewel-toned and neutral preset variants while preserving high contrast.
- [ ] Validate long mosque names and Arabic calligraphic/RTL-adjacent content without collisions.

## 23.3 Template 2 — Minimal Modern

- [ ] Implement an original SalahOS Minimal Modern design.
- [ ] Use a calm neutral canvas, large clock, restrained cards and strong typography.
- [ ] Present prayer times in a clean lower strip/grid.
- [ ] Use a compact next-prayer/countdown component that remains obvious from viewing distance.
- [ ] Provide light and dark variants.
- [ ] Avoid unnecessary ornamentation and visual noise.

## 23.4 Template 3 — Bold Countdown Focus

- [ ] Implement an original SalahOS Bold Countdown Focus design.
- [ ] Make current time and next-prayer countdown the dominant display elements.
- [ ] Keep today's full timetable visible as a secondary band.
- [ ] Provide strong current/next state transitions that do not depend on animation.
- [ ] Support optional pre-Iqamah and Iqamah-now states.
- [ ] Prioritize long-distance readability over decorative content.

## 23.5 Template 4 — Structured Split Board

- [ ] Implement an original SalahOS Structured Split Board design.
- [ ] Use a precise Athan/start versus Iqamah/Jama'ah column layout.
- [ ] Use a separate clock/date/next-prayer column or region.
- [ ] Provide dedicated compact areas for multiple Jumu'ah sessions and sunrise/sunset.
- [ ] Optimize for mosques and schools that prioritise information density and precision.
- [ ] Maintain clean alignment at both 1080p and 4K without looking like a spreadsheet.

## 23.6 Template 5 — Scenic Spiritual

- [ ] Implement an original SalahOS Scenic Spiritual design.
- [ ] Support full-bleed mosque, landscape or architectural backgrounds.
- [ ] Use adaptive overlays/gradients to guarantee prayer-text contrast.
- [ ] Present clock, next prayer and timetable in restrained translucent/solid readable regions.
- [ ] Provide built-in scenic imagery or abstract SalahOS artwork that is licensed/owned for distribution.
- [ ] Ensure the template remains useful with imagery disabled.

## 23.7 Template 6 — Family & Classroom

- [ ] Implement an original SalahOS Family & Classroom design.
- [ ] Use bright but dignified colours, large labels and approachable iconography.
- [ ] Make prayer names, Athan and Iqamah especially easy to learn and distinguish.
- [ ] Support optional daylight/sunrise/sunset cues.
- [ ] Support optional simplified educational hints without adding them to mosque signage by default.
- [ ] Keep the design appropriate for homes, Islamic schools and children's learning spaces without becoming toy-like.

## 23.8 Optional future template — Ambient Minimal

- [ ] Research an ultra-minimal ambient prayer board for premium home/office displays after the six required templates are complete.

---

## 23.9 Prayer-board configuration and preview UX

- [ ] Add a visual template gallery with thumbnail/live previews for all six required designs.
- [ ] Allow users/admins to switch templates without editing raw configuration.
- [ ] Show selected-template state clearly.
- [ ] Add full-screen preview before applying/publishing a template change.
- [ ] Preview representative states: before prayer, near Athan, between Athan and Iqamah, Iqamah now, Jumu'ah day and Ramadan where applicable.
- [ ] Preview English and Arabic/RTL before a template can be marked visually complete.
- [ ] Allow show/hide configuration for optional modules: Jumu'ah, sunrise/sunset, Gregorian date, Hijri date, weather and announcements.
- [ ] Allow compact versus detailed timetable density where the template supports it.
- [ ] Allow landscape/portrait orientation selection only when the selected template has a validated variant.
- [ ] Prevent invalid combinations that would hide or overlap essential prayer information.

---

## 23.10 Managed display assignment

- [ ] Allow an administrator to assign a prayer-board template to each managed display.
- [ ] Allow a default mosque template with per-display override.
- [ ] Store template identifier and configuration in revisioned managed-display configuration.
- [ ] Preview the exact target resolution/orientation before publication.
- [ ] Show last-applied template/configuration revision for each display.
- [ ] Cache the last-known-good template configuration on the display.
- [ ] Ensure a display remains functional if remote theme/media synchronization fails.
- [ ] Reconcile configuration after reconnect without interrupting local prayer calculation.

---

## 23.11 Optional weather module

- [ ] Treat weather as an optional module, disabled unless explicitly configured.
- [ ] Document the network/privacy implications of any weather provider.
- [ ] Do not transmit precise device location merely to decorate the prayer board without explicit configuration.
- [ ] Cache/fail-soft so weather failure never affects prayer information.
- [ ] Hide stale/failed weather cleanly rather than showing broken placeholders.

---

## 23.12 Announcements and display rotation

- [ ] Support a restrained announcement ticker/card region where compatible with the selected prayer-board template.
- [ ] Ensure urgent/prayer-state information takes priority over decorative/community content.
- [ ] Allow administrators to disable announcement rotation for prayer-board-only displays.
- [ ] Integrate with existing signage scene/playlist scheduling rather than creating a second conflicting scheduler.
- [ ] Define safe transitions that respect reduced-motion and long-running kiosk use.

---

# Stage 24 — Managed-masjid admin UX redesign

## 24.1 Admin shell

- [ ] Build a dedicated admin shell with persistent navigation on desktop/tablet and appropriate compact navigation on narrow screens.
- [ ] Provide page titles, breadcrumbs/context and clear primary actions.
- [ ] Remove display credentials, fleet controls and publication tools from congregation-facing pages.
- [ ] Keep dangerous/destructive actions visually distinct and confirmation-gated.

## 24.2 Admin overview dashboard

- [ ] Show today's published prayer/Iqamah status.
- [ ] Show draft versus published timetable state.
- [ ] Show upcoming Jumu'ah/Ramadan overrides.
- [ ] Show display online/stale/offline state.
- [ ] Show upcoming announcements/events and signage schedule.
- [ ] Surface failed synchronization/configuration issues without making the dashboard noisy.
- [ ] Make common daily tasks reachable in very few interactions.

## 24.3 Display theme management

- [ ] Add display-theme gallery inside the admin console.
- [ ] Add branding/background configuration with live preview.
- [ ] Add per-display assignment and bulk assignment flows.
- [ ] Add publish/rollback workflow for template configuration revisions.
- [ ] Prevent unsupported template/orientation/resolution combinations.

---

# Stage 25 — Device-specific UX refinement

## 25.1 Phone

- [ ] Validate 320px minimum width through modern large-phone widths.
- [ ] Keep primary bottom navigation fixed without obscuring content or safe-area regions.
- [ ] Ensure prayer timetable can be scanned without excessive card stacking.
- [ ] Ensure all common actions meet touch-target requirements.
- [ ] Validate enlarged text and long translations.

## 25.2 Tablet and desktop

- [ ] Use space to improve hierarchy, not simply stretch phone layouts.
- [ ] Use two-column layouts where they reduce scrolling and preserve reading order.
- [ ] Keep line lengths controlled.
- [ ] Avoid oversized empty navigation rails or excessive unused whitespace.

## 25.3 Raspberry Pi Touch Display 2

- [ ] Create close-range touch layouts distinct from television viewing-distance layouts.
- [ ] Validate 5-inch, 7-inch and 10-inch fixture profiles where currently supported by the test harness.
- [ ] Preserve recovery/admin escape affordances without cluttering normal display mode.

## 25.4 TV/kiosk

- [ ] Validate all six required prayer-board templates at 1920x1080.
- [ ] Validate all six required prayer-board templates at 3840x2160.
- [ ] Validate long-distance readability for clock, prayer names, Athan/start times and Iqamah/Jama'ah.
- [ ] Validate overscan/safe-region assumptions where relevant.
- [ ] Preserve burn-in mitigation without causing layout instability.
- [ ] Ensure remote/keyboard recovery controls remain available to administrators.

---

# Stage 26 — Accessibility, RTL and visual acceptance

## 26.1 Accessibility

- [ ] Meet WCAG AA contrast for core application and prayer-board text.
- [ ] Ensure current/next prayer state is not communicated only by colour.
- [ ] Preserve visible keyboard focus.
- [ ] Preserve semantic heading and landmark structure.
- [ ] Validate screen-reader labels for prayer names, times, countdown and navigation.
- [ ] Respect reduced-motion preferences.
- [ ] Preserve forced-colours/high-contrast operation on interactive application surfaces.

## 26.2 Arabic/RTL and internationalisation

- [ ] Review every redesigned congregation destination in Arabic/RTL.
- [ ] Review every required prayer-board template in Arabic/RTL.
- [ ] Avoid Latin-only letter spacing, uppercase and punctuation assumptions in RTL layouts.
- [ ] Isolate mixed-direction numbers, URLs, coordinates and administrator identifiers safely.
- [ ] Validate Turkish and Indonesian text expansion on major redesigned screens.

## 26.3 Visual acceptance matrix

- [ ] Add screenshot coverage for phone English light.
- [ ] Add screenshot coverage for phone English dark.
- [ ] Add screenshot coverage for phone Arabic/RTL.
- [ ] Add screenshot coverage for tablet English light/dark as appropriate.
- [ ] Add screenshot coverage for tablet Arabic/RTL.
- [ ] Add screenshot coverage for desktop congregation destinations.
- [ ] Add screenshot coverage for admin shell/pages.
- [ ] Add screenshot coverage for all six prayer-board templates at 1080p.
- [ ] Add representative 4K geometry/readability coverage for all six prayer-board templates.
- [ ] Add Touch Display portrait and landscape coverage.
- [ ] Define golden-state fixtures for next prayer, current prayer, unavailable event, Jumu'ah and Ramadan where relevant.
- [ ] Add human visual review as a required major-UI acceptance step in addition to overflow/clipping automation.

### Human review criteria

- [ ] A first-time user can identify the next prayer immediately.
- [ ] Athan/start and Iqamah/Jama'ah are never visually ambiguous.
- [ ] The ordinary congregation view contains no unnecessary administrator controls.
- [ ] Navigation labels and destinations match user expectations.
- [ ] Whitespace and hierarchy remain balanced rather than merely sparse.
- [ ] Light and dark themes both look intentionally designed.
- [ ] Arabic/RTL layouts look composed rather than mechanically mirrored.
- [ ] Prayer-board themes remain readable from expected viewing distance.
- [ ] Custom imagery never reduces core prayer readability.
- [ ] No template appears to be a direct visual copy of a third-party product.

---

# Stage 27 — Legacy UI retirement and migration completion

- [ ] Remove obsolete single-page destination-hiding logic after real screen navigation is complete.
- [ ] Remove legacy CSS overrides superseded by Design System v2.
- [ ] Remove unused visual tokens and compatibility aliases only after all consumers have migrated.
- [ ] Remove duplicated feature-panel framing styles.
- [ ] Ensure no congregation workflow still depends on administrator-only components being mounted in the same page tree.
- [ ] Run full prayer-domain, notification, offline, managed-masjid, visual, Android and iOS regression suites after the migration.
- [ ] Update `docs/DESIGN_SYSTEM.md` to describe the v2 architecture and component rules.
- [ ] Update platform documentation/screenshots to the new navigation and prayer-board templates.
- [ ] Mark UI/UX v2 complete only after implementation, automated regression coverage and human visual acceptance are all complete.

---

## Recommended implementation order

1. Stage 22.1 product-surface separation and navigation architecture.
2. Stage 22.2 Design System v2 consolidation.
3. Stage 22.3 Today redesign and Stage 22.4 dedicated Qiblah screen.
4. Stage 22.5 Mosques/Community and Stage 22.6 Settings restructuring.
5. Stage 23 shared prayer-board template engine and the six required designs.
6. Stage 23 preview/configuration and managed-display assignment.
7. Stage 24 admin console redesign.
8. Stage 25 device-specific refinement.
9. Stage 26 accessibility, RTL, visual-regression and human acceptance.
10. Stage 27 legacy UI retirement and documentation reconciliation.

## Completion boundary

This plan must not be marked complete merely because the new layouts render. Completion requires that:

- all required destinations are usable and appropriately separated;
- the six required prayer-board designs are selectable and independently usable;
- the template engine preserves authoritative prayer data and offline behaviour;
- congregation and admin experiences no longer appear as one long feature stack;
- responsive and RTL acceptance matrices pass;
- existing domain/security/release quality gates remain green;
- human visual review confirms the application is modern, neat, readable and coherent across supported surfaces.
