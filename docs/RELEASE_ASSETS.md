# SalahOS downloadable release assets

GitHub releases are intended to provide ready-to-use artifacts for nontechnical users wherever the target platform can be packaged and distributed safely.

## Which file should I download?

- **Android:** `SalahOS-vX.Y.Z-android.apk` — a cryptographically signed Android release APK. Android may ask you to permit installation from the browser or file manager used to open the APK.
- **Android App Bundle:** `SalahOS-vX.Y.Z-android.aab` — the persistently signed bundle intended for Google Play/distribution workflows; it is not a sideload installer.
- **Web/PWA:** `SalahOS-vX.Y.Z-web-pwa.zip` — the complete production Web/PWA build for static hosting.
- **Raspberry Pi / kiosk / TV-style Chromium display:** `SalahOS-vX.Y.Z-raspberry-pi-kiosk.tar.gz` — the production Web/PWA build plus the SalahOS Chromium kiosk launch/autostart helpers.
- **Checksums:** `SHA256SUMS.txt` — SHA-256 hashes for the published release assets.

## Android release signing

Consumer Android APK and AAB packages are published only when the repository has a persistent release signing identity configured. The release workflow requires these GitHub Actions secrets:

- `SALAHOS_ANDROID_KEYSTORE_BASE64`
- `SALAHOS_ANDROID_KEYSTORE_PASSWORD`
- `SALAHOS_ANDROID_KEY_ALIAS`
- `SALAHOS_ANDROID_KEY_PASSWORD`

`SALAHOS_ANDROID_KEYSTORE_BASE64` is the base64 representation of the persistent Android release keystore. The keystore itself and its passwords must never be committed to this repository. Keep a secure offline backup: future Android updates must be signed with the same key.

The release workflow fails rather than publishing unsigned or debug Android packages when signing is unavailable, verifies the release APK with Android `apksigner`, and verifies the AAB signature before publication.

## Raspberry Pi / kiosk bundle

Extract the archive on a Raspberry Pi OS Desktop or compatible Linux kiosk system. The bundle contains:

- `dist/` — built SalahOS Web/PWA application;
- `scripts/kiosk/run-salahos-kiosk.sh` — serves the local build and opens Chromium in kiosk mode;
- `scripts/kiosk/install-labwc-autostart.sh` — helper for labwc autostart integration.

Python 3 and Chromium are expected on the target operating system. Physical Raspberry Pi/TV acceptance remains a separate hardware-validation step and is not inferred from CI packaging.

## iPhone/iPad

The repository has a validated iOS native target, but a consumer-installable `.ipa` is not published until Apple distribution signing/provisioning is configured and the resulting distribution package can be validated. iOS Simulator application bundles are test evidence, not end-user installers.

## macOS

SalahOS does not currently contain a native macOS desktop target. A `.dmg` will be added only after a real macOS application target is implemented, signed, and validated. A Web/PWA or iOS Simulator build will not be relabeled as a macOS installer.

## Integrity

Compare the SHA-256 hash of a downloaded artifact with `SHA256SUMS.txt` before distributing it further. Release assets are produced from the tagged revision only after the required release build jobs succeed.
