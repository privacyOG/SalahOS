# SalahOS — Temporary development checklist: Home Prayer Hub

**Owner/developer:** PrivacyOG  
**Reviewed:** 2026-10-29 (Australia/Sydney)  
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
- [x] H09 Quality Gate succeeded on product commit `7f5849d1b65f171dfb5728acf7f4e6de8fcf1ba0` (run [40652122937](https://github.com/privacyOG/SalahOS/actions/runs/40652122937)): format, lint, TypeScript, policy/security, dependency audit, unit/integration, accessibility-related suites, offline data checks, coverage, bundle and production-build checks.
- [x] H10 Captured and inspected final 1280 × 800 EN and AR/RTL, 1920 × 1080 EN, 390 × 844 AR/RTL and mobile theme EN screenshots on commit `7f5849d`. All five prayer rows are present, with no detected horizontal or card clipping; narrow portrait mode is vertically scrollable (not all five rows fit simultaneously). Clock/countdown foreground contrast improved. Final [visual artifact](https://github.com/privacyOG/SalahOS/actions/runs/40652122930/artifacts/12800552575) (30-day GitHub retention).
- [ ] H11 Manually test orientation, offline launch, screen sleep/wake, DST/timezone rollover and notifications on actual Android hardware.
- [ ] H12 Validate physical iOS/iPadOS behaviour and signing/provisioning for distribution.
- [x] H13 Audited all 1,380 commits reachable from `main` through GitHub's paginated commit API and all 62 feature-branch PR commits. Developer-authored history uses `privacyOG`; main also contains service-generated commits from `github-actions[bot]` and `SalahOS CI`/`actions`, which are automation and not product developer credits. Verified `README.md` developer/maintainer and `package.json` author = PrivacyOG, and searched for AI coauthor/credit names; no additional developer credit identified. No commit history was rewritten; legally required third-party attributions are retained.
- [ ] H14 Review merge and prerelease readiness only after required checks pass.
- [x] H15 Refresh vulnerable Capacitor, Vite and Vitest direct dependencies and npm lockfile; an isolated GitHub runner reported **0 npm audit vulnerabilities** on 2026-10-28.
- [x] H16 On product commit `7f5849d`, the audited Capacitor CLI 8.4.3/runtime 8.5.3 lockfile passed Quality Gate [40652122937](https://github.com/privacyOG/SalahOS/actions/runs/40652122937), visual regression [40652122930](https://github.com/privacyOG/SalahOS/actions/runs/40652122930), Android debug APK + emulator [40652122939](https://github.com/privacyOG/SalahOS/actions/runs/40652122939), iPhone/iPad Simulator build/launch [40652122950](https://github.com/privacyOG/SalahOS/actions/runs/40652122950), and Windows executable [40652122919](https://github.com/privacyOG/SalahOS/actions/runs/40652122919). Simulator success is **not** distribution signing or physical-device acceptance.
- [x] H17 Review IMAN Pro Hub's published prayer-time feature set (20+ voices, 10+ designs, local times, countdown and Iqamah reminders). SalahOS currently provides 2 licensed packaged Adhans + private upload and 7 first-party prayer-board designs with accent variants; do not falsely claim equivalent catalogue counts.
- [x] H18 Update managed-display visual acceptance from six to seven templates, keeping all original designs.
- [x] H19 Add unique Home Hub selector thumbnail and targeted 1280 × 800/1920 × 1080/390 × 844 English/Arabic visual acceptance, including clipped text/card geometry.
- [x] H20 Inspect initial 1280 × 800 Playwright screenshots; identify English classic next-prayer/countdown contrast issue, commit explicit high-contrast colour fix and regression assertion. Fresh evidence still required before acceptance.
- [x] H21 Hide repeated unconfigured congregation placeholders in Home Hub when there are no sourced Iqamah times. Preserve real mosque Iqamah and original Structured Split behaviour; automated tests added.
- [x] H22 Final product-code commit `7f5849d` had five successful workflows; screenshot evidence reviewed and prior gallery-count failure, classic countdown contrast and missing-Iqamah presentation reconciled. **Note:** this checklist-only documentation commit creates a newer PR SHA, so check its own GitHub CI before claiming exact-current-head green.
- [ ] H23 Evaluate adding further legally cleared Muazzin recordings and optional Iqamah-reminder controls on dedicated home displays only, without claiming vendor feature parity or changing ordinary mobile Today.

## Verified build evidence — 2026-10-29 review

- Fully tested product-code SHA: `7f5849d1b65f171dfb5728acf7f4e6de8fcf1ba0`; all five workflows succeeded, including both Android jobs.
- Visual artifact metadata: seven gallery entries, two compatible managed targets, one blocked incompatible target; prayer board config matrix includes Home Hub at 1280 × 800 (English + Arabic RTL), 1920 × 1080 (English), and 390 × 844 (Arabic RTL).
- The visual artifact's axe accessibility sample reported no violations for its Today EN, Knowledge AR and Settings AR cases; do not misrepresent those samples as a comprehensive audit of every Home Hub state.
- The final 390 × 844 smart-display screenshot is a **viewport** capture; the fifth prayer continues below the fold and can be reached by scrolling. The UI tests verified all five prayer elements and no horizontal overflow.
- GitHub Actions checks and simulators are reproducible technical evidence; no claim of hardware sleep/wake, physical notification or iOS signing acceptance.

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
