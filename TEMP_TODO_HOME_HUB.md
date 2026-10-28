# SalahOS — Temporary development checklist: Home Prayer Hub

**Owner/developer:** PrivacyOG  
**Reviewed:** 2026-10-28 (Australia/Sydney)  
**Base:** `main` at `99e08c6e91ecece01b08028c392cf627f57ab9f8` (v1.6.2 prerelease, 2026-09-22)  
**Working branch:** `feature/home-hub-prayer-dashboard`  
**Rule:** Update this file as work is verified. A committed change is not a successful CI/physical-device test.

## Previously completed and retained

- [x] v1.6.2 prerelease exists; v1.6.0/1.6.2 editorial restrictions remain in force.
- [x] Offline prayer calculation, five daily prayers, sunrise, next-prayer countdown, method/Asr selections and source provenance.
- [x] Mosque timetable and Iqamah support in configured prayer-board mode.
- [x] Android/iOS/PWA/Raspberry Pi and kiosk architecture, with existing validation gates.
- [x] Six pre-existing prayer-board designs; mobile prayer-theme system.
- [x] Earlier decision retained: do not restore Iqamah to the ordinary Today screen.
- [x] Source includes PrivacyOG developer/author metadata; no additional developer is being credited.

## Home Prayer Hub — current branch

- [x] H01 Add **Home Prayer Hub** as a seventh selectable prayer-board template.
- [x] H02 Add responsive 16:10 smart-display layout optimised for a 1280 × 800 home touchscreen, keeping original SalahOS branding.
- [x] H03 Use the same source-validated next prayer, countdown, five-prayer times, dates, sunrise/sunset and mosque/Iqamah data; no new network dependency.
- [x] H04 Add mobile theme colours and thumbnail for the existing Today UI.
- [x] H05 Accept `?mode=smart-display&template=home-hub` and enable settings-gallery selection.
- [x] H06 Add focused registry, route and renderer regression-test cases.
- [x] H07 Set the visible project developer/maintainer and npm author to PrivacyOG.
- [x] H08 Preserve licence-required third-party content/audio/font attributions, separate from developer credits.
- [ ] H09 Verify format, lint, TypeScript, unit/integration, accessibility and build checks in GitHub CI on the exact PR head.
- [ ] H10 Capture and inspect 1280 × 800/1920 × 1080, narrow phone, and Arabic/RTL screenshots; check clock/countdown and five cards for clipping.
- [ ] H11 Manually test orientation, offline launch, screen sleep/wake, DST/timezone rollover and notifications on actual Android hardware.
- [ ] H12 Validate physical iOS/iPadOS behaviour and signing/provisioning for distribution.
- [ ] H13 Inspect all developer-credit metadata and historical GitHub contributor information without altering commit history.
- [ ] H14 Review merge and prerelease readiness only after required checks pass.
- [x] H15 Refresh vulnerable Capacitor, Vite and Vitest direct dependencies and npm lockfile; an isolated GitHub runner reported **0 npm audit vulnerabilities** on 2026-10-28.
- [ ] H16 Confirm the updated lockfile passes complete Quality Gate, Android/iOS build and visual regression on the final feature SHA. Note the audited Capacitor CLI 8.4.3 and runtime 8.5.3 compatibility must be tested.
- [x] H17 Review IMAN Pro Hub's published prayer-time feature set (20+ voices, 10+ designs, local times, countdown and Iqamah reminders). SalahOS currently provides 2 licensed packaged Adhans + private upload and 7 first-party prayer-board designs with accent variants; do not falsely claim equivalent catalogue counts.
- [x] H18 Update managed-display visual acceptance from six to seven templates, keeping all original designs.
- [x] H19 Add unique Home Hub selector thumbnail and targeted 1280 × 800/1920 × 1080/390 × 844 English/Arabic visual acceptance, including clipped text/card geometry.
- [x] H20 Inspect initial 1280 × 800 Playwright screenshots; identify English classic next-prayer/countdown contrast issue, commit explicit high-contrast colour fix and regression assertion. Fresh evidence still required before acceptance.
- [x] H21 Hide repeated unconfigured congregation placeholders in Home Hub when there are no sourced Iqamah times. Preserve real mosque Iqamah and original Structured Split behaviour; automated tests added.
- [ ] H22 Verify fresh full visual regression and native build acceptance on the exact final PR head, then reconcile screenshot findings and outstanding source-dependent failures.
- [ ] H23 Evaluate adding further legally cleared Muazzin recordings and optional Iqamah-reminder controls on dedicated home displays only, without claiming vendor feature parity or changing ordinary mobile Today.

## Existing independent blockers and carry-overs

- [ ] Independent qualified scholarly review of the 143-verse Qur'an translation-risk register; open PRs #288 and #290 require reconciliation. Do not treat a CI pass as scholarly sign-off.
- [ ] Physical Android/iOS OEM prayer-notification and audio acceptance; no verified consumer iOS IPA yet.
- [ ] Confirm available Adhan recordings, licence rights and voice count before advertising a comparable multi-voice library.
- [ ] End-to-end user acceptance of offline city/location modes, dates, prayer methods and mosque sources.
- [ ] Explicit product-owner review for any new release; this feature branch does not change stable-release gates.

## Reference and scope

Feature benchmark: [IMAN Pro Hub](https://au.iman.com.my/islamic-pro-hub/) advertises location-aware prayer times, a live next-prayer countdown, varied themes, Adhan choices and Iqamah reminder support. SalahOS develops its own visual presentation without copying third-party artwork, logos or proprietary assets. The display shares the existing verified prayer-time engine rather than integrating the referenced vendor's service.

## Workflow

Do not merge merely because code was committed. Update status using recorded CI/job results and physical-device evidence. Keep PrivacyOG as the only SalahOS developer credit; preserve truthful third-party legal/source attributions.
