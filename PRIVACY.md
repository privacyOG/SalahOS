# SalahOS Privacy Principles

**Author:** privacyOG

SalahOS is designed around local-first prayer-time functionality.

## Core principles

- Core prayer calculations run locally on the device.
- No account is required for core prayer-time functionality.
- Precise location is requested only when the user chooses current-location functionality.
- Continuous GPS polling is avoided unless a future feature has a clear, disclosed need.
- Saved coordinates, selected mosque, calculation settings, Hijri adjustment, timetable data, and any user-selected local Adhan recording are stored locally by default.
- Precise location must not be included in routine analytics, diagnostics, or logs.
- No unnecessary analytics or telemetry is enabled by default.
- Remote APIs are optional enhancements and must disclose what data is transmitted and why.
- Imported timetable/configuration files are treated as untrusted input and validated before use.
- Secrets, signing credentials, and private API keys must never be committed to the repository.

## Location handling

When current location is used, SalahOS requests a single current-position fix rather than continuously watching the device. If permission is denied or location services are unavailable, saved/manual locations continue to support core prayer calculation.

Coordinate-to-timezone resolution uses bundled/local data. Core coordinate-to-timezone lookup does not require transmitting precise coordinates to a remote resolver.

### Native permission boundary

Android uses only the reviewed app-owned location permissions required by the current one-shot location feature. Background-location permission is not requested. The native build additionally verifies the effective merged permission set so dependency-contributed permissions cannot silently expand without review.

iOS/iPadOS runtime behaviour is likewise one-shot and foreground-only. The pinned native geolocation dependency requires both `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` in the application configuration. The second key is a dependency compatibility declaration rather than a SalahOS request for background tracking: continuous location watching and location background modes remain prohibited by the candidate permission contract.

### Native bundled-content boundary

The Capacitor native shells load the application bundled from the local `dist` build. The reviewed source configuration does not define a remote `server.url`, navigation allowlist, cleartext override, custom hostname, or custom Android/iOS scheme.

`npm run verify:capacitor-config` checks that source contract and re-runs after `cap sync` on both Android and iOS so generated native configuration is also rejected if it acquires a `server` block or unexpected application identity/web-directory value. A future remote-hosted native WebView mode therefore requires an explicit privacy/security review rather than a configuration-only change.

## Local data backup and transfer

The Android application disables application backup and supplies explicit exclusion rules for both legacy backup handling and Android 12+ cloud-backup/device-transfer paths. This is intended to keep SalahOS-owned local location, mosque, settings and media state from being copied through Android application-backup mechanisms by default.

Platform behaviour outside the application's controllable backup contract must not be described as an absolute guarantee; any future backup/export feature requires a separate privacy/security design and explicit user action.

## Local Adhan audio

When the user selects a local Adhan recording, SalahOS stores the recording in its device/browser-local IndexedDB media store. The local recording:

- is not uploaded by the local-audio feature;
- is not included in settings export;
- is not copied into repository or release assets;
- is limited to a bounded audio file size;
- can be removed by the user, which deletes the SalahOS-owned local media entry.

The selected recording is used only for visible-foreground playback. Background/terminated native notification scheduling does not transmit or package that recording.

## Web/PWA offline-cache boundary

The service worker caches only the application shell and explicit first-party static paths required for offline startup: generated `/assets/`, `/icons/`, and `manifest.webmanifest`. Arbitrary same-origin GET/API/data responses bypass service-worker runtime caching rather than being persisted automatically.

Navigation updates replace the cached application shell only when the network response is successful HTML. The service-worker cache namespace is versioned; narrowing the cache policy increments that version so older broader cache entries are removed during activation.

`npm run verify:service-worker-cache-boundary` enforces these rules. A future feature that needs offline caching of API or user-derived content therefore requires an explicit privacy/storage review rather than inheriting a broad same-origin cache policy.

## Optional network boundary

No optional remote provider is enabled by default. A future optional remote request must pass through the reviewed request boundary and:

- use HTTPS;
- match an explicitly configured origin allowlist;
- omit browser cookies/credentials and credential-bearing request headers;
- suppress referrer disclosure;
- fail rather than follow redirects;
- avoid HTTP cache reuse for the request;
- preserve an offline/local failure path.

Direct unreviewed production networking primitives are rejected by repository policy. Android cleartext application traffic is explicitly disabled, and iOS transport-security weakening keys are rejected by the native verifier unless an intentional review changes that policy.

If a future feature needs to transmit precise coordinates or another sensitive field, that feature must disclose the data flow and document why a local/coarser alternative is insufficient.

## Telemetry

The default product does not require behavioural analytics. If optional diagnostics are introduced later, they must be opt-in or strictly privacy-preserving, documented, and must exclude precise location, prayer-history data and user-selected local media unless the user knowingly provides the relevant data for support.

## Network failure

Network loss must not prevent locally calculable prayer schedules, access to previously saved mosque timetables, previously saved settings, or use of a previously stored local Adhan recording while the application remains in a supported foreground state.

## Security baseline

- HTTPS-only reviewed optional remote request boundary.
- Native Capacitor shells load bundled application content and reject unreviewed remote-server/origin overrides.
- Bounded Web/PWA service-worker cache allowlist; arbitrary same-origin API/data responses are not cached by default.
- Strict validation of CSV/JSON imports.
- Content Security Policy on web/PWA targets where applicable.
- Reviewed source and effective native permissions.
- Android backup/device-transfer exclusion and cleartext-traffic restriction.
- iOS transport-security overrides rejected unless separately reviewed.
- Dependency vulnerability and license review before releases.
- No secrets in source control.
