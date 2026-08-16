# Raspberry Pi kiosk deployment

This guide covers the repository-validated Raspberry Pi OS Desktop / Chromium kiosk path. It does not replace physical Raspberry Pi Touch Display 2 layout, orientation, brightness, touch or thermal validation.

## Supported deployment contract

The validated launcher serves the built SalahOS Web/PWA bundle only on localhost and opens Chromium in kiosk mode. The browser does not need an external web server after the build has been copied to the Raspberry Pi.

Current Raspberry Pi documentation recommends Raspberry Pi OS for Raspberry Pi computers, and Raspberry Pi OS Desktop includes Chromium. The current Raspberry Pi kiosk tutorial uses the desktop's `labwc` autostart file to launch Chromium when the graphical session starts.

References:

- https://www.raspberrypi.com/documentation/computers/os.html
- https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/

## Prerequisites

Use Raspberry Pi OS Desktop with Chromium and Python 3 available. The kiosk wrapper intentionally does not install operating-system packages or change global browser/security settings.

On the development/build machine:

```bash
npm ci --ignore-scripts
npm run check
npm run build
```

Copy the repository (or at minimum the `dist/` directory and `scripts/kiosk/` directory) to the Raspberry Pi while preserving their relative layout.

## Launch once

From the repository root on the Raspberry Pi:

```bash
bash scripts/kiosk/run-salahos-kiosk.sh
```

The launcher:

1. requires a built `dist/index.html`;
2. validates the configured local TCP port;
3. locates `chromium` or `chromium-browser` unless `SALAHOS_BROWSER` is set;
4. starts `python3 -m http.server` bound to `127.0.0.1` by default;
5. waits for the local page to become reachable;
6. launches Chromium with kiosk, first-run suppression and maximised-window flags;
7. terminates the local server when the browser process exits.

Because the served build and prayer engine are local, the kiosk does not require internet access for calculation and previously configured local data. Initial provisioning, OS updates, remote timetable sources or other optional network-dependent workflows remain separate concerns.

## Configuration overrides

The launcher accepts these environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SALAHOS_DIST_DIR` | repository `dist/` | Built Web/PWA directory |
| `SALAHOS_KIOSK_HOST` | `127.0.0.1` | Local HTTP bind address |
| `SALAHOS_KIOSK_PORT` | `4173` | Local HTTP port |
| `SALAHOS_KIOSK_URL` | local server root | URL Chromium opens |
| `SALAHOS_BROWSER` | auto-detected | Explicit Chromium executable |

Inspect the resolved commands without launching a browser:

```bash
bash scripts/kiosk/run-salahos-kiosk.sh --dry-run
```

## Optional automatic launch with labwc

Raspberry Pi's current kiosk guidance starts Chromium from `~/.config/labwc/autostart`. SalahOS provides an idempotent installer for that user-session configuration:

```bash
bash scripts/kiosk/install-labwc-autostart.sh
```

The installer preserves unrelated autostart entries and owns only the block between its SalahOS markers. Running it repeatedly does not duplicate the managed block.

Preview the resulting file without writing it:

```bash
bash scripts/kiosk/install-labwc-autostart.sh --dry-run
```

Remove only the managed block:

```bash
bash scripts/kiosk/install-labwc-autostart.sh --remove
```

This is **desktop-session autostart**. For unattended power-on behaviour, Raspberry Pi OS must also be configured to boot into the graphical desktop with the desired login policy. The repository does not silently change login/security policy.

## Recovery behaviour

If Chromium exits, the wrapper cleans up its local HTTP server. Starting the wrapper again reads the current built application and existing browser-local settings. The application runtime itself already recalculates from current wall time/date and has separate tested handling for page restore, sleep/wake, significant clock changes and date rollover.

Do not treat the browser process as an exact background alarm mechanism. See [Notification and Adhan platform limitations](NOTIFICATION_LIMITATIONS.md).

## Validation boundary

Repository CI validates:

- shell syntax for both scripts;
- local-server and Chromium command construction;
- invalid port rejection;
- labwc autostart installation idempotence;
- preservation of unrelated autostart commands;
- removal of only the managed block;
- the normal application test/build/deploy-artifact gates.

Still requiring Raspberry Pi hardware evidence:

- Raspberry Pi Touch Display 2 resolution/orientation and touch ergonomics;
- physical boot/login/autostart behaviour;
- Chromium rendering and GPU/display-stack behaviour on the target Pi model;
- power-loss, suspend and reboot acceptance testing;
- display brightness/burn-in strategy;
- device-specific network-loss and long-duration kiosk testing.
