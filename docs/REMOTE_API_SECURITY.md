# Optional remote API security boundary

Core SalahOS prayer calculations, saved locations, timezone lookup and mosque timetable storage are local-first and do not require a remote API. Optional remote integrations may be added later only through the reviewed boundary in `src/platform/remoteApi.ts`.

## Required transport and origin policy

An optional remote endpoint must:

- use HTTPS;
- match an explicitly configured exact allowed origin;
- contain no embedded username/password credentials;
- contain no URL fragment;
- avoid browser credential/cookie transmission;
- avoid manually supplied credential-bearing headers such as `Authorization`, `Cookie`, `Proxy-Authorization` or `X-Api-Key`;
- fail on redirects rather than silently following a request to another origin;
- suppress the browser referrer;
- use CORS mode;
- bypass the browser HTTP cache with `cache: 'no-store'`.

`secureRemoteFetch` enforces these request properties after validating the URL against the supplied allowlist. Callers cannot weaken them through `RequestInit`.

An allowlist entry must be a bare HTTPS origin such as `https://api.example.org`; paths, query strings, fragments, HTTP origins and credential-bearing URLs are rejected. Exact `URL.origin` matching is used, so a sibling or attacker-controlled subdomain is not implicitly trusted.

## No implicit provider activation

The existence of the network boundary does not enable a remote provider. A future mosque/provider integration still requires:

1. a documented provider contract or authorized API;
2. explicit feature configuration;
3. a privacy review for the exact fields sent;
4. user disclosure/consent where precise location or another sensitive field is required;
5. a failure/offline path that does not break core local prayer calculations;
6. appropriate rate-limit, timeout and response-validation handling;
7. tests and updated platform/privacy documentation;
8. an intentional CSP `connect-src` update limited to the reviewed provider origin.

Do not scrape arbitrary websites or private endpoints through this helper.

## Precise location

Precise coordinates are privacy-relevant. The generic remote request helper deliberately does not know about location and does not automatically attach coordinates, saved-location labels or mosque selections.

A future integration that needs location must make that data flow explicit at the feature layer and follow `docs/PRIVACY_THREAT_MODEL.md`. Prefer coarse, manually selected or provider-specific identifiers when they satisfy the feature.

## Credentials and secrets

Browser/native client requests must not rely on secrets that would be exposed in the application bundle. Follow `docs/SECRETS_POLICY.md` for any credentialed integration. If a provider requires a confidential server credential, the architecture must use an appropriate trusted backend rather than embedding the secret in SalahOS.

The generic remote wrapper therefore rejects common credential-bearing request headers. A future authenticated public-client protocol would require a separate reviewed design rather than quietly relaxing this boundary.

## Repository enforcement

`npm run verify:remote-api-boundary` scans production source and:

- permits direct `fetch()` only inside `src/platform/remoteApi.ts`;
- rejects production `XMLHttpRequest`, WebSocket, EventSource and `navigator.sendBeacon` paths;
- verifies that the current Web/PWA CSP contains `connect-src 'self'` and does not broadly enable remote HTTP origins.

The current CSP intentionally prevents optional remote providers from operating until a provider is explicitly approved and added to the CSP. The existence of `secureRemoteFetch` alone does not create network access.

This verifier is part of `npm run check`. A future network integration therefore must intentionally pass through the reviewed boundary and update the policy/CSP rather than adding an unreviewed direct network call.
