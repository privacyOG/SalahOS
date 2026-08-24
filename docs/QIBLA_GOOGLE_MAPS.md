# Qiblah Google Maps configuration

SalahOS uses Google Maps JavaScript API as the primary interactive map provider for Qiblah. The map opens in Satellite mode and also provides Map and Hybrid modes. It draws a geodesic route from the selected/current location to the Kaaba and keeps both locations represented on the map.

OpenStreetMap is no longer used by the Qiblah map. If Google Maps is not configured or fails to load, SalahOS falls back to a local, network-free bearing surface so the calculated Qiblah direction and manual pin selection remain usable.

## Configuration

1. Create or select a Google Cloud project with billing enabled for Google Maps Platform.
2. Enable **Maps JavaScript API** for that project.
3. Create a dedicated API key for the SalahOS Qiblah map rather than reusing an unrelated key.
4. Apply an **API restriction** that allows only **Maps JavaScript API**.
5. Apply appropriate application restrictions. Hosted browser deployments should use website/referrer restrictions for the production origin and required subdomains. Validate the exact Android/iOS WebView behaviour before public mobile distribution.
6. Configure quota limits and billing alerts in Google Cloud.
7. Build SalahOS with the key supplied through the environment:

```bash
VITE_GOOGLE_MAPS_API_KEY='your-restricted-key' npm run build
```

The key is read at build time. Do not add a production value to source files, committed `.env` files, screenshots, issue comments or release notes.

## Client-key security boundary

`VITE_` values are compiled into the client application. A Maps JavaScript API key used this way is therefore **not a secret**. Security must come from Google Cloud application/API restrictions, quotas and billing controls rather than attempting to hide the key in the JavaScript bundle.

Browser and packaged WebView deployments can differ in origin/referrer behaviour. Before production Android/iOS distribution, verify the chosen key restrictions against the packaged application. Do not ship an unrestricted production key merely to make a WebView work. If client restrictions cannot satisfy the deployment model, use a separately designed native Maps SDK or another appropriately restricted provider integration.

## Runtime behaviour

- Google Maps JavaScript API is loaded only when the Qiblah Map view is opened in a build that has `VITE_GOOGLE_MAPS_API_KEY` configured.
- Satellite is the default mode. Users can switch between Map, Satellite and Hybrid without recreating their Qiblah location.
- The Google map contains a current/selected-location marker and a Kaaba marker.
- A geodesic location-to-Kaaba polyline is rendered with a thick white contrast halo. Roadmap uses a strong blue route, Satellite/Hybrid use red, and live Qiblah alignment changes the route to green.
- **Show full Qiblah route** refits the map to the location-to-Kaaba path after the user has panned or zoomed.
- Clicking the Google map selects that geographic coordinate as the manual Qiblah pin.
- Zoom controls remain synchronized with the map while normal touch/mouse map gestures continue to work.
- If the Google script is unavailable, blocked or misconfigured, the app shows a retry action and switches to a local network-free bearing surface. The local surface still accepts a manual pin and never affects the underlying local Qiblah calculation.

## Privacy

Opening the Google Maps view sends normal map/network requests to Google and can reveal the viewed area and approximate user location to that provider. SalahOS does not attach saved mosque records, prayer settings or unrelated application data to those requests. The Compass view and local provider-error fallback continue to calculate Qiblah on-device without Google Maps traffic.

## CI and visual acceptance

The Visual Regression workflow validates the interactive provider without storing a Google credential. A visual-only production build injects the fixed non-production key `salahos-visual-fixture-key`, intercepts the Maps JavaScript API request locally, and supplies a deterministic map API fixture.

The fixture verifies:

- Satellite is the default Google mode and Map/Satellite/Hybrid switching works;
- the user and Kaaba markers are created;
- the route is geodesic, thick and uses the expected blue/red contrast styling plus a white halo;
- **Show full Qiblah route** refits the route;
- map clicks preserve manual pin selection;
- Google load failure activates the local fallback and retry action;
- the map does not introduce horizontal overflow on the phone acceptance viewport.

The visual fixture key is deliberately not a usable production credential.

## References

- Google Maps JavaScript API loading: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
- Google Maps map types: https://developers.google.com/maps/documentation/javascript/maptypes
- Google Maps API security guidance: https://developers.google.com/maps/api-security-best-practices
