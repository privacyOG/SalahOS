# Managed mosque admin dashboard domain

## Purpose

This Stage 24 slice defines the local presentation contract for the managed-mosque administration overview. It intentionally does not introduce server transport, persistence, authentication tokens, media processing or display connectivity.

The dashboard contract gives future admin UI and synchronization adapters one deterministic status model for the information called out in the managed-masjid roadmap.

## Covered status

The model summarizes:

- the currently published prayer revision;
- whether a different draft revision is pending;
- the publication timestamp where one exists;
- upcoming scheduled announcements and events, ordered chronologically;
- managed display counts split into online, stale and offline states;
- synchronization and media-processing errors, newest first;
- a top-level `healthy`, `attention` or `error` state.

A missing publication, pending draft, stale display or offline display requires attention. Any active operational error takes precedence and produces an error state.

## Boundary

This file defines only domain data required by an admin overview. The following remain separate later-stage concerns:

- authenticated server queries and mutations;
- announcement and event authoring models;
- display pairing and fleet synchronization;
- media upload and processing pipelines;
- persistence and optimistic concurrency;
- concrete admin screen layout, responsive navigation and interaction design.

The dashboard must not become a dependency of local personal prayer calculation. Existing account-free prayer functionality remains independent of managed administration.

## Validation rules

All timestamps in the dashboard contract are canonical ISO-8601 UTC strings. A publication timestamp cannot exist without a published revision. Upcoming items are filtered relative to the supplied dashboard time and sorted deterministically. Returned status structures are immutable.
