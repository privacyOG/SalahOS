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
- current content revision.

`buildDisplayFleetStatus` compares the heartbeat to the target revision and returns one of:

- `current`
- `syncing`
- `stale`
- `offline`
- `revoked`

The original pure-domain thresholds are intentionally stricter than the self-hosted Stage 36 reference service's operational UI thresholds. Both paths expose the same explicit state vocabulary rather than hiding connectivity failures.

## Revision reconciliation

Remote configuration publication uses optimistic revisions. An administrator submits both the revision they read and a strictly higher target revision. A stale writer receives a conflict rather than overwriting a newer configuration.

The display polls its assigned configuration, applies supported typed settings, and then reports the applied revision in its next authenticated heartbeat. Remote transport is fail-soft: the cached prayer screen continues to operate when the service cannot be reached.

## Self-hosted managed transport

Stage 36 adds a concrete optional transport described in `docs/REMOTE_MANAGED_ADMINISTRATION.md`.

The reference implementation provides:

- administrator-authenticated fleet listing, enrollment, configuration and revocation;
- one-time per-display credentials with only SHA-256 digests persisted server-side;
- authenticated display configuration polling and heartbeat reporting;
- atomic local service state persistence;
- a browser fleet-management surface;
- a local device-provisioning surface;
- smart-display polling and runtime status presentation.

Ordinary application networking remains forbidden by repository policy. Only the reviewed `src/platform/managedAdminTransport.ts` adapter may issue application network requests.

## Rollouts

`createDisplayRolloutPlan` deterministically selects a percentage of eligible display IDs by hashing the normalized display ID and rollout seed.

This gives a future managed-control plane a stable canary mechanism without letting device enumeration order affect rollout membership.

## Boundary

The remote administration channel is deliberately typed. It is not a remote shell and does not accept arbitrary HTML, JavaScript, CSS or operating-system commands.

Authentication, display credentials and remote transport remain optional managed-mosque features. Personal SalahOS prayer operation continues to work without them.
