# Qiblah Finder

The SalahOS Qiblah Finder extends the local Qiblah-bearing calculation into a dedicated live compass and interactive map experience. Core direction calculation remains available without an account or network connection.

## Direction model

SalahOS calculates the great-circle initial bearing from the selected coordinates to the Kaaba and reports it clockwise from true north. The finder can use the live device position, saved prayer location, bundled offline city catalogue or a dropped map pin.

A live-location change of at least 100 metres is treated as significant for Qiblah recalculation. This avoids needless UI churn from ordinary GPS jitter while still updating the direction during meaningful movement.

## Live compass

After first-run permission onboarding is complete, opening Qiblah automatically requests the best foreground location the OS can provide and automatically starts true-heading updates when a usable compass is available. Saved/manual location remains available when live location cannot be obtained.

The compass adapter:

- prefers a native geographic/true heading when the platform provides one;
- converts magnetic-only native or WebKit headings to true north using the WMM2025 magnetic-declination model at the selected coordinates and current date;
- compensates for the current screen-orientation angle;
- applies circular smoothing across the 0°/360° boundary;
- treats a heading within 2° of the Qiblah bearing as aligned;
- provides a light haptic/vibration cue when alignment is first reached where the platform permits it.

If the sensor is unavailable or access is denied, SalahOS keeps the numerical true-north bearing and map/manual-location paths usable. A known heading accuracy above 20° triggers the guided recalibration offer. The manual **Recalibrate compass** action is also available while compass guidance is usable. Recalibration restarts the heading session, guides the user through figure-8 motion and automatically reassesses fresh accuracy readings; SalahOS does not claim to directly calibrate hardware that the OS does not expose for programmatic calibration.

## Location behaviour

A current-position request first asks for a high-accuracy fix and falls back to a lower-accuracy/network-assisted fix when the platform cannot supply the preferred result. After a successful fix, the finder starts a foreground live-location watch so the bearing can follow meaningful movement. The user can stop that watch from the finder.

The live Qiblah location is not stored as a route or location history. The ordinary saved prayer location remains a separate persisted setting. City search uses the bundled offline SalahOS location catalogue.

## Google Maps view

Google Maps JavaScript API is the primary interactive Qiblah map provider when a restricted `VITE_GOOGLE_MAPS_API_KEY` is configured. OpenStreetMap is not used by the Qiblah map.

The map:

- opens in Satellite mode and offers Map, Satellite and Hybrid modes;
- places the current/selected location and the Kaaba on the geographic map;
- draws a geodesic location-to-Kaaba route with a thick white contrast halo;
- uses blue route styling on Map, red on Satellite/Hybrid and green while the live compass is aligned;
- provides **Show full Qiblah route** to refit both endpoints after panning or zooming;
- supports normal touch/mouse map gestures plus SalahOS zoom controls;
- converts Google map clicks directly into a manual Qiblah-location pin.

Opening the Google Maps view sends normal map/network traffic to Google and can reveal the viewed area and approximate device location to that provider. SalahOS does not attach saved mosque records, prayer settings, prayer history or unrelated application data to those requests.

If the Google API is unconfigured, blocked, offline or otherwise fails, SalahOS shows a retry path and switches to a local network-free bearing surface. The local fallback still supports manual pin selection and does not affect the underlying local Qiblah calculation.

Production key setup, API restrictions and WebView deployment considerations are documented in `QIBLA_GOOGLE_MAPS.md`.

## Verification coverage

Automated coverage includes:

- magnetic-declination application and screen-orientation compensation;
- circular heading smoothing and alignment tolerance;
- automatic live-location and true-heading startup plus saved/manual fallback;
- compass recalibration threshold, guided/manual recalibration and denied/unsupported-device behaviour;
- live-location distance thresholds and map click-to-coordinate projection;
- Google Maps JavaScript API URL construction and route-colour/weight policy;
- deterministic visual acceptance for interactive Map/Satellite/Hybrid switching, user/Kaaba markers, geodesic route styling, full-route fitting, manual Google-map pin selection and Google-provider-error fallback.

Full repository acceptance remains subject to the permanent Quality Gate, Visual Regression, Android Build/emulator acceptance and iOS Simulator acceptance. Sensor accuracy on real hardware remains inherently device/environment dependent and must not be inferred solely from automated tests.
