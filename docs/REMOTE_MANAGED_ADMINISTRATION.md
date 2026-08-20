# Remote administration for managed mosque displays

**Author:** privacyOG

## Scope

SalahOS provides an **optional** managed-display service for mosques that need to enroll, monitor, configure and revoke dedicated prayer displays from another device.

The managed service is not required for personal prayer use. Prayer calculation, local mosque timetables, saved locations, notifications and offline smart-display rendering remain account-free and local-first when remote management is not configured.

Stage 36 adds a self-hostable reference service, a reviewed HTTPS client adapter, a browser administration surface and a display-side polling/heartbeat client.

## Security boundary

Ordinary SalahOS application code remains prohibited from arbitrary network access by `scripts/check-remote-network-policy.mjs`.

The only reviewed application source file allowed to perform remote network I/O is:

```text
src/platform/managedAdminTransport.ts
```

The policy regression suite creates a temporary unapproved source file containing `fetch()` and proves the quality gate rejects it. This makes remote management an explicit audited exception rather than a general weakening of the local-first rule.

## Service deployment

The reference service uses only Node.js built-in modules and is started with:

```bash
SALAHOS_ADMIN_TOKEN='<long-random-admin-token>' \
SALAHOS_MANAGED_STATE_PATH='/var/lib/salahos/managed-admin.json' \
SALAHOS_MANAGED_HOST='127.0.0.1' \
SALAHOS_MANAGED_PORT='8787' \
npm run managed-admin:serve
```

For non-loopback access, place the service behind a TLS reverse proxy and expose it over HTTPS. Browser administration may optionally set one exact permitted origin:

```bash
SALAHOS_ADMIN_ORIGIN='https://admin.example.org'
```

Do not commit the admin token, state file or generated device credentials. The default repository-local runtime state directory is ignored by Git.

## Authentication

Two credential classes are deliberately separate.

### Administrator credential

`SALAHOS_ADMIN_TOKEN` authenticates fleet-administration endpoints. It is supplied through the service environment, never stored in the repository.

The browser administration panel keeps the service URL and admin token in React memory only. It does not write them to SalahOS application storage.

### Per-display credential

When an administrator enrolls a display, the service generates a cryptographically random device credential and returns it once. The service persists only its SHA-256 digest.

The administrator copies the one-time credential to that physical display using the local **Managed display connection** settings surface. The display stores the revocable credential in its own SalahOS application storage so unattended kiosk restart can reconnect. On Android the key is included in the native Preferences hydration allow-list.

A device credential must never be placed in a URL, screenshot, public support bundle or shared configuration file.

## HTTP API

### Administrator endpoints

All require `Authorization: Bearer <admin token>`.

- `GET /v1/admin/displays` — list normalized fleet status.
- `POST /v1/admin/displays` — enroll one stable display identity and return its one-time device credential.
- `PUT /v1/admin/displays/:displayId/config` — publish a higher remote configuration revision using optimistic `expectedRevision` protection.
- `POST /v1/admin/displays/:displayId/revoke` — revoke the display.

### Display endpoints

All require the enrolled per-display bearer credential.

- `GET /v1/device/config?displayId=...` — read assigned remote configuration.
- `POST /v1/device/heartbeat` — report application version, applied content revision and UTC observation time.

The service also exposes unauthenticated `GET /health` for deployment health checks.

## Revision and conflict semantics

Remote configuration changes are revisioned. A write names both:

- `expectedRevision` — the revision the administrator read;
- `contentRevision` — the new strictly higher revision.

If another administrator has already advanced the display, the service returns HTTP 409 rather than silently overwriting the newer state.

The current administration UI changes the smart-display theme and advances the revision while retaining the display's existing playlist metadata. Playlist publication remains part of the existing signage/fleet model and can be expanded independently.

## Fleet health

The managed service derives display health from the last authenticated heartbeat:

- `current` — recently seen and reporting the target revision;
- `syncing` — recently seen but behind the target revision;
- `stale` — last heartbeat is older than two minutes;
- `offline` — never seen or older than ten minutes;
- `revoked` — explicitly disabled by an administrator.

The fleet UI displays these states together with last-seen time, app version, reported revision and target revision.

## Smart-display runtime

A configured smart display polls the service immediately and every 60 seconds.

When a valid configuration is received, the display applies its assigned managed theme and heartbeats the applied revision. The managed theme is scoped with CSS custom properties so prayer logic and source provenance are unchanged.

Remote synchronization is fail-soft:

- if the service is unreachable, the screen continues rendering cached/local prayer data;
- the last successfully applied managed theme remains visible;
- the screen shows a small `Managed · offline cache` status rather than blanking or blocking prayer content;
- revocation is surfaced explicitly.

## State persistence

The service persists a versioned JSON state file using an atomic temporary-file rename. Parent directories are created mode `0700`; the state file is written mode `0600`.

The state includes display identities, hashed device credentials, heartbeat metadata and remote configuration. Plaintext device credentials are never written to the service state file.

## Request hardening

The reference service includes:

- 64 KiB request-body limit;
- per-address in-memory rate limiting;
- exact optional CORS origin;
- no-store responses;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- constant-time credential comparisons when lengths match;
- strict JSON and stable-identifier validation;
- no credential-bearing URLs.

A production deployment should additionally use a TLS reverse proxy, operating-system service sandboxing, firewall rules, backups for the state file and external monitoring appropriate to the deployment.

## Boundaries

This implementation provides functional remote fleet administration without making the managed service a prerequisite for SalahOS. It does not turn the managed service into a general-purpose cloud account system, payment service, unrestricted remote shell or arbitrary code-execution channel.

Remote configuration is intentionally constrained to typed SalahOS display settings. The service never accepts arbitrary HTML, JavaScript, CSS or shell commands.
