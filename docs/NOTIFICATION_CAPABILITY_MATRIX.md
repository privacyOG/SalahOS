# Notification capability matrix

SalahOS stores notification intent in one shared cross-platform model, but each operating system exposes different delivery controls. This document records the capability boundary that the product and tracker must preserve.

## Shared preference model

Each obligatory prayer stores independent notification enabled state, reminder offset, prayer-time notification state, sound mode, vibration preference and Adhan preference. Shared scheduling retains that intent even when a target platform cannot express every field independently.

## Android

Android uses the native Local Notifications adapter and notification channels.

| Requested behavior | SalahOS Android behavior |
| --- | --- |
| Silent, vibration off | Dedicated `salahos-prayer-silent` channel with `vibration: false` |
| Silent, vibration on | Dedicated `salahos-prayer-silent-vibration` channel with `vibration: true` |
| Default sound | Uses the platform/default notification channel |
| Default sound + requested vibration state | Final vibration behavior remains channel/OS/user-setting controlled |

SalahOS therefore has deterministic independent vibration control for the two silent modes, but it must not claim complete independent sound/vibration control for audible Android notifications.

## iOS / iPadOS

iOS uses the native Local Notifications adapter. SalahOS can request a silent notification or the platform-default notification sound. The currently pinned adapter does not expose an independent per-notification vibration switch in the scheduled request used by SalahOS.

The shared vibration preference is retained in the scheduler record for cross-platform settings fidelity, but the iOS adapter must not claim that it can force vibration on or off independently from system notification presentation.

## Web / PWA / kiosk

Browser notification vibration support is not treated as a dependable cross-browser capability. Visible foreground behavior and local Adhan playback are separate from operating-system notification vibration.

## Tracker rule

The cross-platform vibration TODO remains partial until every supported native target can either:

1. express and verify independent vibration behavior for the advertised sound modes; or
2. the product scope is intentionally changed and documented to expose platform-specific capability instead of a universal guarantee.

A stored preference by itself is not evidence that the platform can enforce it.

## Verification contract

`scripts/verify-notification-capabilities.mjs` locks this boundary into the repository quality gate. It requires the two Android silent channels, verifies that Android selects them only for silent records, verifies iOS silent/default-sound scheduling, and rejects any documentation claim that independent cross-platform vibration is already guaranteed.

**Author:** privacyOG
