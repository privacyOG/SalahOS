# Managed signage content model

Stage 26 introduces the shared domain contract for mosque-managed display scenes. The model is deliberately independent of a remote transport, persistence provider or device fleet so the same validated scene records can be cached and rendered locally by TV, kiosk and Raspberry Pi deployments.

## Scene types

The signage model supports:

- the existing SalahOS prayer board as a first-class `prayer-board` scene;
- managed announcement scenes;
- managed event scenes;
- image scenes;
- approved web-content scenes;
- QR-code scenes for safe external actions;
- countdown scenes for Ramadan, Jumu'ah or events.

Announcement and event scenes reference the stable managed-domain identifiers rather than duplicating content. Prayer-board scenes likewise reference a prayer-profile identifier.

## Remote-content safety

Image and QR targets accept only credential-free HTTP(S) URLs. Web scenes additionally require an explicit hostname allowlist, and the requested URL must match one of those normalized hosts. This contract does not permit arbitrary script or HTML injection into a scene record.

Web content remains subject to a later hosted-content security layer, including framing, CSP and origin policy. The domain allowlist here is a necessary validation boundary rather than the complete browser-security implementation.

## Deterministic offline fallback

Every scene declares one of three offline behaviours:

- `retain-last-good` — continue showing the last validated cached scene;
- `prayer-board` — replace the unavailable scene with the local prayer-board experience;
- `hide-scene` — omit the scene while offline.

This keeps offline behavior explicit and deterministic. A network or remote-content failure must never block SalahOS local prayer calculation or the local prayer board.

## Boundaries

This slice does not add playlist ordering, dwell durations, scheduling, conflict resolution, display pairing, device fleet state or remote synchronization. Those remain separate Stage 26 slices.
