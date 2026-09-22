# SalahOS v1.6.2 release notes

SalahOS v1.6.2 is a focused Qur’an editorial and governance update following the expanded Muhkam/Mutashabih review of the SalahOS 2026 English-meaning layer. It incorporates the reconciled project-guide treatment now on `main` while preserving explicit disclosure that independent qualified scholarly review is still pending.

> **Release status:** v1.6.2 is published as a project-owner-authorized **prerelease** while independent qualified whole-corpus scholarly review remains pending. This release status is not scholarly certification, and no pending review row has been converted into an approval.

## Qur’an Muhkam/Mutashabih reconciliation

- Maintains **143 translation-risk verses** under the supplied Muhkam/Mutashabih and tanzīh review policy.
- Maintains a **147-row review register**: 143 trigger verses plus four governing Muhkam foundations.
- Gives every maintained trigger an explicit SalahOS 2026 English meaning instead of silently falling back to the Pickthall baseline.
- Applies direct non-corporeal contextual taʾwīl to all seven Qur’anic istiwāʾ-over-the-Throne passages, using absolute dominion/subjugation wording and explicitly rejecting sitting, place, direction, movement and bodily modality.
- Retains the project-guide treatments for expressions including wajh, yad, sāq, nūr, maʿiyyah, fawqiyyah and related translation-risk language without turning verse-specific taʾwīl into global lexical replacement.
- Includes the ru’yah pair 6:103 and 75:23, preserving the distinction between non-encompassment and the believers’ seeing Allah in the Hereafter without direction or modality.
- Includes the later need/dependency/transaction idiom pass so expressions such as lending to Allah, helping Allah and commercial imagery do not imply divine need, dependence or gain from deficiency.

## Review and provenance status

- All generated review rows remain `status: pending-scholar-review` with `reviewer: null`.
- The 2026-09-09 project-owner whole-corpus record remains an editorial/release attestation only, not independent qualified scholarly approval.
- The v1.6.2 release authorization is exact-version and prerelease-only while `qualifiedScholarReviewStatus` remains pending.
- Stable publication remains gated on independent qualified scholarly approval unless the project policy is explicitly revised with equivalent transparent provenance.

## Quality and release engineering

- Synchronises npm/package-lock to `1.6.2`, Android to `versionCode 13` / `versionName 1.6.2`, and iOS to build `13` / marketing version `1.6.2`.
- Retains formatting, lint, typecheck, unit/coverage, Qur’an integrity/governance, dependency/security, mosque reproducibility, production-build and bundle-budget checks.
- Retains permanent Quality, Visual Regression, Android emulator lifecycle, iPhone/iPad Simulator and Windows executable workflows.
- Keeps publication tied to the exact current `main` revision, persistent Android signing, archive integrity, exact final file-set verification and SHA-256 verification.

## Downloadable v1.6.2 assets

A successful publication contains:

- `SalahOS-v1.6.2-android.apk`
- `SalahOS-v1.6.2-android.aab`
- `SalahOS-v1.6.2-windows-x64.exe`
- `SalahOS-v1.6.2-web-pwa.zip`
- `SalahOS-v1.6.2-raspberry-pi-kiosk.tar.gz`
- `SHA256SUMS.txt`

GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

A consumer iOS/iPadOS `.ipa` is not included because Apple distribution signing/provisioning is not configured. The iOS build remains covered by the repository’s iPhone/iPad Simulator validation workflow. No native macOS `.dmg` is included because SalahOS has no native macOS target.

Physical Android/iOS device acceptance remains a separately tracked hardware-validation item; emulator, Simulator and browser evidence are not represented as physical-device testing.

## Author

privacyOG
