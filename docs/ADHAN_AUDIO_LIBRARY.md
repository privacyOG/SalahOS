# Adhan audio library

Stage 49 adds an offline-capable Adhan audio library without changing SalahOS's native notification-delivery contract.

## Packaged recordings and rights

SalahOS ships two full recordings in `public/audio/adhan/`:

| ID | Recording | Rights | Author / attribution |
| --- | --- | --- | --- |
| `beautiful-adhan` | Beautiful Adhan | CC0 1.0 | Adam-synagda; attribution retained voluntarily |
| `fajr-malmo` | Fajr Adhan — Malmö Mosque | CC BY 3.0 | Islamic Center Malmö; source, license and modifications retained in `ATTRIBUTION.md` |

The import source is pinned to `wali1984/Darul-Irfan` commit `f4a0bd42b475a0a7a452a6e662a1cd9566e9f5de`. The pinned source documents the original Wikimedia Commons works and licenses. SalahOS does not fetch those repositories or Commons at runtime.

`public/audio/adhan/ATTRIBUTION.md` records the original works, authors, source pages, licenses, pinned derivative paths and modifications. `assets.json` records the corresponding SHA-256 digests and technical metadata.

## Normalization and integrity

Both packaged recordings were normalized with FFmpeg `loudnorm=I=-16:TP=-1.5:LRA=11` and encoded as mono 44.1 kHz, 96 kbps MP3. The committed manifest records byte size, SHA-256, duration, codec, sample rate, channel count, bitrate and normalization targets.

Run:

```sh
npm run adhan:audio:check
```

The check fails if either packaged file, its pinned provenance, its rights record, or its normalization/integrity metadata drifts.

## User configuration

Notifications & Adhan settings expose:

- a default Adhan source;
- a per-prayer override for Fajr, Dhuhr, Asr, Maghrib and Isha;
- preview for each packaged recording and the optional local upload;
- playback volume from 0–100%;
- **Notification only**, which suppresses automatic full-Adhan playback while SalahOS is visible while leaving native scheduled notifications unchanged;
- a private local upload that remains in IndexedDB on the device and can be selected like a packaged source.

Library preferences are stored separately under `salahos.adhanAudioPreferences`. On Android and iOS this key is included in the application Preferences hydration list, so no `salahos.settings` schema migration is required.

If a saved configuration points to a local upload that no longer exists, foreground playback falls back to `beautiful-adhan` rather than attempting a missing or remote source.

## Offline and native behaviour

The packaged MP3s and `assets.json` are included in the service-worker install cache (`salahos-shell-v4`), so an installed web/PWA experience does not need the network to retrieve them after the cache is installed. Capacitor also copies the same production `dist` files into each native application during `cap sync`.

Android `npm run android:sync` runs `scripts/check-adhan-audio-native-bundle.mjs android`. The iOS workflow runs the same checker with `ios` immediately after `npx cap sync ios`. The checker compares the native copies against the source manifest by byte count and SHA-256 and requires the attribution file to be present.

Full packaged or local Adhan playback is intentionally **foreground app playback**. A browser or operating system can impose autoplay restrictions, and SalahOS reports those restrictions instead of claiming playback succeeded. When the application is backgrounded or terminated, the existing Android/iOS scheduling pipeline remains responsible for delivery as an operating-system notification. SalahOS does not claim that the multi-minute packaged recordings can bypass platform notification-sound or background-execution limits.

## Verification

Stage 49 acceptance is covered by:

```sh
npm run adhan:audio:check
npm test
npm run visual:check
npm run android:build
```

The visual Stage 49 journey verifies packaged recording visibility, deterministic preview source selection, Fajr override persistence, volume persistence, notification-only persistence, RTL rendering and mobile overflow. Exact-head Android emulator lifecycle and fresh iPhone/iPad Simulator acceptance remain required before the roadmap stage is marked complete.
