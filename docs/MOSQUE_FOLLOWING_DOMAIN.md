# Mosque Following and Offline Cache Domain

## Scope

This domain slice adds local congregation state for following managed mosques without coupling mosque discovery or following to device location.

## Invariants

- Users may follow more than one mosque by stable `MosqueId`.
- The preferred mosque, when set, must be one of the followed mosques.
- Unfollowing the preferred mosque clears the preferred selection.
- Cached managed prayer data is retained only for currently followed mosques.
- A cache entry must contain a publication belonging to the same mosque ID.
- Cache entries carry the authoritative publication revision ID, synchronization timestamp and explicit stale-after timestamp.
- Cache freshness is reported as `missing`, `fresh` or `stale`; stale data remains available for offline presentation rather than being silently discarded.
- No device coordinates are part of `MosqueFollowingState` or its cache records.

## Privacy boundary

Following a mosque is an explicit user choice based on the mosque's stable identifier. It is not derived from, nor does it store, precise device coordinates. A future nearby-search transport may request location only through a separate, explicit flow.

## Offline behavior

The cache holds the last known published prayer configuration for each followed mosque. This allows congregation and display layers to keep presenting managed mosque prayer information when the network is unavailable while also exposing synchronization age and stale status to the UI.

## Out of scope

This slice does not add network discovery, account synchronization, server persistence, background refresh, or UI. Those layers can consume this local domain contract later without changing the personal prayer engine.
