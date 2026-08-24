# Web security header baseline

SalahOS is local-first. The web/PWA shell denies network and embedding capabilities by default and opens only reviewed browser capabilities required by implemented features.

## In-document Content Security Policy

`index.html` carries the repository baseline `Content-Security-Policy` meta policy. Application resources remain same-origin by default, with two reviewed remote feature exceptions: prayer-board weather and the optional Google Maps Qiblah view.

The Google Maps JavaScript API requires more than an image-source exception. The current allowlist-style policy permits the documented Google Maps bootstrap/runtime domains for scripts, images, connections, fonts and map-owned frames. It also permits `unsafe-eval` because Google's allowlist CSP guidance for the Maps JavaScript API requires it for that integration model. The application does not add `unsafe-inline` to `script-src`.

The Google allowance is feature-specific:

- `script-src` allows `maps.googleapis.com` and `maps.gstatic.com` in addition to the application origin;
- `img-src` allows Google Maps API/static/tile image domains and `data:`;
- `connect-src` allows Google Maps API/runtime domains in addition to the reviewed Open-Meteo weather endpoint and local/dev WebSocket support;
- `font-src` allows `fonts.gstatic.com` and `style-src` allows `fonts.googleapis.com` for map runtime assets;
- `frame-src` permits Google-owned frames needed by the Maps JavaScript runtime;
- `worker-src` permits `blob:` in addition to same-origin workers.

OpenStreetMap is not present in the Qiblah CSP path and is no longer used by the Qiblah map.

The map provider is loaded only from the reviewed `src/platform/qiblaGoogleMaps.ts` adapter when a deployment has configured a restricted `VITE_GOOGLE_MAPS_API_KEY` and the Map view is opened. If the provider is blocked by CSP or unavailable, local Qiblah bearing and the network-free map fallback remain functional.

Google recommends a nonce-based strict CSP as the stronger production model. SalahOS currently keeps an allowlist CSP because the repository shell is static and does not yet issue per-response nonces. A deployment that can generate nonces should prefer Google's strict-CSP integration rather than broadening the allowlist further.

## Deployment headers

A CSP delivered as an HTTP response header is preferred for deployed production sites because some directives and protections cannot be fully represented by a meta policy. Production deployments should add equivalent or stricter response headers at the reverse proxy/CDN/web server.

If Google Maps is expected to function, the response-header CSP must preserve the documented Google Maps domains and runtime requirements. A stricter same-origin-only production CSP is valid, but it will intentionally disable Google Maps and leave SalahOS on its local Qiblah fallback.

Recommended deployment-level controls include:

- `Content-Security-Policy` matching or tightening the in-document baseline;
- a nonce-based strict Maps-compatible CSP where the deployment can issue per-response nonces;
- `frame-ancestors 'none'` in the response CSP unless an intentional embedding use case is approved;
- `X-Content-Type-Options: nosniff`;
- a deliberate `Referrer-Policy` compatible with the restricted Google Maps client-key model;
- `Permissions-Policy` denying unused sensors/capabilities and allowing geolocation only where the deployed application requires it;
- HTTPS plus HSTS only after the operator confirms the hostname is permanently HTTPS-capable.

Do not add unrestricted Google API keys, wildcard third-party script origins, wildcard framing, or unrelated network sources merely to silence a browser error. Any further exception must be tied to a documented feature and reviewed against the privacy/threat model.

## Verification boundary

Repository CI verifies that the production bundle builds with the in-document baseline present and that new remote URL literals remain blocked unless their source file is explicitly reviewed by the remote-network policy. The Google Maps visual fixture intercepts the Maps JavaScript request locally, so CI does not depend on a production credential or external Google availability.

Final response-header behavior still depends on the actual hosting layer and must be checked on each production deployment; this document does not claim that a particular external web server or CDN is already configured.
