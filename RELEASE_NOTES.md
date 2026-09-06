# SalahOS v1.5.3 release notes

SalahOS v1.5.3 is a prayer-correctness, Qur’an-reading, notification-onboarding and UX refinement release. It tightens mosque data handling, makes prayer-state semantics more explicit, improves navigation across the full 6,236-ayah Qur’an corpus, and preserves the project’s strict provenance, licensing, accessibility and exact-head release contracts.

## Prayer correctness and Today

- Rejects implausible published mosque congregation times instead of clamping or silently shifting them, including guarded Fajr, Dhuhr, Asr, Maghrib and Isha acceptance windows and Isha midnight-wrap handling.
- Hardens the Australian mosque data generators so Jumu’ah collisions and coarse impossible fard-time candidates are dropped before reaching runtime data.
- Prevents a far-away selected mosque from silently relocating the user’s prayer calculation beyond the named 150 km guard while still allowing its published congregation/Jumu’ah information to be viewed.
- Promotes every available Friday Jumu’ah session directly beneath the Today hero and carries directory-published Jumu’ah times through the selected-mosque context without inventing khutbah times.
- Adds a Night section for Islamic midnight, final-third/Tahajjud start and optional configured Ishraq/Duha, with an explicit night-end convention.
- Widens the Hijri correction control from ±2 to **±3 days**.
- Replaces the ambiguous “Between prayer times” state with explicit civil-day schedule states. Before Fajr, SalahOS reports that it is before today’s first obligatory prayer rather than silently carrying the previous civil day’s Isha forward. This is a presentation convention, not a fiqh ruling about prayer validity.
- Adds a persistent method/Asr provenance chip and refreshes Today when settings or selected-mosque profile state changes.

## First-run setup and prayer notifications

- Adds a focused first-run prayer-setup step for calculation method and Asr convention, including offline country-based method suggestions, an MWL fallback and Standard/Hanafi Asr preview times.
- Adds a third onboarding step for local prayer notifications with accurate platform-limitations copy and existing per-prayer preference semantics.
- Requests native notification permission only after explicit opt-in; skipping or declining does not cause automatic re-prompting and notification controls remain reachable later in Settings.
- Preserves Android exact-alarm handling behind explicit user action, keeps an inexact fallback when exact scheduling is unavailable, and preserves reboot/reschedule restoration behavior.

## Qur’an and Islamic Knowledge

- Gives the Qur’an a dedicated deep-linkable reading route while retaining Library / Qur’an / Hadith navigation inside Knowledge.
- Bundles the Amiri Quran font under SIL OFL 1.1, removes conflicting Arabic typography rules and standardises Qur’an font/scale state across reader surfaces.
- Makes the full **6,236-ayah** corpus practical to navigate with searchable surah indexing, Juz and mushaf-page navigation, continuous virtualised surah scrolling, per-surah scroll restoration and Resume last read highlighting.
- Improves ayah presentation with Arabic-Indic end markers, surah header bands, basmala exceptions, cleaner reading controls and less repetitive provenance chrome.
- Gives translation/transliteration and mixed-script metadata explicit `lang`/`dir` handling and strengthens RTL isolation.
- Moves Qur’an `aria-live` behavior to a concise result-status region so screen readers do not re-announce whole passages.
- Localises Juz/page/reference/source labels and numbers, and keeps required Tanzil attribution and its reviewed external-link path visible in-app.
- Keeps the current curated hadith scope honest about partial Arabic matn, isnad, grading authority and unavailable metadata.
- **No new rights-pending Qur’an translation or transliteration content is bundled in v1.5.3.** The approved licensing strategy remains gated on actual written permission or a compatible licence before product integration.

## UX, navigation and performance

- Refines Sunrise as a visually secondary non-prayer boundary and distinguishes selected-mosque, approximate and saved/precise location states without changing prayer semantics.
- Consolidates phone bottom-navigation ownership, equal-width six-destination layout and overflow handling, including the shorter Indonesian `Ilmu` label.
- Reduces lower-hierarchy Today eyebrow density to sentence case/weight 600 while preserving strong uppercase tracking for hero prayer/countdown labels and RTL overrides.
- Splits astronomical schedule computation from live countdown derivation, memoises schedule work across stable date/settings/location inputs, and reduces unnecessary per-second recomputation.

## Quality and release engineering

- V1.5.3 implementation items were accepted through the permanent Quality, Visual Regression, Android emulator lifecycle, fresh iPhone/iPad Simulator and Windows executable workflows before release reconciliation.
- Preserves design-token ownership, domain/platform/UI boundaries, native-permission policy, remote-network policy, dependency audit/licensing checks, Qur’an integrity/governance, mosque-directory reproducibility, coverage, production build and bundle-budget enforcement.
- Keeps the reviewed Today typography golden-image delta scenario-scoped rather than weakening the global visual-regression threshold.

## Release reconciliation

- Synchronises npm, package-lock, Android and iOS marketing versions at `1.5.3`.
- Advances Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` together from build `9` to build `10`.
- Preserves fail-closed exact-current-main release preflight, Android production-signing verification, archive-integrity checks and exact-final-file-set verification.

## Downloadable v1.5.3 assets

A successful v1.5.3 publication includes:

- `SalahOS-v1.5.3-android.apk` — persistently signed Android release APK for direct installation;
- `SalahOS-v1.5.3-android.aab` — persistently signed Android App Bundle for Google Play/distribution workflows;
- `SalahOS-v1.5.3-windows-x64.exe` — self-contained 64-bit Windows 10/11 desktop executable;
- `SalahOS-v1.5.3-web-pwa.zip` — complete production Web/PWA package;
- `SalahOS-v1.5.3-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — SHA-256 hashes for the packaged release assets.

The Windows executable includes its .NET runtime and expects the Microsoft Edge WebView2 Runtime, normally present on current Windows 10/11 installations. GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and a distribution archive can be validated. iPhone/iPad Simulator acceptance is test evidence, not a consumer installer.
- No native macOS `.dmg` is published because SalahOS does not contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance is not inferred from browser, emulator or Simulator evidence.

## Release gates

The v1.5.3 release revision must be the exact current `main` commit and pass the permanent Quality Gate, Visual Regression, Android, iOS and Windows workflows. The release-asset workflow reruns repository quality checks, verifies persistent Android signing, builds and verifies APK/AAB packages, validates Web/PWA and Raspberry Pi archives, checks the exact final file set and SHA-256 manifest, and only then creates or updates the GitHub release. The Windows workflow independently self-tests the packaged executable and reconciles its checksum into the published manifest.

## Author

privacyOG
