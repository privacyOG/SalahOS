# Qiblah Google Maps satellite configuration

SalahOS can render the Qiblah map with Google Maps Static API satellite imagery when a build-time key is supplied. If no Google Maps key is configured, the Qiblah map uses the existing OpenStreetMap tile implementation.

## Configuration

1. Create or select a Google Cloud project with billing enabled for Google Maps Platform.
2. Enable **Maps Static API** for that project.
3. Create a dedicated API key for SalahOS Qiblah map imagery rather than reusing an unrelated application key.
4. Apply an **API restriction** that allows only **Maps Static API**.
5. Apply an appropriate **application restriction** for the deployment. For a hosted browser deployment, Google recommends a Websites restriction for Maps Static API. Test the exact production origin and any required subdomains before release.
6. Build SalahOS with the key supplied through the environment:

```bash
VITE_GOOGLE_MAPS_API_KEY='your-restricted-key' npm run build
```

The key is read only at build time. Do not add the value to source files, `.env` files committed to Git, screenshots, issue comments, or release notes.

## Important key-security boundary

`VITE_` values are compiled into the client application. A Maps Static API key used this way is therefore **not a secret** and can be observed in the generated request URL. Security depends on Google Cloud application/API restrictions, quota controls and billing alerts; it must never depend on hiding the key in the JavaScript bundle.

Browser and WebView deployments can differ in whether a useful `Referer` header is sent for cross-origin static-map requests. Before production mobile distribution, verify the chosen restriction against the packaged Android/iOS WebView. If a sufficiently restrictive client-side key cannot be made reliable for a deployment, do not ship an unrestricted key. Use a separately designed signed/proxied map request path or a native Maps SDK instead.

Google also recommends digital signatures for Maps Static API requests. A URL-signing secret is private material and must never be placed in the SalahOS client bundle. If signed requests become required, signing must occur in a trusted service that keeps the signing secret outside the application.

## Runtime behaviour

- With `VITE_GOOGLE_MAPS_API_KEY` configured, the Qiblah map requests `maptype=satellite` from Google Maps Static API.
- Without the key, SalahOS uses OpenStreetMap tiles.
- Zoom controls, dropped-pin selection, current-location marker, Qiblah bearing overlay and Kaaba context remain available with either provider.
- A provider/image failure is handled as a map-availability failure and does not affect local Qiblah bearing calculation.

## CI and visual acceptance

The Visual Regression workflow validates both provider paths without committing credentials:

- the normal production build has no Google key and exercises the OpenStreetMap fallback;
- a second visual-only build injects the fixed non-production key `salahos-visual-fixture-key` and intercepts the Google Static Maps request locally;
- the fixture asserts that Google satellite mode is selected, the request uses `maptype=satellite`, and the bearing/user/Kaaba overlays remain present.

The visual fixture key is deliberately not a usable production credential.

## References

- Google Maps Static API: https://developers.google.com/maps/documentation/maps-static/start
- Google Maps Platform API security guidance: https://developers.google.com/maps/api-security-best-practices
- Google Maps digital signature guidance: https://developers.google.com/maps/digital-signature
