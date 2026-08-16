# Optional remote API security boundary

Core SalahOS prayer calculations, saved locations, timezone lookup and mosque timetable storage are local-first and do not require a remote API. Optional remote integrations may be added later only through the reviewed boundary in `src/platform/remoteApi.ts`.

## Required transport and origin policy

An optional remote endpoint must:

- use HTTPS;
- match an explicitly configured allowed origin;
- contain no embedded username/password credentials;
- avoid browser credential/cookie transmission;
- fail on redirects rather than silently following a request to another origin;
- suppress the browser referrer.

`secureRemoteFetch` applies these request defaults after validating the URL against the supplied allowlist.

An allowlist entry must be a bare HTTPS origin such as `https://api.example.org`; paths, query strings, fragments, HTTP origins and credential-bearing URLs are rejected.

## No implicit provider activation

The existence of the network boundary does not enable a remote provider. A future mosque/provider integration still requires:

1. a documented provider contract or authorized API;
2. explicit feature configuration;
3. a privacy review for the exact fields sent;
4. user disclosure/consent where precise location or another sensitive field is required;
5. a failure/offline path that does not break core local prayer calculations;
6. appropriate rate-limit, timeout and response-validation handling;
7. tests and updated platform/privacy documentation.

Do not scrape arbitrary websites or private endpoints through this helper.

## Precise location

Precise coordinates are privacy-relevant. The generic remote request helper deliberately does not know about location and does not automatically attach coordinates, saved-location labels or mosque selections.

A future integration that needs location must make that data flow explicit at the feature layer and follow `docs/PRIVACY_THREAT_MODEL.md`. Prefer coarse, manually selected or provider-specific identifiers when they satisfy the feature.

## Credentials and secrets

Browser/native client requests must not rely on secrets that would be exposed in the application bundle. Follow `docs/SECRETS_POLICY.md` for any credentialed integration. If a provider requires a confidential server credential, the architecture must use an appropriate trusted backend rather than embedding the secret in SalahOS.

## Repository enforcement

`npm run verify:remote-api-boundary` scans production source files and fails if a direct `fetch()` is introduced outside `src/platform/remoteApi.ts`. It also verifies that the current Web/PWA CSP `connect-src` does not broadly enable remote HTTP origins.

This verifier is part of `npm run check`. A future network integration therefore must intentionally pass through the reviewed boundary and update the policy rather than adding an unreviewed direct network call.
