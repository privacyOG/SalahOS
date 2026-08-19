# Signage playlists and scheduling

This document defines the managed-display playlist and scheduling contract for SalahOS Stage 26 / Phase 2E.2.

## Playlists

A playlist is an ordered list of signage scene identifiers. Each scene has an explicit dwell duration between 5 and 3600 seconds. Playlists carry a positive revision number so displays can cache and compare managed content deterministically.

A playlist belongs to one mosque, has a stable lowercase-safe identifier and contains 1-100 unique scene identifiers. Scene content itself remains defined by the signage scene domain.

## Time-window schedules

Time-window rules can restrict a playlist by:

- optional start and end calendar dates;
- one or more weekdays, or every weekday when the list is empty;
- local start and end clocks;
- a scheduling context: all, normal, Jumu'ah or Ramadan;
- an integer priority.

Equal start and end clocks represent a full local day. Overnight windows such as 22:00-06:00 are supported.

The schedule evaluator consumes mosque-local date, weekday and wall-clock values. Time-zone conversion belongs to the caller so the domain remains deterministic and testable.

## Prayer-relative schedules

Prayer-relative rules can activate a playlist before or after Fajr, Dhuhr, Asr, Maghrib, Isha or Jumu'ah. Each rule defines:

- a prayer key;
- an offset in minutes from the supplied local prayer time;
- an active duration;
- a context and priority.

This supports cases such as showing a reminder scene for 30 minutes before Jumu'ah or before an Iqamah-aligned supplied prayer time. The evaluator does not recalculate prayer times; it consumes authoritative local prayer clocks supplied by the existing SalahOS prayer domain.

## Jumu'ah and Ramadan overrides

Rules can be context-specific. A Jumu'ah or Ramadan rule can override a general rule using priority. When equal-priority rules overlap, an exact context match wins over an `all` rule.

## Deterministic conflict resolution

When multiple rules match the same local moment, SalahOS resolves them in this order:

1. higher numeric priority;
2. exact context match over `all`;
3. prayer-relative rule over time-window rule;
4. lexical rule identifier as the final deterministic tie-breaker.

`resolveSignageSchedule` returns the winning rule, the ordered matching rule identifiers and a human-readable decision basis suitable for an administration preview.

## Active and next playlist cache

Displays can persist a small revisioned cache containing:

- active playlist identifier;
- next playlist identifier;
- strict UTC cache timestamp;
- cache revision.

This cache contract is intentionally transport-independent. A display can continue using its last-known-good active and next playlist metadata when remote synchronization is unavailable.

## Boundaries

This slice does not implement remote persistence, synchronized delivery, display pairing, device fleet status or the visual administration editor. Those remain separate managed-display phases.

Local prayer calculation and personal prayer functionality remain independent of managed signage scheduling and do not require an account or remote service.
