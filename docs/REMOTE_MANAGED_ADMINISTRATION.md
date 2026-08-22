# Remote administration for managed mosque displays

**Author:** privacyOG

## Scope

SalahOS provides an **optional** managed-display service for mosques that need to enroll, monitor, configure and revoke dedicated prayer displays from another device.

The managed service is not required for personal prayer use. Prayer calculation, local mosque timetables, saved locations, notifications and offline smart-display rendering remain account-free and local-first when remote management is not configured.

Stage 36 adds a self-hostable reference service, a reviewed HTTPS client adapter, a browser administration surface and a display-side polling/heartbeat client. Stage 23.10 extends that channel with revisioned prayer-board assignment, mosque-level defaults, per-display overrides, exact-target preview and display-side last-known-good configuration caching.

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

The administrator copies the one-time credential to that physical display using the local **Managed display connection** settings surface. The display stores the revocable credential in its own SalahOS application storage so unattended kiosk restart can reconnect. On Android the managed connection key and the managed prayer-board last-known-good cache key are included in the native Preferences hydration allow-list.

A device credential must never be placed in a URL, screenshot, public support bundle or shared configuration file.

## HTTP API

### Administrator endpoints

All require `Authorization: Bearer <admin token>`.

- `GET /v1/admin/displays` — list normalized fleet status, effective prayer-board configuration, assignment source and last-applied template information.
- `GET /v1/admin/mosque-defaults` — list revisioned mosque-level prayer-board defaults.
- `POST /v1/admin/displays` — enroll one stable display identity and return its one-time device credential.
- `PUT /v1/admin/displays/:displayId/config` — publish a higher remote configuration revision using optimistic `expectedRevision` protection; a prayer-board object creates a display override, `null` clears the override and omission preserves legacy compatibility.
- `PUT /v1/admin/mosques/:mosqueId/prayer-board-default` — publish a higher mosque-default prayer-board revision using optimistic revision protection.
- `POST /v1/admin/displays/:displayId/revoke` — revoke the display.

### Display endpoints

All require the enrolled per-display bearer credential.

- `GET /v1/device/config?displayId=...` — read the effective revisioned remote configuration, including the complete prayer-board configuration and assignment source.
- `POST /v1/device/heartbeat` — report application version, applied content revision, applied prayer-board template identifier and UTC observation time.

The service also exposes unauthenticated `GET /health` for deployment health checks.

## Prayer-board assignment semantics

The effective prayer-board assignment is resolved in this order:

1. compatible per-display override;
2. compatible mosque default;
3. deterministic service default.

The administrator can therefore publish one mosque-wide default while retaining explicit overrides for individual displays. Clearing a display override makes that display inherit the latest compatible mosque default again.

The effective configuration contains the stable template identifier and the full validated `PrayerBoardTemplateConfig`. Legacy remote configurations that predate Stage 23.10 are migrated safely to Heritage Classic using the former smart-display theme only as an accent hint.

Device-local logo and custom/local background references are not accepted as remotely portable media. Before managed preview/publication, the configuration keeps the normalized mosque name, clears the device-local logo and replaces non-portable backgrounds with the selected template's deterministic built-in artwork. Remote media synchronization can therefore fail without making the authoritative prayer board unusable.

## Exact target preview and publication

Stage 23.10 validates the managed target before publication. The current managed publication path accepts the exact landscape TV/kiosk targets that have permanent prayer-board acceptance coverage:

- `1920×1080`;
- `3840×2160`.

Legacy `tv-16x9`/`tv-1080p` and `tv-4k` profiles resolve to those exact dimensions. Portrait, Touch Display and other unvalidated managed targets are rejected for this publication flow rather than being silently stretched.

The administration surface renders the real `PrayerBoardRenderer` inside a fixed-pixel target canvas scaled to the browser viewport. Publication remains disabled until the current draft/configuration fingerprint has been previewed at the selected display's exact resolution and orientation.

## Revision and conflict semantics

Remote configuration changes are revisioned. A display write names both:

- `expectedRevision` — the revision the administrator read;
- `contentRevision` — the new strictly higher revision.

Mosque-default writes similarly name an expected mosque-default revision and a strictly higher replacement revision.

If another administrator has already advanced the relevant configuration, the service returns HTTP 409 rather than silently overwriting newer state.

The administration UI publishes the complete prayer-board configuration together with the display's existing playlist/theme metadata. Playlist publication remains part of the existing signage/fleet model and can be expanded independently.

## Fleet health and applied configuration

The managed service derives display health from the last authenticated heartbeat:

- `current` — recently seen and reporting the target revision;
- `syncing` — recently seen but behind the target revision;
- `stale` — last heartbeat is older than two minutes;
- `offline` — never seen or older than ten minutes;
- `revoked` — explicitly disabled by an administrator.

The fleet UI displays these states together with last-seen time, app version, reported revision, target revision, effective template, assignment source and the template identifier actually reported as applied by the display. This makes a configured target distinguishable from what the physical display last confirmed it rendered.

## Smart-display runtime

A configured smart display polls the service immediately and every 60 seconds.

When a valid configuration is received, the display reconciles it with its last-known-good managed prayer-board cache. A newer remote revision is validated, cached and applied; a newer local cached revision is retained; equal matching revisions remain in place; and an equal-revision configuration mismatch is treated as a conflict instead of replacing known-good state silently.

After applying or retaining the appropriate configuration, the display heartbeats the actual applied revision and template identifier. The prayer board remains presentation-only: local prayer calculation, selected prayer source, Iqamah values and next-prayer semantics are not delegated to the remote service.

Remote synchronization is fail-soft:

- if the service is unreachable, the screen continues rendering local prayer data;
- the last successfully applied managed prayer-board configuration remains available from the native-persisted last-known-good cache;
- the screen shows a small `Managed · offline cache` status rather than blanking or blocking prayer content;
- optional remote theme/media failure does not interrupt the built-in prayer board;
- reconnect reconciliation happens independently of local prayer calculation;
- revocation is surfaced explicitly.

## State persistence

The service persists a versioned JSON state file using an atomic temporary-file rename. Parent directories are created mode `0700`; the state file is written mode `0600`.

State version 2 includes display identities, hashed device credentials, heartbeat metadata, per-display prayer-board overrides, mosque-default prayer-board configurations and the service default. Version 1 state is migrated to the Stage 23.10 model with a safe Heritage Classic configuration derived from the former theme accent. Plaintext device credentials are never written to the service state file.

On the display, `salahos.managedPrayerBoardCache` stores only the validated last-known-good managed prayer-board payload: display ID, content revision, complete normalized template configuration and cache timestamp. Corrupt cache data fails closed.

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
