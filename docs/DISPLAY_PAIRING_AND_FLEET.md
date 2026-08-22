# Display pairing and fleet domain

**Author:** privacyOG

## Purpose

This slice defines stable display identity, short-lived pairing sessions, normalized heartbeat status, content-revision reconciliation, rollout selection, and the transport contract used by remotely managed smart displays.

The personal prayer experience remains independent from display pairing and does not require an account.

## Stable display identity

A display identity is normalized from:

- display ID;
- organization ID;
- mosque ID;
- location ID;
- orientation (`landscape` or `portrait`);
- resolution-profile identifier;
- optional playlist identifier.

Identifiers are lowercase, URL-safe, bounded strings. Display configuration is kept separate from a public mosque profile and from a prayer timetable so those records can evolve independently.

## Pairing state machine

`createDisplayPairingSession` produces a short-lived challenge that stores only a SHA-256 digest of the supplied challenge text.

The allowed lifecycle is:

1. `pending`
2. `approved`
3. `consumed`

`pending` may also transition to `expired` or `revoked`.

Approval and consumption are organization-scoped. Once consumed, the same pairing session cannot be replayed. The domain never stores an access token, password or API credential.

## Fleet health and synchronization

Display heartbeats report:

- display ID;
- observation time;
- application version;
- current applied content revision;
- applied prayer-board template identifier when available.

`buildDisplayFleetStatus` compares the heartbeat to the target revision and returns one of:

- `current`
- `syncing`
- `stale`
- `offline`
- `revoked`

The original pure-domain thresholds are intentionally stricter than the self-hosted Stage 36 reference service's operational UI thresholds. Both paths expose the same explicit state vocabulary rather than hiding connectivity failures.

Managed fleet status additionally distinguishes the target prayer-board assignment from what the device last reported as actually applied. The administration surface can therefore show effective template, assignment source, target configuration revision, reported applied revision and reported applied template together.

## Revision reconciliation

Remote configuration publication uses optimistic revisions. An administrator submits both the revision they read and a strictly higher target revision. A stale writer receives a conflict rather than overwriting a newer configuration.

Stage 23.10 stores the complete validated prayer-board template configuration in the same revisioned managed-display configuration. Effective assignment follows compatible per-display override, then compatible mosque default, then the deterministic service default.

The display polls its assigned configuration and reconciles it against a validated last-known-good prayer-board cache:

- no local cache or a newer remote revision -> validate, persist and apply the remote configuration;
- newer local cached revision -> retain the local known-good configuration;
- equal revision with equal configuration -> retain the cache;
- equal revision with different configuration -> report a conflict rather than silently replacing known-good state.

The display then reports the revision and template it actually applied in its next authenticated heartbeat. Reconciliation affects presentation only and does not interrupt local prayer calculation, source selection, Iqamah values or next-prayer state.

## Prayer-board target compatibility

The managed publication path resolves stable display identity into an exact target before publication. The currently validated Stage 23.10 managed targets are landscape `1920×1080` and `3840×2160`; legacy 1080p/4K aliases resolve to those exact dimensions.

The administrator must preview the current draft at the physical display's exact resolved target before publication is enabled. Unsupported portrait, Touch Display and other unvalidated target combinations are rejected rather than silently stretched.

## Last-known-good display cache

The display keeps a versioned local managed prayer-board cache containing:

- display ID;
- applied content revision;
- complete normalized prayer-board template configuration;
- cache timestamp.

The cache key participates in native application-storage hydration so Android/iOS restart can restore the known-good configuration before a remote service is reachable. Corrupt cache data fails closed.

If remote configuration or optional managed media synchronization fails, the cached built-in-capable prayer-board configuration continues rendering while local prayer calculation remains authoritative. On reconnect, the revision rules above determine whether remote state is applied, retained or reported as conflicting.

## Self-hosted managed transport

Stage 36 adds a concrete optional transport described in `docs/REMOTE_MANAGED_ADMINISTRATION.md`.

The reference implementation provides:

- administrator-authenticated fleet listing, enrollment, configuration and revocation;
- revisioned mosque-default prayer-board configuration with per-display overrides/inheritance;
- exact-target compatibility validation and preview-before-publication;
- one-time per-display credentials with only SHA-256 digests persisted server-side;
- authenticated display configuration polling and heartbeat reporting of applied revision/template;
- atomic local service state persistence with safe v1 -> v2 prayer-board migration;
- a browser fleet-management surface;
- a local device-provisioning surface;
- native-persisted last-known-good prayer-board caching;
- smart-display polling, reconnect reconciliation and offline-cache runtime status presentation.

Ordinary application networking remains forbidden by repository policy. Only the reviewed `src/platform/managedAdminTransport.ts` adapter may issue application network requests.

## Rollouts

`createDisplayRolloutPlan` deterministically selects a percentage of eligible display IDs by hashing the normalized display ID and rollout seed.

This gives a future managed-control plane a stable canary mechanism without letting device enumeration order affect rollout membership.

## Boundary

The remote administration channel is deliberately typed. It is not a remote shell and does not accept arbitrary HTML, JavaScript, CSS or operating-system commands.

Authentication, display credentials and remote transport remain optional managed-mosque features. Personal SalahOS prayer operation continues to work without them.
