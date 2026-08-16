# Raspberry Pi Touch Display 2 setup

This guide documents the supported SalahOS setup path for Raspberry Pi Touch Display 2 using current Raspberry Pi documentation. Repository validation covers configuration/documentation consistency and the shared Web/PWA/kiosk software; physical display acceptance remains a separate tracker item.

## Supported display variants and layout constraints

Touch Display 2 is currently available in 5-inch, 7-inch and 10-inch versions.

| Variant | Native resolution | Default format | Touch capability       |
| ------- | ----------------- | -------------- | ---------------------- |
| 5-inch  | 720 × 1280        | Portrait       | Five-finger multitouch |
| 7-inch  | 720 × 1280        | Portrait       | Five-finger multitouch |
| 10-inch | 1200 × 1920       | Portrait       | Ten-finger multitouch  |

The 5-inch and 7-inch displays therefore need a portrait layout that remains usable at a 720-pixel logical horizontal resolution. Landscape rotation swaps the practical width/height constraints, so SalahOS visual acceptance must cover both portrait and landscape separately rather than assuming a desktop-sized viewport.

The display provides mouse-equivalent touch interaction and Raspberry Pi OS supports an on-screen keyboard, so kiosk controls must remain touch-sized and must not require hover-only interaction.

Official reference:

- https://www.raspberrypi.com/documentation/accessories/touch-display-2.html

## Raspberry Pi compatibility

For the 5-inch and 7-inch variants, Raspberry Pi documentation lists Raspberry Pi B+ and later plus Compute Module IO boards as supported. Raspberry Pi Zero-series and Raspberry Pi Keyboard computers are incompatible because they do not provide the required DSI connection.

The 10-inch compatibility matrix differs from the smaller variants. Check the current Raspberry Pi compatibility table before selecting a board/display combination, especially for Raspberry Pi 4 or Compute Module installations.

SBC-form-factor Raspberry Pi boards can be mounted to the rear of Touch Display 2 where supported by the display hardware.

## Cable and power connection

Power the Raspberry Pi down before connecting the display.

For 5-inch and 7-inch Touch Display 2:

- Raspberry Pi 5 and later use the supplied 22-way to 15-way Standard–Mini FFC.
- Raspberry Pi 4 and earlier use the supplied 15-way to 15-way FFC.
- The supplied GPIO power cable powers the display from the Raspberry Pi GPIO header.

For the 10-inch Touch Display 2, use the cable/connector arrangement specified by the current Raspberry Pi documentation for the selected host board rather than substituting the smaller-display cable instructions.

Connect the FFC carefully with the connector latches released, seat it squarely, close the latches, connect the display power lead as documented for the model, then restore Raspberry Pi power.

Standard Raspberry Pi Model B+ and later boards auto-detect Touch Display 2. Compute Module deployments require additional DSI configuration and are outside the default SBC kiosk path.

## Install Raspberry Pi OS

SalahOS kiosk deployment targets Raspberry Pi OS Desktop because the validated path uses Chromium and the graphical `labwc` session.

Raspberry Pi recommends installing Raspberry Pi OS using Raspberry Pi Imager.

1. Install Raspberry Pi Imager on a Windows, macOS or Linux computer. On Raspberry Pi OS itself, `sudo apt install rpi-imager` is also supported.
2. Open Imager and select the exact Raspberry Pi model under **Device**.
3. Select the recommended Raspberry Pi OS Desktop image for that model under **OS**.
4. Select the intended microSD card or other supported boot storage under **Storage**. Verify the device carefully because imaging overwrites the selected storage.
5. Use OS customisation to configure the required user credentials, locale/timezone, network and remote-access choices before writing the image where appropriate.
6. Write and verify the image.
7. Insert/connect the boot media to the powered-off Raspberry Pi.
8. Connect Touch Display 2 and any required peripherals while power is removed.
9. Power on and complete any remaining first-boot configuration.
10. Apply Raspberry Pi OS updates before deploying SalahOS.

Official references:

- https://www.raspberrypi.com/documentation/computers/getting-started.html
- https://www.raspberrypi.com/documentation/computers/os.html

The current Raspberry Pi OS release is based on Debian Trixie. Do not hard-code a Debian release into deployment scripts; use the Raspberry Pi OS image currently recommended for the selected board by Imager.

## Verify display and touch before kiosk deployment

Before installing SalahOS kiosk autostart:

1. Confirm the desktop fills the full native panel.
2. Confirm touch points track the finger correctly across all edges.
3. Confirm scrolling and long-press interaction work.
4. Confirm the on-screen keyboard appears for text entry if it is required by the deployment.
5. Set the desired orientation and confirm touch still follows the rotated display.
6. Set an appropriate brightness for the installation environment.

Raspberry Pi OS Bookworm and later include the Squeekboard on-screen keyboard. On current Desktop releases it can be controlled through **Preferences → Control Centre → Display**, or through the Display section of `raspi-config` where applicable.

## Orientation

The documented orientations are:

- **Normal** — default portrait orientation.
- **Left** — 90° clockwise.
- **Inverted** — 180°.
- **Right** — 270° clockwise.

On Raspberry Pi OS Desktop:

1. Open **Preferences → Control Centre → Screens**.
2. Select/right-click the Touch Display 2 output, commonly labelled `DSI-1`.
3. Select **Orientation**.
4. Choose Normal, Left, Inverted or Right.
5. Apply and confirm the change.

Desktop orientation is preferred for the SalahOS Chromium kiosk path because the graphical environment coordinates display and touch transformation.

For Raspberry Pi OS Lite/console deployments, Raspberry Pi documents rotation through `/boot/firmware/cmdline.txt`, for example for a 5-inch/7-inch DSI-1 console:

```text
video=DSI-1:720x1280@60,rotate=<0|90|180|270>
```

That kernel setting rotates the text-mode console and is not a substitute for testing the graphical Chromium kiosk. Non-desktop touch-axis overrides may also require the model-specific Device Tree overlay and `invx`, `invy` or `swapxy`; do not apply those overrides to the normal Desktop path unless the physical installation actually requires them.

## Brightness

On the Raspberry Pi Desktop, brightness can be adjusted from **Preferences → Control Centre → Screens**, selecting the Touch Display 2 and choosing **Brightness**. Kiosk deployments should use the lowest comfortable level for the environment and should still be assessed for long-duration/static-display behaviour on real hardware.

## Deploy SalahOS

After the display and desktop are working correctly, build SalahOS and use the validated kiosk path in [Raspberry Pi kiosk deployment](RASPBERRY_PI_KIOSK.md).

At minimum, the build/deployment flow is:

```bash
npm ci --ignore-scripts
npm run check
npm run build
bash scripts/kiosk/run-salahos-kiosk.sh --dry-run
bash scripts/kiosk/run-salahos-kiosk.sh
```

For optional desktop-session autostart:

```bash
bash scripts/kiosk/install-labwc-autostart.sh
```

That installer manages session autostart only. An unattended appliance must separately configure and validate the Raspberry Pi OS graphical boot/login policy appropriate to the installation.

## Acceptance matrix still requiring hardware

Repository CI cannot close these checks:

- physical 5-inch/7-inch/10-inch rendering at native resolution;
- Touch Display 2 portrait and landscape visual layout;
- touch-target ergonomics and on-screen keyboard interaction;
- cable/power reliability on the selected Raspberry Pi model;
- graphical login plus kiosk autostart after cold boot;
- suspend/resume and power-loss/reboot behaviour;
- brightness, thermals and long-duration static-display behaviour;
- real network-loss/recovery behaviour on the deployed device.

Keep those tracker items open until evidence is recorded from the actual target hardware.
