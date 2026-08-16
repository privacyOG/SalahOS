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

## Web and installed PWA

Browser capabilities vary by engine, operating system and installation state.

- Notification permission must be granted by the user where browser notifications are used.
- A normal web page cannot be treated as a dependable always-running scheduler after the page is closed or the device suspends.
- Service workers are event-driven and must not be described as permanent background processes or exact local alarm clocks.
- A visible kiosk page may provide in-app countdowns and state changes, but a suspended browser, sleeping device or terminated process can prevent timely execution.
- SalahOS must not claim exact background prayer alerts on Web/PWA until a tested delivery mechanism exists for the target browser/platform combination.

## Android

The Android application will require a native scheduling adapter before local prayer notifications are considered delivered functionality.

- Notification permission and other notification controls vary by Android version and device policy.
- Exact scheduling can be restricted by operating-system policy and should only be requested where justified and permitted.
- Battery optimisation, idle modes, vendor background restrictions and user settings can affect delivery timing.
- Scheduled work may need to be reconstructed after reboot or application/package changes depending on the chosen native mechanism.
- Adhan playback must follow lifecycle, audio, focus and background-execution rules rather than assuming unrestricted playback.

The Android UI and documentation must describe these constraints instead of promising exact alarms on every device.

## iOS and iPadOS

The Apple-platform application will require a native local-notification adapter before local prayer notifications are considered delivered functionality.

- Notification permission is controlled by the user and can be changed outside the application.
- The operating system owns final notification presentation and delivery behaviour.
- Background execution must not be assumed to continue indefinitely after the application leaves the foreground.
- Notification and audio behaviour must stay within the platform's local-notification and background-audio rules.
- SalahOS must not promise unrestricted full-length Adhan playback or exact second-level background execution without verified platform support.

## Raspberry Pi, desktop and kiosk deployments

A kiosk or desktop deployment can keep the shared application visible and therefore has different practical behaviour from a suspended phone application.

- In-app countdowns and prayer transitions work while the process and display session remain active.
- Browser or desktop notification delivery still depends on permissions and the host notification service.
- System sleep, browser termination, session logout or power loss stops in-process timers.
- Startup/reboot recovery must recalculate from the current clock and persisted settings; it must not assume timers survived downtime.
- A deployment that requires unattended alerts should use a tested host-level/native scheduling adapter rather than relying solely on an open browser tab.

## Product wording rule

Until a delivery path has been implemented and verified on a target platform, describe notification controls as **preferences** or **scheduled intent**, not as a guarantee of exact delivery. When a platform adapter is added, its tested capabilities and known restrictions must be documented separately.

### Current Android implementation boundary

The committed Android shell has an on-device Local Notifications adapter. It requests display permission only when a configured prayer alert requires native delivery, reconciles today/tomorrow prayer jobs from the shared scheduler, ignores already-past jobs and removes stale SalahOS-owned pending jobs without touching unrelated notifications.

The manifest declares `SCHEDULE_EXACT_ALARM`, which is user-managed special access on supported Android versions. SalahOS checks that setting and never opens the system settings screen without an explicit user action. When access is granted, scheduled `at` notifications can use exact-alarm delivery; when it is unavailable, the same prayer notifications remain scheduled with an explicitly reported inexact fallback and the UI warns that Android may delay them. Returning from a changed exact-alarm setting triggers reconciliation of current jobs.

Exact-alarm access still does not bypass Doze, Battery Saver, OEM background restrictions, notification-channel settings, device power-off or reboot behavior. SalahOS does not request an unrestricted battery-optimisation exemption. When the app returns to the foreground, the existing focus/pageshow/visibility recovery path rechecks current time and reconciles the native prayer-notification schedule. This improves recovery without claiming that foreground code can override Android background policy. Reboot recovery and physical/emulator timing verification remain separately tracked. Android Adhan lifecycle policy is explicit: the current Adhan option is a notification alert, not unrestricted full-recording playback. Full local Adhan audio remains a separate feature and must define audio focus/interruption behavior before implementation.
