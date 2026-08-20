# Web security header baseline

SalahOS is local-first. The web/PWA shell should therefore deny network and embedding capabilities by default and only open the minimum browser capabilities required by the application.

## In-document Content Security Policy

`index.html` carries a baseline `Content-Security-Policy` meta policy with these constraints:

- application scripts are same-origin only;
- styles are same-origin, with inline styles allowed because development/runtime tooling and browser rendering can require them;
- images are same-origin or `data:` by default, with exactly two reviewed HTTPS image origins for the user-initiated Qiblah map: `tile.openstreetmap.org` and `server.arcgisonline.com`;
- fonts are same-origin only;
- network connections are same-origin, with `ws:` and `wss:` retained for development-server hot reload and compatible local deployments;
- media is same-origin or `blob:` so user-selected local Adhan media can remain local;
- workers and the web manifest are same-origin only;
- plugins/objects and frames are disabled;
- document base URLs and form submission are restricted to the same origin.

The Qiblah map exception is intentionally limited to image loading. SalahOS does not grant those providers `connect-src`, script, font, worker, frame, or form capabilities. Map tiles are not requested until the user selects **Load map tiles** in the Qiblah Finder. That action necessarily discloses the requested map tiles/viewed area and normal network metadata to the selected provider, as described in `PRIVACY.md` and `docs/QIBLA_FINDER.md`.

The policy intentionally does not grant arbitrary remote HTTP origins. Any future mosque-provider, map-provider, or other remote integration must receive an explicit, narrowly scoped CSP and privacy review before its origin is added.

## Deployment headers

A CSP delivered as an HTTP response header is preferred for deployed production sites because some directives and protections cannot be fully represented by a meta policy. Production deployments should add equivalent or stricter response headers at the reverse proxy/CDN/web server. If the Qiblah map is expected to function, the response-header CSP must preserve the same two reviewed `img-src` origins or deliberately replace them with another reviewed deployment policy; a stricter same-origin-only production CSP will leave the local Qiblah bearing functional but block optional map imagery.

Recommended deployment-level controls include:

- `Content-Security-Policy` matching or tightening the in-document baseline;
- `frame-ancestors 'none'` in the response CSP unless an intentional embedding use case is approved;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy` chosen deliberately after considering third-party map-provider requirements rather than weakened globally merely to make a provider work;
- `Permissions-Policy` denying unused sensors/capabilities and allowing geolocation only where the deployed application requires it;
- HTTPS plus HSTS only after the operator confirms the hostname is permanently HTTPS-capable.

Do not add `unsafe-eval`, wildcard network sources, wildcard framing, or broad third-party script origins merely to silence a browser error. A required exception must be tied to a documented feature and reviewed against the privacy/threat model.

## Verification boundary

Repository CI can verify that the production bundle builds with the in-document baseline present and that new remote URL literals remain blocked unless their source file is explicitly reviewed by the remote-network policy. Final response-header behavior depends on the actual hosting layer and must be checked on each production deployment; this document does not claim that a particular external web server or CDN is already configured.
