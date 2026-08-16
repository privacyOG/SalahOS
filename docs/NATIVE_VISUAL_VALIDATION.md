# Native visual validation

SalahOS retains repeatable native screenshot evidence for the Android emulator and iOS/iPadOS Simulator paths. These gates exercise the packaged native shells and are separate from the shared browser visual-regression suite.

## iOS / iPadOS

The permanent `iOS Build` workflow:

1. runs the repository quality gate;
2. synchronises Capacitor assets/plugins;
3. builds the unsigned iOS Simulator application once;
4. dynamically selects one available iPhone Simulator and one available iPad Simulator;
5. cold-boots each selected Simulator;
6. installs and launches the exact built `App.app` bundle;
7. captures screenshots 5 seconds and 20 seconds after launch for both device classes;
8. parses each PNG header and requires positive, stable dimensions across the two captures for that device class;
9. retains the four PNG files as `ios-simulator-visual-<commit>` workflow evidence.

The delayed screenshot is intentional: earlier isolated acceptance proved that initial native/WebView startup timing can differ between form factors. Review should therefore inspect the settled capture and not treat a transient early frame as the only layout result.

The static `npm run verify:ios-visual-wiring` contract prevents removal of iPhone/iPad selection, cold launch, screenshot validity/dimension checks, unsigned Simulator build coupling, or retained evidence without an explicit repository change.

## Android

The permanent `Android Build` workflow uses the same Android 35 x86_64 Pixel 7 Pro emulator profile previously exercised during Android acceptance. It:

1. builds the Android debug application and runs the native build verifiers;
2. builds the unsigned Android release variant and verifies the effective merged permission allowlist for the release output as well as the existing debug output;
3. enables KVM for the hosted emulator;
4. launches a pinned Android emulator-runner revision;
5. enables airplane mode and disables Wi-Fi/mobile data;
6. installs the debug application;
7. force-stops and cold-launches the real `com.privacyog.salahos/.MainActivity` while offline;
8. requires Android Activity Manager to report a successful launch and a live SalahOS process;
9. captures cold-start portrait, landscape, and restored-portrait screenshots and verifies their PNG dimensions match the claimed orientations;
10. runs the existing app-only orientation/instrumentation acceptance;
11. retains the PNG files as `android-emulator-visual-<commit>` workflow evidence.

`npm run verify:android-emulator-wiring` locks the debug/release workflow commands, pinned emulator configuration, offline checks, instrumentation path, screenshot orientation checks, screenshot names, and artifact retention into the normal repository quality contract.

## Review criteria

For a candidate to claim native simulator/emulator layout evidence, the applicable permanent workflow must actually execute and pass on the exact candidate head, and the retained screenshots must be inspected for at least:

- a non-blank settled application frame;
- status/navigation bar or safe-area overlap;
- obvious clipping or horizontal overflow;
- portrait/landscape breakage where captured;
- readable primary prayer and settings presentation at the captured form factor.

Automated workflow success alone does not replace screenshot inspection for a visual TODO item.

## Evidence boundary

Simulator/emulator evidence does **not** prove:

- physical-device display cutouts, manufacturer overlays, colour/brightness, or font rendering;
- physical touch ergonomics;
- Android OEM battery/background behaviour;
- physical iPhone/iPad dynamic type and accessibility behavior;
- real notification delivery timing under operating-system power policies;
- App Store/Play distribution readiness;
- physical Raspberry Pi Touch Display 2 or TV rendering.

Those items remain open until their applicable environment is exercised.

**Author:** privacyOG
