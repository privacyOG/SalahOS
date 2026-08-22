# SalahOS UI/UX correction and enhancement tracker

This tracker records the post-v1.2.1 UI/UX corrections requested after Android device testing. It supplements `TODO.md` and `docs/UI_UX_V2_PLAN.md` and is authoritative for the correction pass until the items are reconciled back into the main trackers.

## Status convention

- [ ] Not started
- [~] In progress — implemented or partially implemented, but not yet accepted
- [x] Completed and verified
- [!] Blocked — reason must be recorded

An item must not be marked complete until the exact code head passes the applicable Quality Gate, Android Build, iOS Build and Visual Regression checks, with human review for material visual changes.

## A. Mobile prayer-times theme persistence and live application

- [x] Persist the selected prayer-board theme in native application storage on Android and iOS.
- [x] Migrate an existing WebView/localStorage theme selection into native Preferences without overwriting newer native data.
- [x] Make the congregation Today/home prayer-times page consume the selected prayer-board template instead of ignoring it.
- [x] Refresh the Today presentation when the selected template changes or the app resumes.
- [x] Verify the selected theme survives Android app restart.
- [x] Verify the selected theme survives iOS app restart/relaunch.
- [x] Separate Phone/Home, TV/Kiosk and Touch Display targets where independent choices are required; never silently overwrite another target.

## B. Premium Islamic mobile prayer themes

- [x] Provide a phone/tablet Heritage Classic treatment with navy, cream, gold and restrained Islamic geometric detail.
- [x] Provide a Minimal Modern phone/tablet treatment with deliberately clean architectural hierarchy.
- [x] Provide a Bold Countdown Focus phone/tablet treatment with a dramatic next-prayer/countdown hero.
- [x] Provide a Structured Split Board phone/tablet treatment with strong Start/Athan versus Iqamah columns.
- [x] Provide a Scenic Spiritual phone/tablet treatment using first-party SalahOS mosque artwork and readability scrims.
- [x] Provide a Family & Classroom phone/tablet treatment with bright but dignified educational colour cues.
- [x] Add portrait and compact landscape adaptations where the information hierarchy remains usable.
- [x] Add a tablet-specific Structured Split composition rather than simply stretching the phone layout.
- [x] Make Settings > Display Themes a first-class phone/tablet visual selector rather than describing it as managed-display-only.
- [x] Add representative phone previews before apply, including English and Arabic/RTL.
- [x] Validate 320px minimum width, representative 390–430px phones, large phones and tablets.
- [x] Validate English, Arabic/RTL, Turkish and Indonesian expansion and long mosque names.
- [x] Add permanent screenshot coverage for every released mobile-home theme.
- [x] Human-review every released mobile-home theme for prayer hierarchy, Start/Iqamah clarity, density, originality and navigation usability.

## C. Qibla compass correction and enhancement

- [x] Make the compass dial visibly show degree numbers rather than appearing blank.
- [x] Show clear 5° ticks with stronger 10° and 30° hierarchy.
- [x] Show N/E/S/W and NE/SE/SW/NW direction labels.
- [x] Add a fixed heading index so the current device direction is easy to read.
- [x] Add a distinct Qibla bearing arrow and Kaaba target marker separate from the north/device needle.
- [x] Validate phone portrait, phone landscape, tablet and Arabic/RTL compass presentation on-device/visual harness.

## D. Qibla map upgrade

- [x] Add supported Google Maps satellite imagery for the Qibla map when `VITE_GOOGLE_MAPS_API_KEY` is configured.
- [x] Keep OpenStreetMap only as a functional fallback when Google Maps is not configured.
- [x] Remove the privacy-consent gate that prevented the map from loading by default.
- [x] Preserve zoom, dropped-pin location selection, Qibla bearing overlay, current-location marker and Kaaba context over either provider.
- [x] Document Google Maps API-key setup and required Google Cloud key restrictions.
- [x] Add deterministic tests/visual fixtures for Google-satellite and fallback-provider modes without committing credentials.

## E. Product-direction correction

- [x] Remove privacy-first language from UI where it is presented as a primary SalahOS product objective.
- [x] Change remote-network policy wording from “local-first” to explicit reviewed network capabilities.
- [x] Remove or revise privacy-first claims in `README.md`, `TODO.md`, design/research documentation and UI/UX plans where they conflict with the current product direction.
- [x] Keep ordinary security, credential handling and user-permission requirements even though privacy-first positioning is no longer a project objective.

## Current correction evidence

- The dedicated Phone/Home prayer-board configuration uses its own `salahos.mobilePrayerBoardDisplayConfig` storage key and does not overwrite the TV/kiosk prayer-board configuration.
- Legacy shared prayer-board configuration is copied into Phone/Home only once during application-storage initialization; when no legacy selection exists, a dedicated Heritage Classic Phone/Home default is seeded. The mobile runtime no longer reads or listens to later TV/Kiosk configuration changes.
- The real congregation Today route is wrapped by `MobilePrayerThemeSurface` and refreshes on Phone/Home theme-change, focus and foreground visibility events.
- The real congregation `Settings > Display Themes` DOM now receives the Phone/Home visual selector while the existing managed-display target remains separately reachable.
- The permanent mobile visual harness covers all six released Phone/Home theme IDs, includes a 320px minimum-width case, exercises preview-before-apply through the congregation Settings route and verifies five obligatory prayer rows separately from Sunrise.
- The normal visual build verifies the no-key OpenStreetMap Qiblah fallback. A second visual-only build injects a fixed non-production key and verifies Google satellite request/provider semantics without committing a credential.
- `docs/QIBLA_GOOGLE_MAPS.md` records build-time configuration, restriction expectations and the client-visible key boundary.
- `README.md` now describes SalahOS in terms of prayer accuracy, platform capability, explicit networking and offline resilience rather than privacy-first positioning.

## Accepted correction evidence (2026-08-23)

- Code-bearing head `17ba7535282144ffc64b525f7dc24cdc1745843b` passed Quality Gate `32597468392`, Android Build `32597468390`, Visual Regression `32597468393` and iOS Build `32597468388`.
- Android emulator job `97090593534` verified the exact dedicated Phone/Home native preference after offline cold start and process relaunch; the connected Android test then passed.
- iOS job `97090593496` verified exact Phone/Home native preference values on fresh iPhone and iPad Simulators across launch and relaunch. Evidence artifact `9482112123` records `mobile_theme_launch=passed` and `mobile_theme_relaunch=passed` for both profiles.
- Visual artifact `9481966738` passed the complete responsive/RTL/long-text/mobile-theme/Qibla matrix. Human review accepted every released Phone/Home design and specifically confirmed the corrected Bold compact-landscape hierarchy, Structured Split tablet hierarchy, unobstructed Settings preview controls, separated Sunrise/Sunset preview cards, intact five-item phone navigation at 320px and ordinary phone widths, and Arabic/RTL, Turkish and Indonesian expansion.
- Qibla human review accepted phone portrait, compact landscape, tablet and Arabic/RTL compass presentation; the normal build preserved OpenStreetMap fallback and the deterministic configured-key fixture recorded Google provider `google-satellite`, host `maps.googleapis.com` and `maptype=satellite` without committing a credential.
- Active product-direction language in README, architecture/research material, this correction tracker, `TODO.md` and the UI/UX v2 plan now treats networking as an explicit reviewed capability while retaining ordinary permission, credential, data-handling and offline-reliability requirements.

## Completion gate

This correction pass is complete only when all applicable items above are `[x]`, the exact final PR head is green in Quality Gate, Android Build, Visual Regression and iOS Build, the Android/iOS persistence path has acceptance evidence, and the new prayer/home and Qibla visuals have received human review.
