# Display pairing and fleet management

This stage defines the local-first domain model for managed SalahOS displays. It covers device identity, short-lived pairing, assignment, fleet health, cached operation and deterministic reconnect reconciliation.

## Display identity and assignment

Each display has a stable display ID and is assigned to an organization, mosque and location. Presentation metadata includes orientation, resolution profile and an optional managed playlist assignment.

The model deliberately separates display assignment from administrator authentication. Public or semi-public screens should never require administrators to type account credentials into the device.

## Pairing codes

Pairing uses a six-character uppercase alphanumeric code. A pairing record contains:

- display ID
- expiry timestamp
- optional used timestamp
- optional revoked timestamp

A code is usable only while it is unexpired, unused and unrevoked. Expiry, use and revocation timestamps use strict ISO-8601 UTC values.

The domain contract is compatible with a server issuing short-lived pairing codes and consuming them once. Transport, account authentication and server persistence are intentionally outside this slice.

## Fleet health

Fleet status records expose the fields needed by an administration dashboard:

- last-seen timestamp
- application version
- content revision
- synchronization state

Synchronization states are `current`, `syncing`, `offline`, `stale` and `revoked`.

## Offline continuity

A display retains its most recently cached playlist assignment and content revision. The cache also records whether local prayer functionality remains available.

Loss of network connectivity does not invalidate the cached configuration and does not disable local prayer capability. This preserves the local-first prayer-board behavior established elsewhere in SalahOS.

## Reconnect reconciliation

When connectivity returns, local and remote configuration are reconciled deterministically:

1. A remotely revoked display resolves to `revoke`.
2. A higher remote content revision resolves to `apply-remote`.
3. Equal revisions with different playlist assignments resolve to `report-conflict` rather than silently selecting one.
4. Otherwise the display resolves to `keep-local`.

The reconciliation result always carries the effective revision, effective playlist and local-prayer availability so the caller can continue operating without losing local prayer functionality.

## Security and validation

- IDs are normalized stable lowercase-safe identifiers.
- Pairing codes are exactly six uppercase letters or digits.
- Pairing and fleet timestamps are strict UTC timestamps.
- Content revisions are non-negative integers.
- Application versions use semantic-version form.
- Pairing state is independent from administrator credentials.

## Boundary

This stage does not implement remote persistence, network transport, administrator authentication, device push channels, remote command execution, telemetry collection or a concrete fleet-management screen. Those concerns should consume this domain contract while preserving its pairing, revocation and offline-continuity guarantees.
