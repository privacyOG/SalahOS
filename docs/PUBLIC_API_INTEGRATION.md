# Public API and integration surface

SalahOS exposes a deliberately narrow public read-only contract for published mosque information. The contract is versioned independently from administration and must never be used to expose member, role, session, invitation, audit, pairing or other privileged records.

## Versioning

The first public contract is `v1`. Public endpoint paths are versioned under `/api/v1` so breaking schema changes can be introduced without silently changing existing integrations.

## Read-only endpoints

- `GET /api/v1/mosques/:mosqueId` — published mosque profile data.
- `GET /api/v1/mosques/:mosqueId/prayers/:date` — published Salah start, Iqamah and Jumu'ah data for one Gregorian date using `YYYY-MM-DD`.
- `GET /api/v1/mosques/:mosqueId/timetables/:month` — published monthly timetable data using `YYYY-MM`.

The contract module records cache and rate-limit policy metadata for each endpoint. Profile and daily-prayer responses use short public caching suitable for current information. Monthly timetable responses use a longer public cache window. Implementations must enforce the declared request-rate ceilings at the hosted edge or service layer.

## Public data boundary

Allowed public information is limited to published mosque identity/profile data, public contact/facilities, prayer-source provenance, publication timestamp/revision, Salah, Iqamah, Jumu'ah and optional Hijri context.

The public contract explicitly forbids administration and private member data including memberships, roles, sessions, invitations, audit records, notification device tokens, display pairing codes, private notes and private administrator contact data.

Public payload assembly must call the public-payload guard before serialization. Hosted transport must also project from an explicit public schema rather than serializing internal administration records directly.

## Website example

A website that needs today's published prayer data can request:

```text
GET /api/v1/mosques/masjid.one/prayers/2026-08-20
```

The response should be cached according to the endpoint policy and treated as published mosque data, not as the user's personal calculation settings.

For presentation-only integrations, prefer the SalahOS-owned embeddable widgets described in `PUBLIC_EMBED_WIDGETS.md` rather than rebuilding the UI from raw API data.

## Local signage example

A managed or local signage integration can retrieve the current month:

```text
GET /api/v1/mosques/masjid.one/timetables/2026-08
```

The client should retain its last-known-good published timetable for offline display. Loss of this public endpoint must never block SalahOS local prayer calculation or invalidate locally stored personal settings.

## Security requirements

- Public endpoints are `GET` only.
- No administration mutation endpoint is part of this public contract.
- Authentication/session data must never appear in public responses.
- Hosted implementations must enforce the declared rate limits.
- Hosted implementations should emit the declared public cache policy and stable schema version.
- Internal models must be projected into explicit public response schemas rather than exposed wholesale.
- Public errors must not reveal internal identifiers, stack traces, authorization state or member data.

This document defines the integration contract and security boundary. The hosted service implementation remains responsible for transport, persistence, edge caching and rate-limit enforcement while preserving these invariants.
