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
- Existing local prayer calculation and offline operation must remain functional throughout the migration.
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
- [x] Place Announcements and Events inside Community using clear secondary navigation/tabs rather than expanding phone primary navigation beyond five destinations.

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

- [x] Consolidate semantic colour, spacing, typography, radius, border, elevation and motion tokens into one authoritative layer.
- [x] Remove overlapping global overrides where multiple stylesheets redefine the same shell, hero, spacing or responsive rules.
- [x] Define an 8px-oriented spacing rhythm with documented exceptions for compact display layouts.
- [x] Define consistent content-width, page-gutter and section-spacing rules.
- [x] Define typography roles for display clock, countdown, prayer name, prayer time, Iqamah, section heading, body, metadata and captions.
- [x] Ensure prayer times and countdowns use tabular numerals where appropriate.
- [x] Define consistent button variants: primary, secondary, quiet, destructive and icon-only.
- [x] Define consistent form-field, segmented-control, tabs, switch, banner, dialog, sheet, popover, tooltip and menu patterns.
- [x] Define reusable prayer-row, next-prayer, mosque-summary, announcement-preview and status components.
- [x] Define a coherent icon family for Today, Mosques, Qiblah, Community, Settings, prayer, Iqamah, location, display and administration concepts.
- [x] Reduce unnecessary borders, nested cards and shadows.
- [x] Preserve high-contrast, forced-colours and reduced-motion support.
- [x] Add explicit skeleton/loading, offline, stale, sync-pending, sync-error, permission-denied and empty states.
- [x] Document light and dark visual rules rather than relying on simple colour inversion.

**Stage 22.2 verification note (2026-08-21):** PR #174 code-bearing head `f0fd43594313b37a1a9882e595d764c75ef12eb7` passed Quality Gate `32453061013`, Android Build `32453061003` and Visual Regression `32453060967`; the deterministic Xcode Simulator compile gate in iOS Build `32453060996` also passed before its separately bounded, non-blocking hosted-Simulator runtime acceptance completed. `src/design-system.css` is the sole semantic `--salah-*` token owner; `src/design-system-primitives.css` and `src/ui/DesignSurface.tsx` define reusable layout, typography, control, state and product primitives; `src/ui/SalahIcon.tsx` provides the ten-concept icon family; duplicated global prayer/status/brand selectors were retired from `src/styles.css`; and the Quality Gate enforces token/selector ownership plus required primitive contracts. `docs/DESIGN_SYSTEM.md` documents the spacing rhythm and page geometry, typography roles and tabular numerals, control patterns, explicit loading/offline/stale/sync/permission/empty states, light/dark visual rules and accessibility requirements. The permanent Visual Regression matrix passed on the same code-bearing head.

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
- [x] Surface Ramadan/Suhur/Imsak/Iftar/Taraweeh context only when relevant rather than permanently increasing daily density.
- [x] Add at most a small number of useful quick actions below prayer information, such as Qiblah, Mosque and Notifications.
- [x] Add optional announcement/event preview beneath core prayer information without allowing community content to dominate the prayer view.
- [x] Design polished states for no location, no selected mosque, offline managed data, stale managed data and unavailable astronomical events.

**Stage 22.3 verification note (2026-08-21):** PR #173 code-bearing head `bd43257df4d6be16ed6ca9943c34b3285975b08b` passed Quality Gate `32444858881`, Android Build `32444858804`, Visual Regression `32444858884` and iOS Build `32444858880`, including fresh iPhone/iPad Simulator install, launch and relaunch acceptance. Today keeps prayer information authoritative while adding conditional Ramadan Imsak/Suhur/Iftar and local-mosque Taraweeh context, a compact selected-mosque announcement/event preview, and explicit no-selected-mosque, missing/stale timetable, offline-managed and astronomical-unavailable states. The focused English-phone community, English-phone Ramadan/Taraweeh and Arabic/RTL-tablet stale-timetable screenshots received human review; the permanent visual suite also passed on the exact code-bearing head.

---

## 22.4 Dedicated Qiblah experience

- [x] Move the Qiblah Finder out of the long stacked home flow into its own primary congregation destination.
- [x] Give the live compass/bearing a dedicated full-screen hierarchy.
- [x] Present current location and bearing clearly above/beside the compass depending on device size.
- [x] Keep calibration, sensor quality, true-north/magnetic-declination and alignment guidance understandable but visually subordinate.
- [x] Put city search, saved-location selection and map-pin workflows in secondary sheets/panels rather than always-visible large forms.
- [x] Preserve offline bearing calculation and explicit network gating for optional map imagery.
- [x] Validate portrait phone, landscape phone, tablet and desktop layouts independently.

---

## 22.5 Mosques and Community screens

### Mosques

- [x] Create a dedicated mosque discovery/favourites screen.
- [x] Separate followed mosques from location/GPS settings.
- [x] Present mosque prayer/Iqamah freshness and provenance clearly.
- [x] Create a polished mosque profile screen with today's prayer times, Jumu'ah, next prayer, announcements, events and contact/facility information.
- [x] Keep nearby search privacy-gated and explicit.

### Community

- [x] Create a dedicated Community destination.
- [x] Add Announcements and Events as clear secondary tabs/views.
- [x] Remove community administration/import controls from the normal congregation reading experience.
- [x] Use compact preview cards with clear hierarchy, expiry/status and optional call-to-action.
- [x] Provide useful empty states when no managed content exists.

**Stage 22.5 verification note (2026-08-21):** PR #170 code-bearing head `9446b32fb34e66cf9de7fd94855b88f0f746693a` passed Quality Gate `32435976858`, Android Build `32435976877`, Visual Regression `32435976891` and iOS Build `32435976879`. The congregation Mosques destination now provides followed-mosque discovery, explicit local-only nearby sorting from already-saved coordinates, prayer/Iqamah provenance and freshness, and a focused mosque profile with prayer, Jumu'ah, community and facility/contact context. Community now provides reader-only Announcements and Events tabs with compact status/expiry/source metadata, calls to action and useful empty states; administration/import controls remain outside the congregation reading surface. Populated English phone and Arabic/RTL tablet Stage 22.5 screenshots were reviewed manually, while the permanent visual matrix independently passed on the exact code-bearing head.

---

## 22.6 Settings restructuring and progressive disclosure

- [x] Replace the current large settings form with category-based navigation.
- [x] Create Prayer Settings category.
- [x] Create Location category.
- [x] Create Mosque & Iqamah category.
- [x] Create Notifications & Adhan category.
- [x] Create Appearance & Language category.
- [x] Create Data & Privacy category.
- [x] Create Display Themes category where applicable.
- [x] Create Advanced category for import/export, raw coordinates and uncommon calculation controls.
- [x] Move manual mosque timetable authoring/import into appropriate administration/advanced workflows instead of presenting it as normal daily-use configuration.
- [x] Use explanatory copy only where needed; do not turn settings into dense documentation pages.

**Stage 22.6 verification note (2026-08-21):** PR #171 code-bearing head `eba6340cfe22a21f7f112921156c6620a40cf1ac` passed Quality Gate `32440308947`, Android Build `32440308898`, Visual Regression `32440309003` and iOS Build `32440308865`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Settings retains eight reloadable categories while ordinary Mosque & Iqamah is limited to timetable selection/use plus existing seasonal configuration; manual timetable day authoring, CSV/JSON timetable import and prayer offsets are progressively disclosed under Advanced. Notifications & Adhan and Data & Privacy retain ownership of their focused controls, duplicated Display Themes explanatory text and stale mosque-import guidance were removed, and the exact visual run passed all 28 scenarios without horizontal-overflow offenders. English phone Mosque settings and Arabic/RTL tablet Advanced settings also received human visual review. Full retirement of the scoped legacy configuration core remains a Stage 27 migration task rather than a Stage 22.6 completion requirement.

---

# Stage 23 — Daily Prayer Display Theme Library

## 23.1 Shared prayer-board template engine

- [x] Define one shared display data contract for all prayer-board templates.
- [x] Define reusable slots/modules for current time, dates, next prayer, countdown, prayer timetable, Jumu'ah, sunrise/sunset, mosque branding, announcements and optional weather.
- [x] Create a template registry with stable template identifiers and versioned configuration.
- [x] Ensure template choice never changes prayer calculations or prayer-source semantics.
- [x] Allow per-template module visibility without allowing required prayer information to become ambiguous.
- [x] Support 12-hour and 24-hour clock presentation.
- [x] Support English, Arabic/RTL, Turkish and Indonesian.
- [x] Support bilingual English/Arabic display mode where layout space permits.
- [x] Support mosque name and validated logo branding.
- [x] Support controlled accent-colour presets.
- [x] Support approved custom background images with crop/focal-point controls.
- [x] Enforce contrast overlays/scrims automatically when background imagery reduces readability.
- [x] Provide sensible built-in artwork/pattern fallbacks so custom images are optional.
- [x] Keep external/remote content isolated from the authoritative local prayer board.
- [x] Keep all templates deterministic and usable when offline.

**Stage 23.1 verification note (2026-08-21):** PR #175 code-bearing head `d154cf035e13282bfdc46e78ec7a7fa455914b0c` passed Quality Gate `32460157253`, Android Build `32460157312`, Visual Regression `32460157295` and iOS Build `32460157409`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. `src/domain/prayerBoardTemplate.ts` now defines the versioned six-template registry, required/optional module policy, four-locale and English/Arabic bilingual presentation capabilities, 12/24-hour and controlled-accent configuration, validated mosque branding/local-image metadata with focal-point/cover/automatic-scrim contracts, and deterministic built-in artwork fallbacks. `buildPrayerBoardData()` consumes only the already-resolved `SourcedPrayerDashboard`; template selection is deliberately absent from that builder, so visual choice cannot alter prayer calculations, selected source semantics, Iqamah values or next-prayer state. Optional announcement/weather inputs remain isolated and fail-soft, local asset IDs reject remote-looking values, and the focused domain suite verifies registry stability, core-module safety, configuration normalization, presentation isolation and weather independence. The six visual template implementations and later preview/assignment UX remain open as separate Stage 23 work.

## 23.2 Template 1 — Heritage Classic

- [x] Implement an original SalahOS Heritage Classic design.
- [x] Use refined Islamic geometric/pattern styling and optional mosque/calligraphy imagery without copying third-party artwork.
- [x] Use a strong Athan/Iqamah timetable region and a separate clock/next-prayer region.
- [x] Include compact Jumu'ah and sunrise/sunset modules.
- [x] Support dark, jewel-toned and neutral preset variants while preserving high contrast.
- [x] Validate long mosque names and Arabic calligraphic/RTL-adjacent content without collisions.

**Stage 23.2 verification note (2026-08-21):** PR #176 code-bearing head `2f9535a059937bbd0ed06f8c2953e3c964f14255` passed Quality Gate `32471878090`, Android Build `32471878101`, Visual Regression `32471878106` and iOS Build `32471878114`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Heritage Classic renders only from the shared `PrayerBoardData` presentation contract, so template selection does not recalculate prayers or change selected source, Iqamah or next-prayer semantics. The original SalahOS composition uses a geometric heritage field with classic, emerald, midnight and sandstone variants, a distinct current-clock/next-prayer hero, an explicit Athan/start-versus-Iqamah timetable, compact Jumu'ah and sunrise/sunset modules, current/next state labels and preserved offline state. The permanent focused visual harness passed English and Arabic/RTL at 1920×1080 and 3840×2160, including deliberately long mosque names, exact five-row assertions, no horizontal clipping and full-board viewport-fit checks; a dedicated 1080p density profile preserves all modules while leaving 4K geometry unchanged. Human review of the successful 1080p and 4K evidence confirmed immediate next-prayer hierarchy, unambiguous Athan/Iqamah presentation, balanced density and composed Arabic/RTL layout. Later templates, preview/assignment UX and Stage 23.13 mobile variants remain open.

## 23.3 Template 2 — Minimal Modern

- [x] Implement an original SalahOS Minimal Modern design.
- [x] Use a calm neutral canvas, large clock, restrained cards and strong typography.
- [x] Present prayer times in a clean lower strip/grid.
- [x] Use a compact next-prayer/countdown component that remains obvious from viewing distance.
- [x] Provide light and dark variants.
- [x] Avoid unnecessary ornamentation and visual noise.

**Stage 23.3 verification note (2026-08-21):** PR #177 code-bearing head `f20d73f6b3d76d371205508f43e930b50ea1ed84` passed Quality Gate `32478598067`, Android Build `32478597925`, Visual Regression `32478597889` and iOS Build `32478598033`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Minimal Modern renders only from the shared `PrayerBoardData` presentation contract and does not recalculate prayers or change selected source, Iqamah, notification or next-prayer semantics. Its original SalahOS composition uses a calm neutral canvas with intentional light/dark variants, a large current clock, compact next-prayer/countdown hero, a five-prayer Athan/start-versus-Iqamah strip, restrained Jumu'ah and sunrise/sunset modules, explicit non-colour-only current/next state labels and preserved offline presentation. The permanent focused visual harness passed English and Arabic/RTL at 1920×1080 and 3840×2160, including deliberately long mosque names, exact five-prayer assertions, no horizontal clipping and full-board viewport-fit checks. Human review of the final evidence confirmed balanced full-height density at both resolutions, immediate next-prayer hierarchy, unambiguous Athan/Iqamah presentation and composed RTL layout. Later templates, preview/assignment UX and Stage 23.13 mobile variants remain open.

## 23.4 Template 3 — Bold Countdown Focus

- [x] Implement an original SalahOS Bold Countdown Focus design.
- [x] Make current time and next-prayer countdown the dominant display elements.
- [x] Keep today's full timetable visible as a secondary band.
- [x] Provide strong current/next state transitions that do not depend on animation.
- [x] Support optional pre-Iqamah and Iqamah-now states.
- [x] Prioritize long-distance readability over decorative content.

**Stage 23.4 verification note (2026-08-21):** PR #178 code-bearing head `0de2c0123010cc05a261a4229040bc54416a25ca` passed Quality Gate `32485632660`, Android Build `32485632576`, Visual Regression `32485632537` and iOS Build `32485632581`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Bold Countdown Focus renders only from the shared `PrayerBoardData` presentation contract. It does not recalculate prayers or change selected source, Iqamah, notification or next-prayer semantics. The original SalahOS composition makes current time and the active countdown the dominant long-distance elements while retaining the complete five-prayer Start/Athan-versus-Iqamah timetable as a secondary band. Static labels, borders and inversion distinguish current, next, pre-Iqamah and Iqamah-now states without depending on animation. The permanent focused visual harness passed English and Arabic/RTL at 1920×1080 and 3840×2160, including deliberately long mosque names, exact five-prayer assertions, at least 90% viewport-height use, minimum countdown-size checks and zero horizontal clipping. Human review of the final evidence confirmed full-height density, immediate countdown hierarchy, clear state transitions, composed RTL and an unwrapped 4K prayer label. Later templates, preview/assignment UX and Stage 23.13 mobile variants remain open.

## 23.5 Template 4 — Structured Split Board

- [x] Implement an original SalahOS Structured Split Board design.
- [x] Use a precise Athan/start versus Iqamah/Jama'ah column layout.
- [x] Use a separate clock/date/next-prayer column or region.
- [x] Provide dedicated compact areas for multiple Jumu'ah sessions and sunrise/sunset.
- [x] Optimize for mosques and schools that prioritise information density and precision.
- [x] Maintain clean alignment at both 1080p and 4K without looking like a spreadsheet.

**Stage 23.5 verification note (2026-08-21):** PR #179 code-bearing head `13ad0a56597bc37fc955a942f4db3d7f6c8a4bd1` passed Quality Gate `32489547751`, Android Build `32489547621`, Visual Regression `32489547618` and iOS Build `32489547663`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Structured Split Board renders only from the shared `PrayerBoardData` presentation contract and does not recalculate prayers or change selected source, Iqamah, notification or next-prayer semantics. Its original SalahOS composition uses a distinct timetable region with precisely aligned Start/Athan and Iqamah/Jama'ah columns plus a separate clock/date/next-prayer rail, while multiple Jumu'ah sessions and sunrise/sunset remain compact. The permanent focused visual harness passed English and Arabic/RTL at 1920×1080 and 3840×2160, including deliberately long mosque names, exact five-prayer assertions, split-region separation, Start/Iqamah column-alignment checks, at least 90% viewport-height use and zero horizontal clipping. Human review of the exact screenshots confirmed high information density without a spreadsheet-like appearance, clear current/next states, composed RTL presentation and crisp alignment at both resolutions. Later templates, preview/assignment UX and Stage 23.13 mobile variants remain open.

## 23.6 Template 5 — Scenic Spiritual

- [x] Implement an original SalahOS Scenic Spiritual design.
- [x] Support full-bleed mosque, landscape or architectural backgrounds.
- [x] Use adaptive overlays/gradients to guarantee prayer-text contrast.
- [x] Present clock, next prayer and timetable in restrained translucent/solid readable regions.
- [x] Provide built-in scenic imagery or abstract SalahOS artwork that is licensed/owned for distribution.
- [x] Ensure the template remains useful with imagery disabled.

**Stage 23.6 verification note (2026-08-22):** PR #180 code-bearing head `5084a6086aa39f2481b5ac2fcb38759d2faa262b` passed Quality Gate `32500835938`, Android Build `32500835956`, Visual Regression `32500835923` and iOS Build `32500835937`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Scenic Spiritual is presentation-only over the shared `PrayerBoardData` contract and does not recalculate prayer times or alter selected source, Iqamah, notification or next-prayer semantics. The template uses original first-party SalahOS SVG landscape/mosque artwork with full-bleed `cover` presentation, layered contrast scrims and readable clock/next-prayer/timetable surfaces; artwork-disabled mode retains the complete board on a deterministic local gradient field with no remote image dependency. The permanent focused visual matrix passed English and Arabic/RTL at 1920×1080 and 3840×2160, including artwork-on/off, long mosque names, exact five-prayer rendering, local-only request enforcement, viewport containment and zero horizontal clipping. Human review of exact Visual artifact `9453619560` confirmed readable long-distance hierarchy, composed RTL, balanced plain fallbacks and artwork that remains visibly scenic without reducing prayer readability. Stage 23.7, preview/assignment UX and Stage 23.13 mobile variants remain open.

## 23.7 Template 6 — Family & Classroom

- [x] Implement an original SalahOS Family & Classroom design.
- [x] Use bright but dignified colours, large labels and approachable iconography.
- [x] Make prayer names, Athan and Iqamah especially easy to learn and distinguish.
- [x] Support optional daylight/sunrise/sunset cues.
- [x] Support optional simplified educational hints without adding them to mosque signage by default.
- [x] Keep the design appropriate for homes, Islamic schools and children's learning spaces without becoming toy-like.

**Stage 23.7 verification note (2026-08-22):** PR #181 code-bearing head `e74dcdb4b3a72b88afad72fa4024b6f6dad258bc` passed Quality Gate `32509234593`, Android Build `32509234580`, Visual Regression `32509234659` and iOS Build `32509234581`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Family & Classroom renders only from the shared `PrayerBoardData` presentation contract and does not recalculate prayers or alter selected source, Iqamah, notification or next-prayer semantics. Its original SalahOS composition uses bright but restrained high-contrast surfaces, large numbered prayer rows and first-party line iconography; Start/Athan and Iqamah are separate aligned learning columns and the next-prayer area repeats those distinctions. Educational explanations are opt-in and disabled by default for ordinary mosque signage, while sunrise/sunset daylight cues are independently optional. English, Arabic/RTL, Turkish and Indonesian teaching copy is included. The permanent 1920×1080 and 3840×2160 visual matrix covers long mosque names, hints/daylight toggles, exact five-prayer rendering, local-only requests and zero horizontal clipping; a dedicated 4K scale gate enforces long-distance minimum typography after human review caught and corrected an initially under-scaled 4K composition. Human review of exact Visual artifact `9456447558` confirmed the corrected 4K scale, composed English and Arabic/RTL layouts, clear Start/Iqamah hierarchy and no clipping. All six required display templates are now complete; preview/configuration/managed-display assignment and Stage 23.13 mobile variants remain open.

## 23.8 Optional future template — Ambient Minimal

- [ ] Research an ultra-minimal ambient prayer board for premium home/office displays after the six required templates are complete.

---

## 23.9 Prayer-board configuration and preview UX

- [x] Add a visual template gallery with thumbnail/live previews for all six required designs.
- [x] Allow users/admins to switch templates without editing raw configuration.
- [x] Show selected-template state clearly.
- [x] Add full-screen preview before applying/publishing a template change.
- [x] Preview representative states: before prayer, near Athan, between Athan and Iqamah, Iqamah now, Jumu'ah day and Ramadan where applicable.
- [x] Preview English and Arabic/RTL before a template can be marked visually complete.
- [x] Allow show/hide configuration for optional modules: Jumu'ah, sunrise/sunset, Gregorian date, Hijri date, weather and announcements.
- [x] Allow compact versus detailed timetable density where the template supports it.
- [x] Allow landscape/portrait orientation selection only when the selected template has a validated variant.
- [x] Prevent invalid combinations that would hide or overlap essential prayer information.

**Stage 23.9 verification note (2026-08-22):** PR #182 code-bearing head `54cae00d496167aa7dc4e3a3fcf15a7806ccf3e9` passed Quality Gate `32526337045`, Android Build `32526337051`, Visual Regression `32526337061` and iOS Build `32526337060`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. The admin Display Themes surface now provides a six-design visual gallery with an explicit selected state, presentation-only language/time/accent/mosque-name controls, mandatory core current-time/next-prayer/countdown/five-prayer-timetable modules, supported optional module visibility, and a full-screen preview that must be opened for the current draft before Apply is enabled. Representative fixtures cover before-prayer, near-Athan, Athan-to-Iqamah, Iqamah-now and Jumu'ah states; Ramadan is not fabricated because the current shared prayer-board contract carries no Ramadan-specific display state, with seasonal/mobile work remaining under Stage 23.13. English and Arabic/RTL full-screen previews exercise the real shared renderers. The Stage 23.1 contract intentionally exposes Gregorian and Hijri dates through one shared `dates` presentation module, so the UI shows/hides that combined date region rather than inventing divergent date semantics. No density or portrait choice is exposed where a template has no validated selectable variant; the editor states that landscape is the validated TV/kiosk orientation and therefore prevents unsupported combinations by omission. Applied configuration is versioned and persisted separately from prayer settings, and the smart-display runtime consumes it when no explicit fixture URL override is present while retaining backward-compatible query fixtures. Exact Visual artifact `9462330563` passed the gallery → preview → apply → smart-display browser flow, confirmed six gallery templates, applied `minimal-modern`, Arabic `family-classroom` RTL presentation and local-only requests; human review accepted the gallery, English preview/applied display and Arabic/RTL preview with clear prayer hierarchy and no visible clipping. Stage 23.10 managed-display assignment and Stage 23.13 mobile Today/home template variants remain open.

---

## 23.10 Managed display assignment

- [x] Allow an administrator to assign a prayer-board template to each managed display.
- [x] Allow a default mosque template with per-display override.
- [x] Store template identifier and configuration in revisioned managed-display configuration.
- [x] Preview the exact target resolution/orientation before publication.
- [x] Show last-applied template/configuration revision for each display.
- [x] Cache the last-known-good template configuration on the display.
- [x] Ensure a display remains functional if remote theme/media synchronization fails.
- [x] Reconcile configuration after reconnect without interrupting local prayer calculation.

**Stage 23.10 verification note (2026-08-22):** PR #183 code-bearing head `698ee83f877da52b7fad257206a10d76fc3d7aa5` passed Quality Gate `32539309579`, Android Build `32539310016`, Visual Regression `32539309804` and iOS Build `32539309740`. Managed administration now supports a revisioned full prayer-board configuration, mosque-wide defaults with explicit per-display overrides/inheritance, effective assignment-source reporting, exact landscape target validation for 1920×1080 and 3840×2160, preview-before-publication, and target-versus-last-applied revision/template visibility. Managed displays persist a validated last-known-good prayer-board configuration in native-hydrated storage, keep local prayer calculation authoritative while remote configuration/media is unavailable, and reconcile newer/equal/conflicting revisions after reconnect without interrupting the prayer engine. Legacy managed-service state migrates to safe Heritage Classic configuration and non-portable device-local media is normalized to deterministic built-in artwork. Exact Visual artifact `9466486375` was human-reviewed across the fleet assignment view, exact 1920×1080 preview, published override state, managed online display and offline-cache display; the corrected Family & Classroom Start/Iqamah layout showed no collision, the offline cache preserved mosque branding/template content, and unsupported portrait publication remained explicitly blocked. Stage 23.11 optional weather, Stage 23.12 announcement rotation and Stage 23.13 mobile Today/home template work remain separate and open.

---

## 23.11 Optional weather module

- [x] Treat weather as an optional module, disabled unless explicitly configured.
- [x] Document the network/privacy implications of any weather provider.
- [x] Do not transmit precise device location merely to decorate the prayer board without explicit configuration.
- [x] Cache/fail-soft so weather failure never affects prayer information.
- [x] Hide stale/failed weather cleanly rather than showing broken placeholders.

**Stage 23.11 verification note (2026-08-23):** PR #185 code-bearing head `53b9f04ee6f160eb9d71a7440e44a6d50f5744d5` passed Quality Gate `32604176420`, Android Build `32604176462`, Visual Regression `32604176399` and iOS Build `32604176432`. Weather remains disabled by default and requires both the target presentation module and a separately enabled fixed-location feed with explicit coordinates. The adapter never reads browser/native GPS or reuses the prayer-calculation location; the documented privacy boundary discloses that configured coordinates are sent to the reviewed Open-Meteo endpoint together with normal HTTPS request metadata. Successful snapshots are cached as last-known-good data for at most two hours; provider/network failure may reuse only a still-fresh cache and expired/unavailable weather renders nothing, so prayer calculation, source, Iqamah and next-prayer presentation remain independent. Exact Visual artifact `9483707774` (SHA-256 `5b6f00dab07141f6ddaa5c1199d413ac4c19f88c3add0a5718791fc48debc941`) received human review across TV/Kiosk ready, provider-failure/cache and expired-hidden states plus Phone/Home settings and ready rendering. The five obligatory prayer rows remained intact, weather never produced a broken placeholder, the mobile bottom navigation remained unobstructed and the fixed-location privacy controls/copy were readable. Stage 23.11 is complete.

---

## 23.12 Announcements and display rotation

- [x] Support a restrained announcement ticker/card region where compatible with the selected prayer-board template.
- [x] Ensure urgent/prayer-state information takes priority over decorative/community content.
- [x] Allow administrators to disable announcement rotation for prayer-board-only displays.
- [x] Integrate with existing signage scene/playlist scheduling rather than creating a second conflicting scheduler.
- [x] Define safe transitions that respect reduced-motion and long-running kiosk use.

**Stage 23.12 verification note (2026-08-23):** PR #187 code-bearing head `7e80667a8ebb1d4f1efb01c5236faf9876f7037a` passed Quality Gate `32609795622`, Android Build `32609795623`, Visual Regression `32609795645` and iOS Build `32609795632`, including Android lifecycle acceptance and fresh iPhone/iPad Simulator install, launch and relaunch acceptance. The implementation reuses the existing signage scene/playlist/schedule engine, filters only published display-targeted announcements for the configured mosque, preserves prayer information as authoritative, suppresses community content during the ten-minute pre-prayer guard and Athan-to-Iqamah window, supports a per-display Announcements module switch, and uses deterministic dwell selection with reduced-motion-safe presentation. Exact Visual artifact `9485197306` (`sha256:0556438217de9dd8c1ba173be6ec947b24fe46f3534f77dd85ba7d7464681d64`) received human review: English and Arabic/RTL active announcement boards retained all five prayer rows without obstruction, module-disabled mode remained clean, and the administrator rotation panel clearly exposed enablement, mosque, dwell and prayer-board-only guidance. Stage 23.12 is complete.

---

## 23.13 Mobile Today/home prayer-board templates

The phone Today/home experience must receive the same design quality and template choice as the dedicated display product, while remaining a native-feeling mobile application rather than shrinking a television layout. Masjidal/Athan+ and comparable prayer products may be used only as broad interaction and information-hierarchy references; SalahOS must use original layouts, artwork, assets and styling.

- [x] Make the mobile Today/home prayer-times surface consume the shared Stage 23 prayer-board data contract instead of creating a separate mobile prayer-presentation model.
- [x] Provide polished phone-adapted variants of all six required SalahOS prayer-board designs wherever their information hierarchy is suitable for mobile.
- [x] Keep the mobile home visually prayer-first: current date/time and selected location/mosque, dominant next-prayer/countdown region, and an immediately scannable daily Athan/start versus Iqamah timetable.
- [x] Highlight the current/next prayer clearly without depending on colour alone, using a treatment suitable for quick one-handed phone viewing.
- [x] Support compact Jumu'ah, Sunrise/Sunset, Gregorian/Hijri date and selected-mosque branding modules without allowing optional content to crowd the core prayer schedule.
- [x] Keep Ramadan/Suhur/Imsak/Iftar/Taraweeh context conditional so the ordinary home screen stays calm outside the relevant season/state.
- [x] Preserve the existing five-item bottom navigation on phone, with Today, Mosques, Qiblah, Community and Settings always reachable and Qiblah/Settings available in one tap from the home prayer view.
- [x] Ensure the bottom navigation respects Android/iOS safe areas, enlarged text, RTL ordering/alignment and modern gesture-navigation regions without obscuring prayer content.
- [x] Expand Settings > Display Themes into a visual design selector with thumbnail cards or tabs and an obvious selected state rather than a text-only/raw configuration control.
- [x] Separate theme targets in Settings where necessary (for example Phone/Home, TV/Kiosk and Touch Display) so choosing a phone design does not unintentionally change a mosque display; provide an explicit opt-in sync/apply-to-all action instead of implicit coupling.
- [x] Provide live or representative phone previews before applying a mobile home template, including English and Arabic/RTL states.
- [x] Allow the six required designs to expose appropriate light/dark, jewel/neutral and approved accent variants on mobile while keeping prayer-text contrast deterministic.
- [x] Keep template selection, colours, backgrounds and module visibility presentation-only; changing the mobile design must never change prayer calculations, selected prayer source, Iqamah values, notification schedules or next-prayer semantics.
- [x] Preserve fully usable offline mobile prayer display with built-in artwork/pattern fallbacks and no dependency on remote imagery or optional content.
- [x] Validate every released mobile-home template at 320px minimum width, representative 390–430px phones, portrait and supported landscape states, with no clipping or horizontal overflow.
- [x] Validate English, Arabic/RTL, Turkish and Indonesian text expansion; specifically test long mosque names, mixed-direction times/numbers and Arabic-adjacent branding without collisions.
- [x] Add permanent visual-regression screenshots for each released phone/home template in representative light/dark and English/Arabic states.
- [x] Perform human visual review of every released mobile-home template for prayer hierarchy, Athan/Iqamah clarity, bottom-navigation usability, density and originality before marking it complete.

**Stage 23.13 verification note (2026-08-23):** PR #186 code-bearing head `17ba7535282144ffc64b525f7dc24cdc1745843b` passed Quality Gate `32597468392`, Android Build `32597468390`, Visual Regression `32597468393` and iOS Build `32597468388`. The congregation Today route consumes shared `PrayerBoardData` v1 through six original Phone/Home template treatments with a dedicated native-persisted configuration key, target isolation from TV/Kiosk configuration, preview-before-apply Settings UX, required five-prayer information, configurable supported optional modules and offline built-in fallbacks. Permanent visual coverage spans 320px, representative phones, compact landscape, large phone, tablet, English, Arabic/RTL, Turkish and Indonesian; exact Visual artifact `9481966738` received human review after correcting sibling-collision, preview-stacking, solar-preview and navigation word-break defects. Android and iOS lifecycle evidence proves the selected Phone/Home configuration survives real emulator/Simulator relaunch boundaries. Stage 23.11 optional weather is completed separately by PR #185; Stage 23.12 announcement/display rotation is completed separately by PR #187.

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
5. Stage 23 shared prayer-board template engine, the six required designs and their validated mobile Today/home variants.
6. Stage 23 preview/configuration and managed-display assignment.
7. Stage 24 admin console redesign.
8. Stage 25 device-specific refinement.
9. Stage 26 accessibility, RTL, visual-regression and human acceptance.
10. Stage 27 legacy UI retirement and documentation reconciliation.

## Completion boundary

This plan must not be marked complete merely because the new layouts render. Completion requires that:

- all required destinations are usable and appropriately separated;
- the six required prayer-board designs are selectable and independently usable, including validated phone Today/home variants where applicable;
- the template engine preserves authoritative prayer data and offline behaviour;
- congregation and admin experiences no longer appear as one long feature stack;
- responsive and RTL acceptance matrices pass;
- existing domain/security/release quality gates remain green;
- human visual review confirms the application is modern, neat, readable and coherent across supported surfaces.
