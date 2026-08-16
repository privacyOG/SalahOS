# TV and kiosk deployment paths

SalahOS provides a standards-based Web/PWA smart-display presentation. This document distinguishes repository-validated deployment paths from platform-specific native applications that are not currently shipped.

## Smart-display URL

After configuring location, calculation/source preferences and any mosque timetable in the standard interface, open the same application with:

```text
?mode=smart-display
```

The smart-display presentation uses the same persisted settings, selected prayer source, timezone, live clock and prayer dashboard as the standard application.

## Validated kiosk path

The repository-validated unattended display path is Raspberry Pi OS Desktop or a comparable Linux desktop with Chromium, using the existing loopback launcher:

```bash
SALAHOS_KIOSK_URL='http://127.0.0.1:4173/?mode=smart-display' \
  bash scripts/kiosk/run-salahos-kiosk.sh
```

See [Raspberry Pi kiosk deployment](RASPBERRY_PI_KIOSK.md) and [Raspberry Pi Touch Display 2 setup](RASPBERRY_PI_TOUCH_DISPLAY_2.md).

A Linux mini-PC or other computer connected to a television over HDMI can use the same built Web/PWA bundle and browser presentation. Hardware-specific display, audio, HDMI-CEC, wake and power-management behaviour must still be validated on the target equipment.

## TV browser path

The built Web/PWA can also be hosted on a local or HTTPS web server and opened in a television's browser when that browser supports the application bundle. This is a browser deployment, not a native television application.

Before treating a TV browser as supported for unattended use, verify on the exact model:

- application load and local storage;
- smart-display layout at the native panel resolution;
- Arabic/RTL rendering if required;
- clock and countdown updates over several hours;
- local-midnight and DST behaviour;
- browser cache/offline behaviour;
- screen saver, sleep/wake and power-loss recovery;
- remote-control key events and browser chrome/full-screen behaviour.

The repository does not claim that every smart-TV browser provides the same PWA, storage, service-worker, keyboard or full-screen capabilities as desktop Chromium.

## Keyboard and remote Back behaviour

The smart-display view contains no interactive menus that require D-pad focus navigation. Where a browser forwards standard keyboard events to the page, these keys return from smart-display mode to the normal configuration interface while preserving unrelated URL parameters:

- `Escape`
- `Backspace`
- `BrowserBack`
- `GoBack`

A television, remote, kiosk shell or browser may intercept a Back/Escape action before the page receives it. That behaviour is platform-specific and must be tested on the target device.

## Burn-in-conscious behaviour

The smart-display stylesheet applies a very slow, bounded pixel shift to the display surface so long-lived text and card edges do not remain at exactly the same coordinates indefinitely. The movement stays within the existing display padding and does not alter prayer data or timing.

When the operating system/browser requests reduced motion, the animation is disabled. Display brightness, panel pixel-refresh functions, screen-off schedules and other panel-specific protection remain device responsibilities.

## Native TV platforms not currently claimed

SalahOS does **not** currently ship or claim native packages for television-specific operating systems. In particular, this repository does not claim a native Android TV/Google TV, Apple tvOS, Samsung Tizen, LG webOS or Fire TV application.

Those platforms may still display SalahOS through an available standards-compatible browser, an HDMI-connected computer, or an external screen-mirroring/casting workflow, but those paths must not be described as native SalahOS applications without a separately implemented and validated target package.

## Casting and mirroring

Screen mirroring or casting from another device can be useful for temporary display, but the casting transport and receiver lifecycle are outside the SalahOS runtime. For an always-on prayer display, prefer a directly attached browser/kiosk device so the clock, prayer schedule and recovery behaviour remain local to the display host.

## Acceptance boundary

Repository CI can verify smart-display rendering logic, key mapping, stylesheet contracts, Web/PWA build output and Linux kiosk command construction. It cannot prove a television's browser engine, remote-control mapping, HDMI-CEC behaviour, panel burn-in characteristics, sleep policy or power-loss recovery. Those remain target-device acceptance checks.
