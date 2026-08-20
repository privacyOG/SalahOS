# Optional local-network API

SalahOS includes an optional read-only Node service for smart-home, Home Assistant and local-display integrations. It serves the same versioned public mosque contract documented in `PUBLIC_API_INTEGRATION.md`; it is not an administration service and contains no mutation routes.

The browser/mobile prayer application remains local-first and does not start a listener itself. The local API is a separate operator-run process intended for a Raspberry Pi, kiosk host, home server or other machine you control.

## Endpoints

The service exposes only these `GET` routes:

```text
GET /api/v1/mosques/:mosqueId
GET /api/v1/mosques/:mosqueId/prayers/:date
GET /api/v1/mosques/:mosqueId/timetables/:month
GET /api/v1/mosques/:mosqueId/calendar.ics
```

Dates use `YYYY-MM-DD`; months use `YYYY-MM`. Query parameters and non-`GET` methods are rejected.

The profile and daily-prayer endpoints use a 60-second public cache lifetime with stale-while-revalidate support. Monthly timetables and calendar feeds use a 300-second public cache lifetime. Per-socket-IP request ceilings follow the SalahOS public contract: 120 profile requests/minute, 120 daily requests/minute, 60 monthly requests/minute and 60 calendar requests/minute.

## Published-data snapshot

The service reads a JSON snapshot rather than reaching into browser storage or private administration state. Copy the example and replace it with your own published mosque data:

```sh
cp local-api/public-data.example.json local-api/public-data.json
```

`local-api/public-data.json` is deployment-specific and ignored by Git. You can instead set `SALAHOS_LOCAL_API_DATA_PATH` to an absolute path.

Snapshot schema version 1 contains:

- `version: 1`;
- optional `generatedAt` ISO-8601 timestamp;
- one or more normalized mosque IDs under `mosques`;
- a public `profile` with matching `mosqueId`, name and IANA timezone;
- optional `dailyPrayers` records keyed by `YYYY-MM-DD`;
- optional `monthlyTimetables` records keyed by `YYYY-MM`;
- optional public `events` used to generate the read-only iCalendar subscription feed.

Daily records require all five obligatory prayer starts. Prayer values may use local `HH:MM`, integer local minutes, or timezone-aware ISO-8601 values. Iqamah values may also use fixed or non-negative offset rules. Monthly records contain 1 through 31 daily entries and every entry must remain inside the keyed month.

The loader recursively rejects privileged-looking fields including memberships, roles, sessions, invitations, audit records, notification device tokens, display pairing codes, private notes, private administrator contacts, administrator/device tokens, password/secret fields and credentials. A mosque ID inside a payload must match the snapshot key before the service will publish it.

## Starting safely

Default startup is loopback-only:

```sh
npm run local-api:serve
```

Defaults:

- host: `127.0.0.1`
- port: `8788`
- data: `local-api/public-data.json`

You can change the loopback port:

```sh
SALAHOS_LOCAL_API_PORT=8790 npm run local-api:serve
```

Any non-loopback bind requires an explicit second opt-in. For example, to listen on all interfaces of a host that is protected by your LAN firewall:

```sh
SALAHOS_LOCAL_API_HOST=0.0.0.0 \
SALAHOS_LOCAL_API_ALLOW_LAN=true \
npm run local-api:serve
```

Do not expose the plain HTTP listener directly to the public internet. If remote access is required, place it behind a reverse proxy or private network that supplies HTTPS and appropriate access controls. `SALAHOS_LOCAL_API_ALLOW_LAN=true` confirms only that you intentionally requested a non-loopback bind; it does not configure the host firewall for you.

The service does not trust `X-Forwarded-For`; rate limiting uses the actual TCP peer address. If you reverse-proxy it, enforce public rate limits at the proxy/edge as well.

## Updates and fail-soft behaviour

The snapshot is checked for changes on requests. Replace it atomically where possible, for example by writing a complete temporary file and renaming it into place.

A valid replacement becomes active automatically. If the current snapshot disappears or a replacement is malformed, the service retains the previous valid in-memory snapshot rather than publishing partial or invalid data. Responses then carry:

```text
X-SalahOS-Snapshot-State: stale
```

A successfully loaded snapshot reports `fresh`.

The service must start with one valid snapshot; it will fail closed at startup when the configured file is missing or invalid.

## Response hardening

JSON API responses and the `text/calendar` event feed include `nosniff`, restrictive content-security policy, frame denial and no-referrer headers. Public-resource responses include their declared cache policy. Errors do not return filesystem paths, stack traces or private state.

No cross-origin browser permission is emitted by default. Server-side Home Assistant access works without CORS. Browser-based consumers should use a same-origin reverse proxy rather than broadly enabling cross-origin access.

## Home Assistant

The Stage 37 custom integration in `integrations/home-assistant/custom_components/salahos` consumes this exact public contract. Once the local API is listening on an address Home Assistant can reach, configure the integration with the local API base URL and the published mosque ID. See `HOME_ASSISTANT.md`.

## Validation

The repository test suite verifies:

- all three JSON endpoint shapes plus the iCalendar subscription endpoint;
- declared cache and security headers;
- method/query rejection;
- last-known-good fallback after a malformed snapshot update;
- recursive privileged-field rejection;
- mosque-ID consistency;
- explicit LAN-bind opt-in; and
- per-client/resource rate limiting.

The local API is intentionally separate from `managed-service/server.mjs`. Managed-display administration remains privileged; this service publishes only explicitly provided public integration data.
