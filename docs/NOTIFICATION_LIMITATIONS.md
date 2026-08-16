# Notification and Adhan platform limitations

SalahOS calculates prayer times and notification schedule intent locally. Delivery is a separate platform capability. The application must not promise that every operating system or browser will deliver an alert at an exact wall-clock second.

## Shared guarantees

The shared scheduling layer can provide the following before a platform adapter is involved:

- stable notification identities by prayer date, prayer and intent kind;
- reminder, prayer-time and Adhan scheduling intent derived from saved preferences;
- recalculation after location, timezone, calculation-method or date changes;
- duplicate-safe reconciliation of installed and desired jobs;
- IANA timezone conversion with explicit handling of daylight-saving gaps and repeated wall-clock times;
- deterministic cancellation/replacement instructions when a calculated delivery instant changes.

These are scheduling semantics, not a guarantee that the operating system will display or play an alert at the requested instant.

## User-selected local Adhan audio

SalahOS supports a user-selected audio recording that remains in device-local IndexedDB storage. The recording is not uploaded, exported with settings or bundled into the application.

The shared foreground player can play the selected full recording automatically when all of the following are true:

- the application is open;
- the document is visible;
- the current minute matches an obligatory prayer start from the selected prayer source;
- that prayer is enabled for notifications and its Adhan option is enabled;
- the browser/WebView permits audio playback.

A stable date/prayer playback key prevents repeated automatic playback during the same prayer minute. The user can preview or remove the selected recording. Browser or operating-system autoplay policy can still block automatic playback; SalahOS reports that condition rather than claiming playback occurred.

This foreground capability does **not** turn a background or terminated application into an unrestricted audio service. Background/terminated native delivery remains a platform notification alert. SalahOS does not upload the selected recording to a server, copy it into native notification resources, or claim that an arbitrary full recording can be played after application termination.

## Web and installed PWA

Browser capabilities vary by engine, operating system and installation state.

- Notification permission must be granted by the user where browser notifications are used.
- A normal web page cannot be treated as a dependable always-running scheduler after the page is closed or the device suspends.
- Service workers are event-driven and must not be described as permanent background processes or exact local alarm clocks.
- A visible page can provide in-app countdowns, state changes and the user-selected foreground Adhan playback described above, subject to browser autoplay policy.
- A suspended browser, sleeping device or terminated process can prevent timely in-page execution and audio playback.
- SalahOS must not claim exact background prayer alerts on Web/PWA until a tested delivery mechanism exists for the target browser/platform combination.

## Android

The committed Android shell uses the native Local Notifications adapter for bounded prayer-alert scheduling.

- Notification permission and other notification controls vary by Android version and device policy.
- `SCHEDULE_EXACT_ALARM` is user-managed special access where applicable; SalahOS checks it and supports an explicit inexact fallback when it is unavailable.
- Battery optimisation, idle modes, vendor background restrictions and user settings can affect delivery timing.
- The pinned Local Notifications integration includes reboot restoration and SalahOS verifies the plugin/merged-manifest restoration contract during Android builds.
- Returning to the app triggers schedule reconciliation through the runtime recovery path.
- The shared user-selected recording can provide full Adhan playback only while the app is open and visible. Android background or terminated delivery remains the scheduled system notification alert.

The Android UI and documentation describe these constraints instead of promising exact alarms or unrestricted background audio on every device. Physical-device Doze/OEM timing and full notification/Adhan acceptance remain separate evidence.

## iOS and iPadOS

The committed iOS/iPadOS shell uses the native Local Notifications adapter for a bounded future prayer-notification horizon.

- Notification permission is controlled by the user and can be changed outside the application.
- The operating system owns final notification presentation and delivery behaviour.
- Background execution is not assumed to continue indefinitely after the application leaves the foreground.
- Native notification requests are reconciled from the shared desired schedule rather than relying on an always-running application process.
- The shared user-selected recording can provide full Adhan playback only while the app is open and visible. Background/terminated delivery remains a system notification alert and does not claim arbitrary full-recording playback.
- Simulator build/launch evidence does not substitute for real iPhone/iPad notification timing or audio acceptance.

## Raspberry Pi, desktop and kiosk deployments

A kiosk or desktop deployment can keep the shared application visible and therefore has different practical behaviour from a suspended phone application.

- In-app countdowns and prayer transitions work while the process and display session remain active.
- The user-selected local recording can play at an enabled prayer minute while the document remains visible and host autoplay policy permits it.
- Browser or desktop notification delivery still depends on permissions and the host notification service.
- System sleep, browser termination, session logout or power loss stops in-process timers and foreground audio.
- Startup/reboot recovery must recalculate from the current clock and persisted settings; it must not assume timers survived downtime.
- A deployment that requires unattended alerts while the browser/process is not running should use a tested host-level/native scheduling adapter rather than relying solely on an open browser tab.

## Product wording rule

Only describe a delivery capability at the level actually tested. Shared schedule reconciliation, native scheduling support and visible-foreground local audio are distinct capabilities. None of them by itself proves exact physical-device delivery under every power, permission, background, DST or OEM condition.

### Current Android implementation boundary

The committed Android shell has an on-device Local Notifications adapter. It requests display permission only when a configured prayer alert requires native delivery, reconciles today/tomorrow prayer jobs from the shared scheduler, ignores already-past jobs and removes stale SalahOS-owned pending jobs without touching unrelated notifications.

The manifest declares `SCHEDULE_EXACT_ALARM`, which is user-managed special access on supported Android versions. SalahOS checks that setting and never opens the system settings screen without an explicit user action. When access is granted, scheduled `at` notifications can use exact-alarm delivery; when it is unavailable, the same prayer notifications remain scheduled with an explicitly reported inexact fallback and the UI warns that Android may delay them. Returning from a changed exact-alarm setting triggers reconciliation of current jobs.

Exact-alarm access still does not bypass Doze, Battery Saver, OEM background restrictions, notification-channel settings, device power-off or reboot behavior. SalahOS does not request an unrestricted battery-optimisation exemption. When the app returns to the foreground, the existing focus/pageshow/visibility recovery path rechecks current time and reconciles the native prayer-notification schedule. This improves recovery without claiming that foreground code can override Android background policy.

Android Adhan lifecycle policy is explicit: system-scheduled Adhan jobs are notification alerts in background/terminated states. A selected local recording is separately stored on-device and may play as full foreground audio only while SalahOS is open and visible. Native unrestricted background full-recording playback is not claimed.

### Android reboot restoration

The pinned Android Local Notifications dependency provides a native boot restore receiver for saved scheduled notifications. SalahOS verifies the installed source contract and Gradle merged manifest on every Android build rather than duplicating the receiver. Manufacturer boot timing, Doze and notification presentation can still differ on physical devices, so build-time restoration support is not represented as device-level delivery timing evidence.
