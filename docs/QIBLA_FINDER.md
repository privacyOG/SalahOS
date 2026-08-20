# Qiblah Finder

The SalahOS Qiblah Finder extends the existing local Qiblah-bearing calculation into a dedicated compass and optional map experience. The core direction remains available without an account or network connection.

## Direction model

SalahOS calculates the great-circle initial bearing from the selected coordinates to the Kaaba and reports it clockwise from true north. The finder can use the saved prayer location, an explicitly requested current position, the bundled offline city catalogue, or a dropped map pin.

A location change of at least 100 metres is treated as significant for live Qiblah recalculation. This avoids needless UI churn from ordinary GPS jitter while still updating the direction during meaningful movement.

## Live compass

Where a usable orientation sensor exists, the finder compares the device heading with the true-north Qiblah bearing and provides left/right turn guidance.

The compass adapter:

- prefers a native geographic/true heading when the platform provides one;
- converts magnetic-only native or WebKit headings to true north using the WMM2025 magnetic-declination model at the selected coordinates and current date;
- compensates for the current screen-orientation angle;
- applies circular smoothing across the 0°/360° boundary;
- treats a heading within 2° of the Qiblah bearing as aligned;
- provides a light haptic/vibration cue when alignment is first reached where the platform permits it.

If the sensor is unavailable or access is denied, SalahOS keeps the numerical true-north bearing and map/manual-location paths usable. Poor sensor accuracy surfaces calibration guidance rather than pretending the heading is reliable. Magnetic cases, keyboard covers, vehicles, structural steel, speakers, chargers, and nearby electronics can disturb compass readings.

## Location behaviour

Selecting **Use current position** first requests a current high-accuracy fix and falls back to a lower-accuracy/network-assisted fix when the platform cannot supply the preferred fix. After a successful fix, the finder starts a foreground live-location watch so the bearing can follow meaningful movement. The user can stop that watch from the finder.

The live Qiblah location is not written as a route or location history. The ordinary saved prayer location remains a separate persisted setting. City search uses the bundled offline SalahOS location catalogue.

## Optional map

The map view is intentionally privacy-gated. No third-party map image request is made until the user selects **Load map tiles**.

Two narrowly reviewed image providers are currently supported:

- OpenStreetMap standard tiles;
- Esri World Imagery satellite tiles.

Enabling map tiles sends the requested tile coordinates/viewed area and normal network request metadata to the selected provider. If the map is centred on the current or manually selected location, that viewed area can reveal the approximate location area to the provider. SalahOS does not attach stored prayer settings, mosque data, prayer history, or a separate raw-coordinate payload to the tile request.

The Web/PWA Content Security Policy permits only those two map image origins for this feature. The repository remote-network policy also treats the tile URL adapter as an explicit reviewed exception; unrelated new remote URL or network capabilities still fail closed.

If tiles fail or the device is offline, the locally calculated Qiblah bearing remains available. A map pin is an optional pointer-based location-selection convenience; offline city search and the saved location remain non-map alternatives.

## Provider attribution

OpenStreetMap attribution is shown with its required copyright destination while standard tiles are active. Esri World Imagery attribution is shown in the map view when the satellite layer is active.

## Verification coverage

Stage 42 includes focused unit coverage for:

- magnetic-declination application and screen-orientation compensation;
- circular heading smoothing and alignment tolerance;
- live-location distance thresholds;
- map tile projection, wrapping, click-to-coordinate conversion, and Qiblah ray geometry;
- reviewed OpenStreetMap/Esri tile URL shapes and out-of-range request rejection;
- native true-heading preference and WMM2025 magnetic-heading conversion.

Full repository acceptance still depends on the permanent Quality Gate, Android Build, iOS Build, and applicable visual/runtime gates when the branch enters the pull-request validation path. Sensor accuracy on real hardware remains inherently device/environment dependent and must not be inferred solely from automated tests.
