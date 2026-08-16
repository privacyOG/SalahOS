# Web security header baseline

SalahOS is local-first. The web/PWA shell should therefore deny network and embedding capabilities by default and only open the minimum browser capabilities required by the application.

## In-document Content Security Policy

`index.html` carries a baseline `Content-Security-Policy` meta policy with these constraints:

- application scripts are same-origin only;
- styles are same-origin, with inline styles allowed because development/runtime tooling and browser rendering can require them;
- images are same-origin or `data:`;
- fonts are same-origin only;
- network connections are same-origin by default;
- development WebSocket access is limited to `ws://localhost:*` and `ws://127.0.0.1:*` for local hot reload rather than enabling scheme-wide `ws:` or `wss:` access;
- media is same-origin or `blob:` so user-selected local Adhan media remains device-local;
- workers and the web manifest are same-origin only;
- plugins/objects and frames are disabled;
- document base URLs and form submission are restricted to the same origin.

The policy intentionally does not grant arbitrary remote HTTP or WebSocket origins. Any future mosque-provider or other remote integration must receive an explicit, narrowly scoped CSP review before its exact origin is added. A development session reached through a non-loopback LAN hostname may require an intentional local CSP adjustment for that development environment; production policy must not be broadened merely to preserve generic hot reload.

## Deployment headers

A CSP delivered as an HTTP response header is preferred for deployed production sites because some directives and protections cannot be fully represented by a meta policy. Production deployments should add equivalent or stricter response headers at the reverse proxy/CDN/web server.

Recommended deployment-level controls include:

- `Content-Security-Policy` matching or tightening the in-document baseline;
- `frame-ancestors 'none'` in the response CSP unless an intentional embedding use case is approved;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer` or another deliberately reviewed restrictive policy;
- `Permissions-Policy` denying unused sensors/capabilities and allowing geolocation only where the deployed application requires it;
- HTTPS plus HSTS only after the operator confirms the hostname is permanently HTTPS-capable.

Do not add `unsafe-eval`, wildcard network sources, scheme-wide WebSocket sources, wildcard framing, or broad third-party script origins merely to silence a browser error. A required exception must be tied to a documented feature and reviewed against the privacy/threat model.

## Verification boundary

Repository CI verifies that the in-document CSP retains the reviewed `connect-src` boundary in addition to the production bundle checks. Final response-header behavior depends on the actual hosting layer and must be checked on each production deployment; this document does not claim that a particular external web server or CDN is already configured.
